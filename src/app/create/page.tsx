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

  // Listen for export/preview toggle events
  useEffect(() => {
    const exportHandler = () => setShowExport((prev) => !prev);
    const previewHandler = () => setShowPreview((prev) => !prev);
    window.addEventListener('slideviral:toggle-export', exportHandler);
    window.addEventListener('slideviral:toggle-preview', previewHandler);
    return () => {
      window.removeEventListener('slideviral:toggle-export', exportHandler);
      window.removeEventListener('slideviral:toggle-preview', previewHandler);
    };
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

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
      <PreviewPlayer open={showPreview} onClose={() => setShowPreview(false)} />
    </>
  );
}
