'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSlideshowStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const {
    slideshow,
    activeSlideIndex,
    setActiveSlide,
    removeSlide,
    duplicateSlide,
    addSlide,
    saveProject,
  } = useSlideshowStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl/Cmd + S — Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
        toast.success('Project saved');
        return;
      }

      // Ctrl/Cmd + D — Duplicate slide
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSlide(activeSlideIndex);
        toast.success('Slide duplicated');
        return;
      }

      // Don't handle navigation shortcuts when typing
      if (isInput) return;

      // Arrow Left — Previous slide
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeSlideIndex > 0) setActiveSlide(activeSlideIndex - 1);
        return;
      }

      // Arrow Right — Next slide
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeSlideIndex < slideshow.slides.length - 1) setActiveSlide(activeSlideIndex + 1);
        return;
      }

      // Delete / Backspace — Remove slide (only if more than 1)
      if ((e.key === 'Delete' || e.key === 'Backspace') && slideshow.slides.length > 1) {
        e.preventDefault();
        removeSlide(activeSlideIndex);
        toast.success('Slide removed');
        return;
      }

      // N — New slide
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        addSlide();
        toast.success('Slide added');
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideshow, activeSlideIndex, setActiveSlide, removeSlide, duplicateSlide, addSlide, saveProject]);
}
