'use client';

import { useRef, useState, useCallback } from 'react';
import { ImageIcon } from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import { ASPECT_RATIOS } from '@/types';
import type { TextOverlay } from '@/types';

interface DragState {
  overlayId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export function SlideCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { slideshow, activeSlideIndex, updateSlide } = useSlideshowStore();
  const activeSlide = slideshow.slides[activeSlideIndex];
  const ratio = ASPECT_RATIOS[slideshow.aspectRatio];

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);

  // Compute canvas dimensions to fit container while maintaining ratio
  const maxHeight = 560;
  const canvasHeight = maxHeight;
  const canvasWidth = (ratio.width / ratio.height) * canvasHeight;

  // Handle drag for text overlays
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, overlay: TextOverlay) => {
      e.stopPropagation();
      e.preventDefault();
      setSelectedOverlayId(overlay.id);
      setDragState({
        overlayId: overlay.id,
        startX: e.clientX,
        startY: e.clientY,
        originX: overlay.x,
        originY: overlay.y,
      });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragState.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragState.startY) / rect.height) * 100;
      const newX = Math.max(5, Math.min(95, dragState.originX + dx));
      const newY = Math.max(5, Math.min(95, dragState.originY + dy));

      const overlays = activeSlide.textOverlays.map((o) =>
        o.id === dragState.overlayId ? { ...o, x: newX, y: newY } : o,
      );
      updateSlide(activeSlideIndex, { textOverlays: overlays });
    },
    [dragState, activeSlide, activeSlideIndex, updateSlide],
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Click on canvas background = deselect
  const handleCanvasClick = useCallback(() => {
    setSelectedOverlayId(null);
    setEditingOverlayId(null);
  }, []);

  // Handle text editing
  const handleDoubleClick = useCallback((overlayId: string) => {
    setEditingOverlayId(overlayId);
    setSelectedOverlayId(overlayId);
  }, []);

  const handleTextChange = useCallback(
    (overlayId: string, content: string) => {
      const overlays = activeSlide.textOverlays.map((o) =>
        o.id === overlayId ? { ...o, content } : o,
      );
      updateSlide(activeSlideIndex, { textOverlays: overlays });
    },
    [activeSlide, activeSlideIndex, updateSlide],
  );

  // Handle image drop on canvas
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          updateSlide(activeSlideIndex, { imageUrl: ev.target?.result as string });
        };
        reader.readAsDataURL(files[0]);
      }
    },
    [activeSlideIndex, updateSlide],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  if (!activeSlide) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-xl shadow-lg transition-shadow hover:shadow-xl"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: activeSlide.backgroundColor,
          cursor: dragState ? 'grabbing' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Background image */}
        {activeSlide.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeSlide.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <ImageIcon className="h-8 w-8 text-white/40" />
            </div>
            <p className="text-sm text-white/40">
              Drop an image here
            </p>
          </div>
        )}

        {/* Text overlays */}
        {activeSlide.textOverlays.map((overlay) => {
          const isSelected = selectedOverlayId === overlay.id;
          const isEditing = editingOverlayId === overlay.id;

          return (
            <div
              key={overlay.id}
              className={`absolute select-none transition-[outline] ${
                isSelected
                  ? 'outline-2 outline-dashed outline-primary outline-offset-4 rounded'
                  : ''
              }`}
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                maxWidth: `${overlay.maxWidth}%`,
                cursor: isEditing ? 'text' : dragState?.overlayId === overlay.id ? 'grabbing' : 'grab',
                zIndex: isSelected ? 10 : 1,
              }}
              onMouseDown={(e) => !isEditing && handleMouseDown(e, overlay)}
              onDoubleClick={() => handleDoubleClick(overlay.id)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOverlayId(overlay.id);
              }}
            >
              {isEditing ? (
                <textarea
                  autoFocus
                  value={overlay.content}
                  onChange={(e) => handleTextChange(overlay.id, e.target.value)}
                  onBlur={() => setEditingOverlayId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingOverlayId(null);
                  }}
                  className="w-full resize-none border-none bg-transparent outline-none"
                  style={{
                    fontSize: overlay.fontSize,
                    fontWeight: overlay.fontWeight,
                    color: overlay.color,
                    textAlign: overlay.textAlign,
                    textShadow: overlay.textShadow,
                    fontFamily: overlay.fontFamily,
                    lineHeight: overlay.lineHeight ?? 1.3,
                    letterSpacing: overlay.letterSpacing,
                  }}
                  rows={Math.max(1, overlay.content.split('\n').length)}
                />
              ) : (
                <div
                  style={{
                    fontSize: overlay.fontSize,
                    fontWeight: overlay.fontWeight,
                    color: overlay.color,
                    textAlign: overlay.textAlign,
                    textShadow: overlay.textShadow,
                    fontFamily: overlay.fontFamily,
                    lineHeight: overlay.lineHeight ?? 1.3,
                    letterSpacing: overlay.letterSpacing,
                    backgroundColor: overlay.backgroundColor,
                    padding: overlay.backgroundColor ? '4px 8px' : undefined,
                    borderRadius: overlay.backgroundColor ? '4px' : undefined,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {overlay.content || 'Double-click to edit'}
                </div>
              )}
            </div>
          );
        })}

        {/* App promo badge */}
        {activeSlide.isAppPromo && (
          <div className="absolute top-3 right-3 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold text-primary-foreground uppercase tracking-wider shadow-sm">
            App Promo
          </div>
        )}
      </div>

      {/* Slide info + preview button */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('slideviral:toggle-preview'))}
          className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary font-medium transition-colors hover:bg-primary/20"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Preview
        </button>
        <span className="text-border">·</span>
        <span>
          Slide {activeSlideIndex + 1}/{slideshow.slides.length}
        </span>
        <span className="text-border">·</span>
        <span>{activeSlide.duration}s</span>
        <span className="text-border">·</span>
        <span>{slideshow.aspectRatio}</span>
      </div>
    </div>
  );
}
