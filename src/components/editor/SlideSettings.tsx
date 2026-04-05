'use client';

import { Clock, ArrowLeftRight, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSlideshowStore } from '@/lib/store';
import { ASPECT_RATIOS } from '@/types';
import type { AspectRatio, SlideTransition } from '@/types';

const transitions: { value: SlideTransition; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'zoom-out', label: 'Zoom Out' },
  { value: 'dissolve', label: 'Dissolve' },
];

export function SlideSettings() {
  const {
    slideshow,
    activeSlideIndex,
    updateSlide,
    setAspectRatio,
    setSlideshowName,
    saveProject,
  } = useSlideshowStore();

  const activeSlide = slideshow.slides[activeSlideIndex];

  if (!activeSlide) return null;

  return (
    <div className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto">
      {/* Project name */}
      <div className="p-4 border-b border-border">
        <label className="text-xs font-medium text-muted-foreground">Project</label>
        <input
          type="text"
          value={slideshow.name}
          onChange={(e) => setSlideshowName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => { saveProject(); toast.success('Project saved'); }}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          <Save className="h-3 w-3" />
          Save project
        </button>
      </div>

      <div className="p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Slide Settings
        </h2>

        <div className="mt-4 space-y-5">
          {/* Aspect Ratio */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Format</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
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
              Duration
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={activeSlide.duration}
                onChange={(e) =>
                  updateSlide(activeSlideIndex, { duration: Number(e.target.value) })
                }
                className="flex-1 accent-primary"
              />
              <span className="w-10 text-right text-sm font-mono text-muted-foreground">
                {activeSlide.duration}s
              </span>
            </div>
          </div>

          {/* Transition */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Transition
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {transitions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSlide(activeSlideIndex, { transition: value })}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    activeSlide.transition === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
              <div className="flex gap-1">
                {['#000000', '#ffffff', '#1a1a2e', '#0f3460', '#e94560'].map((c) => (
                  <button
                    key={c}
                    onClick={() => updateSlide(activeSlideIndex, { backgroundColor: c })}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      activeSlide.backgroundColor === c ? 'border-primary' : 'border-border'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* App Promo indicator */}
          {activeSlide.isAppPromo && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary">App Promo Slide</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                This is your &quot;stealth ad&quot; slide. Upload a screenshot of your app here.
                It should look native to the slideshow flow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
