'use client';

import type { Slide, AspectRatio } from '@/types';
import { ASPECT_RATIOS } from '@/types';
import { renderSlideToCanvas } from './renderer';

export type VideoProgress = {
  phase: 'rendering' | 'encoding' | 'done' | 'error';
  percent: number;
  message: string;
};

/**
 * Compose slides into an MP4 video using canvas recording.
 * Uses MediaRecorder API (no ffmpeg.wasm dependency for v1).
 */
export async function composeVideo(
  slides: Slide[],
  aspectRatio: AspectRatio,
  onProgress?: (progress: VideoProgress) => void,
): Promise<Blob> {
  const { width, height } = ASPECT_RATIOS[aspectRatio];
  const fps = 30;

  onProgress?.({ phase: 'rendering', percent: 0, message: 'Preparing slides...' });

  // Render all slides to canvases
  const renderedCanvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < slides.length; i++) {
    const canvas = await renderSlideToCanvas(slides[i], aspectRatio);
    renderedCanvases.push(canvas);
    onProgress?.({
      phase: 'rendering',
      percent: ((i + 1) / slides.length) * 40,
      message: `Rendering slide ${i + 1}/${slides.length}...`,
    });
  }

  // Create output canvas for animation
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d')!;

  // Start recording
  const stream = outputCanvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: getSupportedMimeType(),
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<Blob>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const mimeType = getSupportedMimeType();
      const blob = new Blob(chunks, { type: mimeType });
      onProgress?.({ phase: 'done', percent: 100, message: 'Video ready!' });
      resolve(blob);
    };

    mediaRecorder.onerror = (e) => {
      onProgress?.({ phase: 'error', percent: 0, message: 'Recording failed' });
      reject(e);
    };

    mediaRecorder.start();

    onProgress?.({ phase: 'encoding', percent: 40, message: 'Encoding video...' });

    // Animate slides
    animateSlides(
      ctx,
      renderedCanvases,
      slides,
      width,
      height,
      fps,
      (percent) => {
        onProgress?.({
          phase: 'encoding',
          percent: 40 + percent * 0.55,
          message: `Encoding... ${Math.round(40 + percent * 0.55)}%`,
        });
      },
    ).then(() => {
      // Small delay to ensure last frame is captured
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach((t) => t.stop());
      }, 200);
    });
  });
}

async function animateSlides(
  ctx: CanvasRenderingContext2D,
  canvases: HTMLCanvasElement[],
  slides: Slide[],
  width: number,
  height: number,
  fps: number,
  onProgress: (percent: number) => void,
): Promise<void> {
  const transitionDuration = 0.5; // seconds for transitions
  const totalFrames = slides.reduce((sum, s) => sum + s.duration * fps, 0);
  let frameCount = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideFrames = slide.duration * fps;
    const transitionFrames = Math.floor(transitionDuration * fps);
    const hasNextSlide = i < slides.length - 1;
    const nextCanvas = hasNextSlide ? canvases[i + 1] : null;

    for (let f = 0; f < slideFrames; f++) {
      // Check if we're in the transition zone (last transitionFrames of the slide)
      const inTransition = hasNextSlide && f >= slideFrames - transitionFrames;
      const transitionProgress = inTransition
        ? (f - (slideFrames - transitionFrames)) / transitionFrames
        : 0;

      // Clear
      ctx.clearRect(0, 0, width, height);

      if (inTransition && nextCanvas) {
        // Apply transition
        applyTransition(
          ctx,
          canvases[i],
          nextCanvas,
          slide.transition,
          transitionProgress,
          width,
          height,
        );
      } else {
        // Draw current slide
        ctx.drawImage(canvases[i], 0, 0);
      }

      frameCount++;
      if (frameCount % fps === 0) {
        onProgress((frameCount / totalFrames) * 100);
      }

      // Wait for next frame
      await waitFrame();
    }
  }
}

function applyTransition(
  ctx: CanvasRenderingContext2D,
  current: HTMLCanvasElement,
  next: HTMLCanvasElement,
  transition: string,
  progress: number, // 0 to 1
  width: number,
  height: number,
) {
  const eased = easeInOutCubic(progress);

  switch (transition) {
    case 'fade':
      ctx.globalAlpha = 1;
      ctx.drawImage(current, 0, 0);
      ctx.globalAlpha = eased;
      ctx.drawImage(next, 0, 0);
      ctx.globalAlpha = 1;
      break;

    case 'slide-left':
      ctx.drawImage(current, -width * eased, 0);
      ctx.drawImage(next, width * (1 - eased), 0);
      break;

    case 'slide-right':
      ctx.drawImage(current, width * eased, 0);
      ctx.drawImage(next, -width * (1 - eased), 0);
      break;

    case 'zoom-in': {
      const scale = 1 + eased * 0.3;
      ctx.save();
      ctx.globalAlpha = 1 - eased;
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
      ctx.drawImage(current, 0, 0);
      ctx.restore();
      ctx.globalAlpha = eased;
      ctx.drawImage(next, 0, 0);
      ctx.globalAlpha = 1;
      break;
    }

    case 'zoom-out': {
      const s = 1 - eased * 0.3;
      ctx.save();
      ctx.globalAlpha = 1 - eased;
      ctx.translate(width / 2, height / 2);
      ctx.scale(s, s);
      ctx.translate(-width / 2, -height / 2);
      ctx.drawImage(current, 0, 0);
      ctx.restore();
      ctx.globalAlpha = eased;
      ctx.drawImage(next, 0, 0);
      ctx.globalAlpha = 1;
      break;
    }

    case 'dissolve':
      ctx.globalAlpha = 1 - eased;
      ctx.drawImage(current, 0, 0);
      ctx.globalAlpha = eased;
      ctx.drawImage(next, 0, 0);
      ctx.globalAlpha = 1;
      break;

    default: // 'none' or unknown
      if (progress >= 0.5) {
        ctx.drawImage(next, 0, 0);
      } else {
        ctx.drawImage(current, 0, 0);
      }
      break;
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function waitFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return 'video/webm';
}
