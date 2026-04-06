'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSlideshowStore } from '@/lib/store';
import { trendTemplates } from '@/lib/templates/registry';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { SlideCanvas } from '@/components/editor/SlideCanvas';
import { SlideSettings } from '@/components/editor/SlideSettings';
import { ToolsPanel } from '@/components/editor/ToolsPanel';
import { SlideTimeline } from '@/components/editor/SlideTimeline';
import { ExportDialog } from '@/components/editor/ExportDialog';

function EditorContent() {
  const searchParams = useSearchParams();
  const { applyTemplate, loadProject } = useSlideshowStore();
  const saveProject = useSlideshowStore((s) => s.saveProject);
  const [showExport, setShowExport] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Load template or project on mount
  useEffect(() => {
    const templateId = searchParams.get('template');
    const projectId = searchParams.get('project');

    if (templateId) {
      const template = trendTemplates.find((t) => t.id === templateId);
      if (template) applyTemplate(template);
    } else if (projectId) {
      loadProject(projectId);
    }
  }, [searchParams, applyTemplate, loadProject]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProject();
    }, 30_000);
    return () => clearInterval(interval);
  }, [saveProject]);

  // Listen for export toggle from header
  useEffect(() => {
    function handleToggleExport() {
      setShowExport((prev) => !prev);
    }
    window.addEventListener('slideviral:toggle-export', handleToggleExport);
    return () => window.removeEventListener('slideviral:toggle-export', handleToggleExport);
  }, []);

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem-5rem)] overflow-hidden">
        <SlideSettings />
        <SlideCanvas />
        <ToolsPanel />
      </div>
      <ExportDialog open={showExport} onClose={() => setShowExport(false)} />
    </>
  );
}

export default function CreatePage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading editor...</div>
          </div>
        }
      >
        <EditorContent />
      </Suspense>
      <SlideTimeline />
    </>
  );
}
