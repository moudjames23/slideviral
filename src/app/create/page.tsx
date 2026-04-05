'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSlideshowStore } from '@/lib/store';
import { trendTemplates } from '@/lib/templates/registry';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { SlideCanvas } from '@/components/editor/SlideCanvas';
import { SlideSettings } from '@/components/editor/SlideSettings';
import { ToolsPanel } from '@/components/editor/ToolsPanel';
import { SlideTimeline } from '@/components/editor/SlideTimeline';

function EditorContent() {
  const searchParams = useSearchParams();
  const { applyTemplate, loadProject } = useSlideshowStore();

  const saveProject = useSlideshowStore((s) => s.saveProject);

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

  return (
    <div className="flex h-[calc(100vh-3.5rem-5rem)] overflow-hidden">
      <SlideSettings />
      <SlideCanvas />
      <ToolsPanel />
    </div>
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
