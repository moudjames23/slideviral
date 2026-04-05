'use client';

import { useCallback } from 'react';
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';

export function SlideTimeline() {
  const {
    slideshow,
    activeSlideIndex,
    setActiveSlide,
    addSlide,
    removeSlide,
    duplicateSlide,
    reorderSlides,
  } = useSlideshowStore();

  // Simple drag reorder state
  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData('slide-index', String(index));
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = Number(e.dataTransfer.getData('slide-index'));
      if (fromIndex !== toIndex) {
        reorderSlides(fromIndex, toIndex);
      }
    },
    [reorderSlides],
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-thin">
        {/* Slides */}
        {slideshow.slides.map((slide, i) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, i)}
            onClick={() => setActiveSlide(i)}
            className={`group relative flex shrink-0 cursor-pointer items-end rounded-lg border-2 transition-all ${
              i === activeSlideIndex
                ? 'border-primary shadow-sm shadow-primary/20'
                : 'border-border hover:border-primary/30'
            }`}
            style={{ width: 56, height: 80 }}
          >
            {/* Thumbnail */}
            <div
              className="absolute inset-0 rounded-md overflow-hidden"
              style={{ backgroundColor: slide.backgroundColor }}
            >
              {slide.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              )}
            </div>

            {/* Slide number */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-card border border-border px-1 text-[10px] font-bold text-foreground shadow-sm">
              {i + 1}
            </div>

            {/* App promo badge */}
            {slide.isAppPromo && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[7px] font-bold uppercase text-primary-foreground shadow-sm">
                promo
              </div>
            )}

            {/* Duration label */}
            <div className="absolute top-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-mono text-white">
              {slide.duration}s
            </div>

            {/* Grip handle (visible on hover) */}
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-3 w-3 text-white/60" />
            </div>

            {/* Hover actions */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-md p-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateSlide(i);
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </button>
              {slideshow.slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(i);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Transition indicator between slides */}
            {i < slideshow.slides.length - 1 && slide.transition !== 'none' && (
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <div className="h-4 w-4 rounded-full bg-muted border border-border flex items-center justify-center">
                  <span className="text-[7px] text-muted-foreground">
                    {slide.transition === 'fade' ? 'F' : slide.transition === 'slide-left' ? '→' : slide.transition === 'zoom-in' ? '+' : '~'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add slide button */}
        <button
          onClick={() => addSlide()}
          className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Spacer for total duration + shortcuts hint */}
        <div className="ml-auto shrink-0 flex items-center gap-4 pl-4 border-l border-border">
          <span className="text-xs text-muted-foreground">
            Total: {slideshow.slides.reduce((sum, s) => sum + s.duration, 0)}s
          </span>
          <span className="hidden lg:flex items-center gap-2 text-[10px] text-muted-foreground/60">
            <kbd className="rounded border border-border px-1 py-0.5 font-mono">←→</kbd> navigate
            <kbd className="rounded border border-border px-1 py-0.5 font-mono">N</kbd> new
            <kbd className="rounded border border-border px-1 py-0.5 font-mono">⌘S</kbd> save
            <kbd className="rounded border border-border px-1 py-0.5 font-mono">⌘D</kbd> duplicate
          </span>
        </div>
      </div>
    </div>
  );
}
