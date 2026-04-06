'use client';

import { useEffect, useState } from 'react';
import { useSlideshowStore } from '@/lib/store';
import { trendTemplates } from '@/lib/templates/registry';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { SlideCanvas } from '@/components/editor/SlideCanvas';
import { SlideSettings } from '@/components/editor/SlideSettings';
import { ToolsPanel } from '@/components/editor/ToolsPanel';
import { SlideTimeline } from '@/components/editor/SlideTimeline';
import { ExportDialog } from '@/components/editor/ExportDialog';
import { PreviewPlayer } from '@/components/editor/PreviewPlayer';

export default function CreatePage() {
  const saveProject = useSlideshowStore((s) => s.saveProject);
  const [showExport, setShowExport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [ready, setReady] = useState(false);

  useKeyboardShortcuts();

  // Initialize: read URL params and apply template/project/restore
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get('template');
      const projectId = params.get('project');
      const store = useSlideshowStore.getState();

      if (templateId) {
        const template = trendTemplates.find((t) => t.id === templateId);
        if (template) store.applyTemplate(template);
      } else if (projectId) {
        await store.loadProject(projectId);
      } else {
        await store.restoreLastProject();
      }

      // Restore API keys
      try {
        const keys = localStorage.getItem('slideviral-api-keys');
        if (keys) useSlideshowStore.setState({ apiKeys: JSON.parse(keys) });
      } catch { /* ignore */ }

      // Always restore saved audio selection (overrides auto-select from template)
      try {
        const savedAudio = localStorage.getItem('slideviral-audio');
        if (savedAudio) {
          const { url, name } = JSON.parse(savedAudio);
          if (url) {
            useSlideshowStore.setState({
              selectedAudioUrl: url,
              selectedAudioName: name,
            });
          }
        }
      } catch { /* ignore */ }

      setReady(true);
    }
    init();
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => saveProject(), 30_000);
    return () => clearInterval(interval);
  }, [saveProject, ready]);

  // Listen for export toggle from header
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
      <div className="flex h-[calc(100vh-3.5rem-5rem)] overflow-hidden">
        <SlideSettings />
        <SlideCanvas />
        <ToolsPanel />
      </div>
      <SlideTimeline />

      {/* Preview button — floating above timeline */}
      <button
        onClick={() => setShowPreview(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Preview
      </button>

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
      <PreviewPlayer open={showPreview} onClose={() => setShowPreview(false)} />
    </>
  );
}
