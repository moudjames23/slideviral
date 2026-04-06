'use client';

import type { Slide, AspectRatio } from '@/types';
import { ASPECT_RATIOS } from '@/types';
import { renderSlideToCanvas } from './renderer';
import { getPlayableAudioUrl } from '@/lib/audio-utils';

export type VideoProgress = {
  phase: 'rendering' | 'encoding' | 'done' | 'error';
  percent: number;
  message: string;
};

/**
 * Compose slides into a video using canvas recording.
 * Uses MediaRecorder API with real-time frame pacing.
 */
export async function composeVideo(
  slides: Slide[],
  aspectRatio: AspectRatio,
  onProgress?: (progress: VideoProgress) => void,
  audioUrl?: string | null,
): Promise<Blob> {
  const { width, height } = ASPECT_RATIOS[aspectRatio];
  const fps = 30;
  const frameDurationMs = 1000 / fps; // ~33.3ms per frame

  console.log('[VideoComposer] audioUrl:', audioUrl ? audioUrl.substring(0, 60) + '...' : 'NULL');

  onProgress?.({ phase: 'rendering', percent: 0, message: 'Preparing slides...' });

  // Render all slides to canvases
  const renderedCanvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < slides.length; i++) {
    const canvas = await renderSlideToCanvas(slides[i], aspectRatio);
    renderedCanvases.push(canvas);
    onProgress?.({
      phase: 'rendering',
      percent: ((i + 1) / slides.length) * 30,
      message: `Rendering slide ${i + 1}/${slides.length}...`,
    });
  }

  // Create output canvas for animation
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d')!;

  // Capture video stream from canvas
  const canvasStream = outputCanvas.captureStream(0);
  const videoTrack = canvasStream.getVideoTracks()[0];
  // @ts-expect-error - requestFrame is available on CanvasCaptureMediaStreamTrack
  const requestFrame = videoTrack.requestFrame?.bind(videoTrack);

  // Prepare audio if provided
  let audioCtx: AudioContext | null = null;
  let audioSourceNode: AudioBufferSourceNode | null = null;
  let audioTrack: MediaStreamTrack | null = null;

  if (audioUrl) {
    try {
      const proxyUrl = getPlayableAudioUrl(audioUrl);
      if (!proxyUrl) throw new Error('No audio URL');

      const audioResponse = await fetch(proxyUrl);
      const audioArrayBuffer = await audioResponse.arrayBuffer();

      audioCtx = new AudioContext();
      // Resume context in case it's suspended (autoplay policy)
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);

      const dest = audioCtx.createMediaStreamDestination();
      audioSourceNode = audioCtx.createBufferSource();
      audioSourceNode.buffer = audioBuffer;
      audioSourceNode.connect(dest);
      // Also connect to speakers so the context stays active
      audioSourceNode.connect(audioCtx.destination);

      audioTrack = dest.stream.getAudioTracks()[0] || null;
      console.log('[VideoComposer] Audio decoded:', audioBuffer.duration, 's, track:', audioTrack?.readyState);

      onProgress?.({ phase: 'rendering', percent: 35, message: 'Audio loaded...' });
    } catch (e) {
      console.warn('[VideoComposer] Could not prepare audio:', e);
      audioCtx = null;
      audioSourceNode = null;
      audioTrack = null;
    }
  }

  // Build a combined MediaStream with video + audio tracks
  // IMPORTANT: must be done BEFORE creating MediaRecorder
  const combinedStream = new MediaStream();
  combinedStream.addTrack(videoTrack);
  if (audioTrack) combinedStream.addTrack(audioTrack);
  console.log('[VideoComposer] Combined tracks:', combinedStream.getTracks().map(t => `${t.kind}:${t.readyState}`).join(', '));

  const mediaRecorder = new MediaRecorder(combinedStream, {
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

    mediaRecorder.start(100); // collect data every 100ms

    // Start audio playback in sync with recording
    if (audioSourceNode) {
      audioSourceNode.start(0);
    }

    onProgress?.({ phase: 'encoding', percent: 30, message: 'Encoding video...' });

    // Animate slides with real-time frame pacing
    animateSlides(
      ctx,
      renderedCanvases,
      slides,
      width,
      height,
      fps,
      frameDurationMs,
      requestFrame,
      (percent) => {
        onProgress?.({
          phase: 'encoding',
          percent: 30 + percent * 0.65,
          message: `Encoding... ${Math.round(30 + percent * 0.65)}%`,
        });
      },
    ).then(() => {
      // Stop audio
      if (audioSourceNode) {
        try { audioSourceNode.stop(); } catch { /* already stopped */ }
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      setTimeout(() => {
        mediaRecorder.stop();
        combinedStream.getTracks().forEach((t) => t.stop());
      }, 300);
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
  frameDurationMs: number,
  requestFrame: (() => void) | undefined,
  onProgress: (percent: number) => void,
): Promise<void> {
  const transitionDuration = 0.5; // seconds
  const totalFrames = slides.reduce((sum, s) => sum + Math.round(s.duration * fps), 0);
  let frameCount = 0;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideFrames = Math.round(slide.duration * fps);
    const transitionFrames = Math.min(
      Math.floor(transitionDuration * fps),
      Math.floor(slideFrames / 2), // never more than half the slide
    );
    const hasNextSlide = i < slides.length - 1;
    const nextCanvas = hasNextSlide ? canvases[i + 1] : null;

    for (let f = 0; f < slideFrames; f++) {
      const frameStart = performance.now();

      // Check if we're in the transition zone
      const inTransition = hasNextSlide && f >= slideFrames - transitionFrames;
      const transitionProgress = inTransition
        ? (f - (slideFrames - transitionFrames)) / transitionFrames
        : 0;

      // Clear and draw
      ctx.clearRect(0, 0, width, height);

      if (inTransition && nextCanvas) {
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
        ctx.drawImage(canvases[i], 0, 0);
      }

      // Push frame to MediaRecorder
      if (requestFrame) {
        requestFrame();
      }

      frameCount++;
      if (frameCount % fps === 0) {
        onProgress((frameCount / totalFrames) * 100);
      }

      // Wait for the exact frame duration to maintain real-time pacing.
      // MediaRecorder records in real-time, so we MUST wait ~33ms per frame
      // to get the correct video duration.
      const elapsed = performance.now() - frameStart;
      const waitTime = Math.max(0, frameDurationMs - elapsed);
      await delay(waitTime);
    }
  }
}

function applyTransition(
  ctx: CanvasRenderingContext2D,
  current: HTMLCanvasElement,
  next: HTMLCanvasElement,
  transition: string,
  progress: number,
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

    default:
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
