'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import { renderSlideToCanvas } from '@/lib/export/renderer';
import { getPlayableAudioUrl } from '@/lib/audio-utils';
import { ASPECT_RATIOS } from '@/types';

interface PreviewPlayerProps {
  open: boolean;
  onClose: () => void;
}

export function PreviewPlayer({ open, onClose }: PreviewPlayerProps) {
  const { slideshow, selectedAudioUrl } = useSlideshowStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);

  const ratio = ASPECT_RATIOS[slideshow.aspectRatio];
  const totalDuration = slideshow.slides.reduce((sum, s) => sum + s.duration, 0);

  // Prerender all slides
  const renderedRef = useRef<HTMLCanvasElement[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function prerender() {
      const canvases: HTMLCanvasElement[] = [];
      for (const slide of slideshow.slides) {
        const c = await renderSlideToCanvas(slide, slideshow.aspectRatio);
        canvases.push(c);
      }
      if (!cancelled) {
        renderedRef.current = canvases;
        setReady(true);
      }
    }
    prerender();

    return () => { cancelled = true; };
  }, [open, slideshow]);

  // Animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current || renderedRef.current.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const totalDur = slideshow.slides.reduce((s, sl) => s + sl.duration, 0);

    if (elapsed >= totalDur) {
      // Loop back
      setIsPlaying(false);
      setCurrentSlideIndex(0);
      setProgress(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Draw first slide
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(renderedRef.current[0], 0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }

    setProgress(elapsed / totalDur);

    // Find current slide
    let acc = 0;
    let slideIdx = 0;
    for (let i = 0; i < slideshow.slides.length; i++) {
      if (elapsed < acc + slideshow.slides[i].duration) {
        slideIdx = i;
        break;
      }
      acc += slideshow.slides[i].duration;
    }
    setCurrentSlideIndex(slideIdx);

    const slideElapsed = elapsed - acc;
    const slideDur = slideshow.slides[slideIdx].duration;
    const transitionDur = 0.5;
    const hasNext = slideIdx < slideshow.slides.length - 1;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Check if in transition zone
    const inTransition = hasNext && slideElapsed >= slideDur - transitionDur;

    if (inTransition && renderedRef.current[slideIdx + 1]) {
      const t = (slideElapsed - (slideDur - transitionDur)) / transitionDur;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      const transition = slideshow.slides[slideIdx].transition;

      switch (transition) {
        case 'fade':
          ctx.globalAlpha = 1;
          ctx.drawImage(renderedRef.current[slideIdx], 0, 0, w, h);
          ctx.globalAlpha = eased;
          ctx.drawImage(renderedRef.current[slideIdx + 1], 0, 0, w, h);
          ctx.globalAlpha = 1;
          break;
        case 'slide-left':
          ctx.drawImage(renderedRef.current[slideIdx], -w * eased, 0, w, h);
          ctx.drawImage(renderedRef.current[slideIdx + 1], w * (1 - eased), 0, w, h);
          break;
        case 'slide-right':
          ctx.drawImage(renderedRef.current[slideIdx], w * eased, 0, w, h);
          ctx.drawImage(renderedRef.current[slideIdx + 1], -w * (1 - eased), 0, w, h);
          break;
        case 'zoom-in': {
          const scale = 1 + eased * 0.3;
          ctx.save();
          ctx.globalAlpha = 1 - eased;
          ctx.translate(w / 2, h / 2);
          ctx.scale(scale, scale);
          ctx.translate(-w / 2, -h / 2);
          ctx.drawImage(renderedRef.current[slideIdx], 0, 0, w, h);
          ctx.restore();
          ctx.globalAlpha = eased;
          ctx.drawImage(renderedRef.current[slideIdx + 1], 0, 0, w, h);
          ctx.globalAlpha = 1;
          break;
        }
        default:
          ctx.drawImage(renderedRef.current[eased > 0.5 ? slideIdx + 1 : slideIdx], 0, 0, w, h);
      }
    } else {
      ctx.drawImage(renderedRef.current[slideIdx], 0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [slideshow]);

  // Play
  const handlePlay = useCallback(() => {
    if (!ready) return;

    startTimeRef.current = performance.now();
    setIsPlaying(true);
    setCurrentSlideIndex(0);
    setProgress(0);

    // Start audio
    if (selectedAudioUrl) {
      const playUrl = getPlayableAudioUrl(selectedAudioUrl);
      if (playUrl) {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(playUrl);
        audio.muted = muted;
        audio.play().catch(() => {});
        audioRef.current = audio;
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [ready, selectedAudioUrl, muted, animate]);

  // Pause
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioRef.current) audioRef.current.pause();
  }, []);

  // Reset
  const handleReset = useCallback(() => {
    handlePause();
    setCurrentSlideIndex(0);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    // Draw first slide
    if (canvasRef.current && renderedRef.current[0]) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(renderedRef.current[0], 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [handlePause]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  // Draw first frame when ready
  useEffect(() => {
    if (ready && canvasRef.current && renderedRef.current[0]) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(renderedRef.current[0], 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [ready]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setIsPlaying(false);
      setProgress(0);
      setCurrentSlideIndex(0);
      setReady(false);
    }
  }, [open]);

  if (!open) return null;

  // Size the preview to fit nicely
  const maxH = 480;
  const canvasH = maxH;
  const canvasW = (ratio.width / ratio.height) * canvasH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Close */}
        <div className="flex w-full items-center justify-between" style={{ maxWidth: canvasW }}>
          <span className="text-sm font-medium text-white/70">
            Preview — {slideshow.name}
          </span>
          <button
            onClick={() => { handlePause(); onClose(); }}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ width: canvasW, height: canvasH }}>
          {!ready ? (
            <div className="flex h-full w-full items-center justify-center bg-black">
              <span className="text-sm text-white/50">Preparing preview...</span>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={ratio.width}
              height={ratio.height}
              className="h-full w-full"
              style={{ width: canvasW, height: canvasH }}
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/10 overflow-hidden" style={{ width: canvasW }}>
          <div
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="rounded-full p-2.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={!ready}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          <button
            onClick={toggleMute}
            className="rounded-full p-2.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Info */}
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span>Slide {currentSlideIndex + 1}/{slideshow.slides.length}</span>
          <span>·</span>
          <span>{Math.round(progress * totalDuration)}s / {totalDuration}s</span>
          {selectedAudioUrl && (
            <>
              <span>·</span>
              <span>♪ {useSlideshowStore.getState().selectedAudioName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
