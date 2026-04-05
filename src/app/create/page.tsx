'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, Copy, Image as ImageIcon, Type, Clock, ArrowLeftRight, Sparkles } from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import { trendTemplates } from '@/lib/templates/registry';
import { ASPECT_RATIOS } from '@/types';

function EditorContent() {
  const searchParams = useSearchParams();
  const {
    slideshow,
    activeSlideIndex,
    setActiveSlide,
    addSlide,
    removeSlide,
    duplicateSlide,
    updateSlide,
    applyTemplate,
    setAspectRatio,
  } = useSlideshowStore();

  const activeSlide = slideshow.slides[activeSlideIndex];
  const ratio = ASPECT_RATIOS[slideshow.aspectRatio];

  // Apply template or load project on mount
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId) {
      const template = trendTemplates.find((t) => t.id === templateId);
      if (template) applyTemplate(template);
    }
  }, [searchParams, applyTemplate]);

  // Canvas dimensions (fit in available space)
  const canvasMaxHeight = 500;
  const canvasWidth = (ratio.width / ratio.height) * canvasMaxHeight;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Panel — Slide Settings */}
      <div className="w-72 shrink-0 border-r border-border bg-card p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Slide Settings
        </h2>

        {activeSlide && (
          <div className="mt-4 space-y-5">
            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {(Object.keys(ASPECT_RATIOS) as Array<keyof typeof ASPECT_RATIOS>).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      slideshow.aspectRatio === r
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Duration: {activeSlide.duration}s
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={activeSlide.duration}
                onChange={(e) =>
                  updateSlide(activeSlideIndex, { duration: Number(e.target.value) })
                }
                className="mt-1.5 w-full accent-primary"
              />
            </div>

            {/* Transition */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transition
              </label>
              <select
                value={activeSlide.transition}
                onChange={(e) =>
                  updateSlide(activeSlideIndex, { transition: e.target.value as typeof activeSlide.transition })
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="zoom-in">Zoom In</option>
                <option value="zoom-out">Zoom Out</option>
                <option value="dissolve">Dissolve</option>
              </select>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Background</label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={activeSlide.backgroundColor}
                  onChange={(e) =>
                    updateSlide(activeSlideIndex, { backgroundColor: e.target.value })
                  }
                  className="h-8 w-8 cursor-pointer rounded border border-border"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {activeSlide.backgroundColor}
                </span>
              </div>
            </div>

            {/* App Promo Badge */}
            {activeSlide.isAppPromo && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary">App Promo Slide</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Upload your app screenshot here. This is the &quot;stealth ad&quot; slide.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center — Canvas */}
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 p-8">
        <div
          className="relative rounded-lg border-2 border-dashed border-border bg-card shadow-sm transition-all"
          style={{
            width: canvasWidth,
            height: canvasMaxHeight,
            backgroundColor: activeSlide?.backgroundColor ?? '#000',
          }}
        >
          {activeSlide?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSlide.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover rounded-lg"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">Drop an image here or use AI to generate one</p>
            </div>
          )}

          {/* Text overlays */}
          {activeSlide?.textOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className="absolute cursor-move select-none"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: overlay.fontSize,
                fontWeight: overlay.fontWeight,
                color: overlay.color,
                textAlign: overlay.textAlign,
                maxWidth: `${overlay.maxWidth}%`,
                textShadow: overlay.textShadow,
                fontFamily: overlay.fontFamily,
              }}
            >
              {overlay.content}
            </div>
          ))}
        </div>

        {/* Slide number */}
        <p className="mt-4 text-xs text-muted-foreground">
          Slide {activeSlideIndex + 1} / {slideshow.slides.length}
        </p>
      </div>

      {/* Right Panel — Tools */}
      <div className="w-72 shrink-0 border-l border-border bg-card p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Tools
        </h2>

        <div className="mt-4 space-y-2">
          <button className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/80">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Upload Image
          </button>
          <button className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/80">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate with AI
          </button>
          <button className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/80">
            <Type className="h-4 w-4 text-muted-foreground" />
            Add Text
          </button>
        </div>
      </div>
    </div>
  );
}

// Timeline (bottom bar)
function Timeline() {
  const { slideshow, activeSlideIndex, setActiveSlide, addSlide, removeSlide, duplicateSlide } =
    useSlideshowStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-4 py-3">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 overflow-x-auto">
        {slideshow.slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setActiveSlide(i)}
            className={`group relative flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
              i === activeSlideIndex
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-muted hover:border-primary/30'
            }`}
            style={{ backgroundColor: slide.imageUrl ? undefined : slide.backgroundColor }}
          >
            {slide.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slide.imageUrl} alt="" className="h-full w-full rounded-md object-cover" />
            )}
            <span className="absolute -top-2 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
              {i + 1}
            </span>
            {slide.isAppPromo && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 text-[8px] font-bold text-primary-foreground">
                AD
              </span>
            )}

            {/* Hover actions */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-md shadow-sm p-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }}
                className="rounded p-1 hover:bg-muted"
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </button>
              {slideshow.slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeSlide(i); }}
                  className="rounded p-1 hover:bg-destructive/10 text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </button>
        ))}

        {/* Add slide button */}
        <button
          onClick={() => addSlide()}
          className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <EditorContent />
      </Suspense>
      <Timeline />
    </>
  );
}
