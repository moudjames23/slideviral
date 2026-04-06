'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Music } from 'lucide-react';
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
      if (!cancelled) { renderedRef.current = canvases; setReady(true); }
    }
    prerender();
    return () => { cancelled = true; };
  }, [open, slideshow]);

  const animate = useCallback(() => {
    if (!canvasRef.current || renderedRef.current.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const totalDur = slideshow.slides.reduce((s, sl) => s + sl.duration, 0);

    if (elapsed >= totalDur) {
      setIsPlaying(false); setCurrentSlideIndex(0); setProgress(0);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(renderedRef.current[0], 0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }

    setProgress(elapsed / totalDur);

    let acc = 0, slideIdx = 0;
    for (let i = 0; i < slideshow.slides.length; i++) {
      if (elapsed < acc + slideshow.slides[i].duration) { slideIdx = i; break; }
      acc += slideshow.slides[i].duration;
    }
    setCurrentSlideIndex(slideIdx);

    const slideElapsed = elapsed - acc;
    const slideDur = slideshow.slides[slideIdx].duration;
    const transitionDur = 0.5;
    const hasNext = slideIdx < slideshow.slides.length - 1;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const inTransition = hasNext && slideElapsed >= slideDur - transitionDur;

    if (inTransition && renderedRef.current[slideIdx + 1]) {
      const t = (slideElapsed - (slideDur - transitionDur)) / transitionDur;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const w = canvasRef.current.width, h = canvasRef.current.height;
      const transition = slideshow.slides[slideIdx].transition;
      switch (transition) {
        case 'fade':
          ctx.globalAlpha = 1; ctx.drawImage(renderedRef.current[slideIdx], 0, 0, w, h);
          ctx.globalAlpha = eased; ctx.drawImage(renderedRef.current[slideIdx + 1], 0, 0, w, h);
          ctx.globalAlpha = 1; break;
        case 'slide-left':
          ctx.drawImage(renderedRef.current[slideIdx], -w * eased, 0, w, h);
          ctx.drawImage(renderedRef.current[slideIdx + 1], w * (1 - eased), 0, w, h); break;
        case 'slide-right':
          ctx.drawImage(renderedRef.current[slideIdx], w * eased, 0, w, h);
          ctx.drawImage(renderedRef.current[slideIdx + 1], -w * (1 - eased), 0, w, h); break;
        case 'zoom-in': {
          const scale = 1 + eased * 0.3;
          ctx.save(); ctx.globalAlpha = 1 - eased;
          ctx.translate(w / 2, h / 2); ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
          ctx.drawImage(renderedRef.current[slideIdx], 0, 0, w, h); ctx.restore();
          ctx.globalAlpha = eased; ctx.drawImage(renderedRef.current[slideIdx + 1], 0, 0, w, h);
          ctx.globalAlpha = 1; break;
        }
        default:
          ctx.drawImage(renderedRef.current[eased > 0.5 ? slideIdx + 1 : slideIdx], 0, 0, w, h);
      }
    } else {
      ctx.drawImage(renderedRef.current[slideIdx], 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    animFrameRef.current = requestAnimationFrame(animate);
  }, [slideshow]);

  const handlePlay = useCallback(() => {
    if (!ready) return;
    startTimeRef.current = performance.now();
    setIsPlaying(true); setCurrentSlideIndex(0); setProgress(0);
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

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const handleReset = useCallback(() => {
    handlePause(); setCurrentSlideIndex(0); setProgress(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (canvasRef.current && renderedRef.current[0]) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); ctx.drawImage(renderedRef.current[0], 0, 0, canvasRef.current.width, canvasRef.current.height); }
    }
  }, [handlePause]);

  const toggleMute = useCallback(() => {
    setMuted((m) => { const next = !m; if (audioRef.current) audioRef.current.muted = next; return next; });
  }, []);

  useEffect(() => {
    if (ready && canvasRef.current && renderedRef.current[0]) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) { ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); ctx.drawImage(renderedRef.current[0], 0, 0, canvasRef.current.width, canvasRef.current.height); }
    }
  }, [ready]);

  useEffect(() => {
    if (!open) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setIsPlaying(false); setProgress(0); setCurrentSlideIndex(0); setReady(false);
    }
  }, [open]);

  if (!open) return null;

  const phoneH = 580;
  const phoneW = phoneH * 0.49; // iPhone 15 proportions
  const screenH = phoneH - 48; // notch + chin
  const screenW = phoneW - 16; // side bezels

  const audioName = useSlideshowStore.getState().selectedAudioName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={() => { handlePause(); onClose(); }}
    >
      <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>

        {/* iPhone frame */}
        <div
          className="relative flex-shrink-0"
          style={{ width: phoneW, height: phoneH }}
        >
          {/* Phone body */}
          <div
            className="absolute inset-0 rounded-[44px] bg-[#1a1a1a] shadow-[0_0_0_2px_#333,0_20px_60px_rgba(0,0,0,0.5)]"
          />

          {/* Dynamic Island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-20 h-[22px] w-[90px] rounded-full bg-black" />

          {/* Screen area */}
          <div
            className="absolute top-[24px] left-[8px] overflow-hidden rounded-[36px] bg-black"
            style={{ width: screenW, height: screenH }}
          >
            {!ready ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                  <span className="text-[11px] text-white/40">Loading...</span>
                </div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={ratio.width}
                height={ratio.height}
                className="h-full w-full object-cover"
                style={{ width: screenW, height: screenH }}
              />
            )}

            {/* TikTok-style overlay UI */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top bar — fake status bar */}
              <div className="flex items-center justify-between px-5 pt-3">
                <span className="text-[10px] font-semibold text-white/80">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="h-[6px] w-[6px] rounded-full bg-white/60" />
                  <div className="h-[6px] w-[18px] rounded-full bg-white/60" />
                  <div className="h-[6px] w-[6px] rounded-full bg-white/60" />
                </div>
              </div>

              {/* Bottom — slide indicator dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {slideshow.slides.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentSlideIndex
                        ? 'h-[6px] w-[18px] bg-white'
                        : 'h-[6px] w-[6px] bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* Right side — fake TikTok icons */}
              <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm" />
                  <span className="text-[8px] text-white/60">384K</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm" />
                  <span className="text-[8px] text-white/60">923</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm" />
                  <span className="text-[8px] text-white/60">18.9K</span>
                </div>
              </div>

              {/* Bottom left — audio name ticker */}
              {audioName && (
                <div className="absolute bottom-12 left-3 flex items-center gap-1.5 max-w-[60%]">
                  <Music className="h-3 w-3 text-white/60 shrink-0" />
                  <span className="text-[9px] text-white/60 truncate">{audioName}</span>
                </div>
              )}
            </div>

            {/* Play overlay when paused */}
            {!isPlaying && ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <button
                  onClick={handlePlay}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-transform hover:scale-110"
                >
                  <Play className="h-6 w-6 ml-0.5" />
                </button>
              </div>
            )}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 h-[4px] w-[100px] rounded-full bg-white/30" />
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/10 overflow-hidden" style={{ width: phoneW }}>
          <div
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={!ready}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          <button
            onClick={toggleMute}
            className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Info */}
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <span>Slide {currentSlideIndex + 1}/{slideshow.slides.length}</span>
          <span>·</span>
          <span>{Math.round(progress * totalDuration)}s / {totalDuration}s</span>
        </div>

        {/* Close hint */}
        <span className="text-[10px] text-white/20">Click outside or press Esc to close</span>
      </div>
    </div>
  );
}
