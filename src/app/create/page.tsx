'use client';

import { useEffect, useState } from 'react';
import { useSlideshowStore } from '@/lib/store';
import { trendTemplates } from '@/lib/templates/registry';
import { api } from '@/lib/api';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { SlideCanvas } from '@/components/editor/SlideCanvas';
import { SlideSettings } from '@/components/editor/SlideSettings';
import { ToolsPanel } from '@/components/editor/ToolsPanel';
import { SlideTimeline } from '@/components/editor/SlideTimeline';
import { ExportDialog } from '@/components/editor/ExportDialog';
import { PreviewPlayer } from '@/components/editor/PreviewPlayer';
import { loadProjectImages } from '@/lib/storage/image-db';
import type { SlideshowData } from '@/types';

export default function CreatePage() {
  const showPreview = useSlideshowStore((s) => s.showPreview);
  const setShowPreview = useSlideshowStore((s) => s.setShowPreview);
  const [showExport, setShowExport] = useState(false);
  const [ready, setReady] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string>('');

  useKeyboardShortcuts();

  // Initialize: load post from API or apply template
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const postIdParam = params.get('post');
      const templateId = params.get('template');
      const store = useSlideshowStore.getState();

      if (postIdParam) {
        setPostId(postIdParam);

        // Load post from SQLite via API
        try {
          const post = await api.posts.get(postIdParam);
          const data = post.slideshowData as SlideshowData;

          // Restore images from IndexedDB
          const slideIds = data.slides.map((s) => s.id);
          const images = await loadProjectImages(postIdParam, slideIds);

          // Rehydrate image URLs
          const slides = data.slides.map((s) => {
            let imageUrl = s.imageUrl;
            if (imageUrl?.startsWith('idb:')) {
              imageUrl = images[imageUrl.slice(4)] || undefined;
            }
            if (!imageUrl && images[s.id]) {
              imageUrl = images[s.id];
            }
            return { ...s, imageUrl };
          });

          // Ensure at least one slide exists
          const finalSlides = slides.length > 0 ? slides : [{
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            textOverlays: [],
            duration: 3,
            transition: 'fade' as const,
            backgroundColor: '#000000',
            isAppPromo: false,
          }];

          store.setSlideshowName(post.name);
          useSlideshowStore.setState({
            slideshow: {
              id: post.id,
              name: post.name,
              slides: finalSlides,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
              aspectRatio: data.aspectRatio || '9:16',
              templateId: data.templateId,
            },
            activeSlideIndex: 0,
          });

          setAccountName(post.accountName);

          // Restore audio from post data
          if (data.audioUrl) {
            useSlideshowStore.setState({
              selectedAudioUrl: data.audioUrl,
              selectedAudioName: data.audioName || null,
            });
          }
        } catch {
          // Post not found — show empty
        }

        // Apply template on top if specified
        if (templateId) {
          const template = trendTemplates.find((t) => t.id === templateId);
          if (template) store.applyTemplate(template);
        }
      } else {
        // No post ID — just apply template if any
        if (templateId) {
          const template = trendTemplates.find((t) => t.id === templateId);
          if (template) store.applyTemplate(template);
        }
      }

      // Restore API keys
      try {
        const keys = localStorage.getItem('slideviral-api-keys');
        if (keys) useSlideshowStore.setState({ apiKeys: JSON.parse(keys) });
      } catch { /* ignore */ }

      // Restore saved audio
      try {
        const savedAudio = localStorage.getItem('slideviral-audio');
        if (savedAudio) {
          const { url, name } = JSON.parse(savedAudio);
          if (url) useSlideshowStore.setState({ selectedAudioUrl: url, selectedAudioName: name });
        }
      } catch { /* ignore */ }

      setReady(true);
    }
    init();
  }, []);

  // Auto-save every 30 seconds to SQLite via API
  useEffect(() => {
    if (!ready || !postId) return;
    const interval = setInterval(async () => {
      const state = useSlideshowStore.getState();
      const { saveProjectImages } = await import('@/lib/storage/image-db');

      // Save images to IndexedDB
      saveProjectImages(postId, state.slideshow.slides).catch(() => {});

      // Save metadata to SQLite
      const slideshowData: SlideshowData = {
        slides: state.slideshow.slides.map((s) => ({
          ...s,
          imageUrl: s.imageUrl?.startsWith('data:') ? `idb:${s.id}` : s.imageUrl,
          imageFile: undefined,
        })),
        aspectRatio: state.slideshow.aspectRatio,
        templateId: state.slideshow.templateId,
        audioUrl: state.selectedAudioUrl || undefined,
        audioName: state.selectedAudioName || undefined,
      };

      api.posts.update(postId, {
        name: state.slideshow.name,
        slideshowData,
      }).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [ready, postId]);

  // Listen for export toggle
  useEffect(() => {
    const handler = () => setShowExport((prev) => !prev);
    window.addEventListener('slideviral:toggle-export', handler);
    return () => window.removeEventListener('slideviral:toggle-export', handler);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <>
      {/* Account breadcrumb */}
      {accountName && (
        <div className="border-b border-border bg-muted/30 px-4 py-1.5">
          <span className="text-xs text-muted-foreground">
            {accountName} / {useSlideshowStore.getState().slideshow.name}
          </span>
        </div>
      )}

      <div className="flex h-[calc(100vh-3.5rem-5rem)] overflow-hidden">
        <SlideSettings />
        <SlideCanvas />
        <ToolsPanel />
      </div>
      <SlideTimeline />

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
      <PreviewPlayer open={showPreview} onClose={() => setShowPreview(false)} />
    </>
  );
}
