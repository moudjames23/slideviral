'use client';

import type { Slide, AspectRatio } from '@/types';
import { ASPECT_RATIOS } from '@/types';

/**
 * Render a single slide to an offscreen canvas and return as data URL or Blob.
 */
export async function renderSlideToCanvas(
  slide: Slide,
  aspectRatio: AspectRatio,
): Promise<HTMLCanvasElement> {
  const { width, height } = ASPECT_RATIOS[aspectRatio];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = slide.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Image
  if (slide.imageUrl) {
    const img = await loadImage(slide.imageUrl);
    // Cover fit
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > canvasRatio) {
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  }

  // Text overlays
  for (const overlay of slide.textOverlays) {
    const x = (overlay.x / 100) * width;
    const y = (overlay.y / 100) * height;
    const maxW = (overlay.maxWidth / 100) * width;

    ctx.save();
    ctx.textAlign = overlay.textAlign;
    ctx.textBaseline = 'middle';

    const fontSize = overlay.fontSize * (width / 400); // scale relative to canvas
    ctx.font = `${overlay.fontWeight} ${fontSize}px ${overlay.fontFamily}, Inter, sans-serif`;

    // Shadow
    if (overlay.textShadow) {
      const shadowMatch = overlay.textShadow.match(
        /(\d+)px\s+(\d+)px\s+(\d+)px\s+(.+)/,
      );
      if (shadowMatch) {
        ctx.shadowOffsetX = parseFloat(shadowMatch[1]) * (width / 400);
        ctx.shadowOffsetY = parseFloat(shadowMatch[2]) * (width / 400);
        ctx.shadowBlur = parseFloat(shadowMatch[3]) * (width / 400);
        ctx.shadowColor = shadowMatch[4];
      }
    }

    // Background
    if (overlay.backgroundColor) {
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
      const metrics = ctx.measureText(overlay.content);
      const pad = 8 * (width / 400);
      ctx.fillStyle = overlay.backgroundColor;
      const bgX = overlay.textAlign === 'center' ? x - metrics.width / 2 - pad
                 : overlay.textAlign === 'right' ? x - metrics.width - pad
                 : x - pad;
      ctx.fillRect(bgX, y - fontSize / 2 - pad, metrics.width + pad * 2, fontSize + pad * 2);
    }

    // Text - word wrap
    ctx.fillStyle = overlay.color;
    const lines = wrapText(ctx, overlay.content, maxW);
    const lineH = fontSize * (overlay.lineHeight ?? 1.3);
    const totalH = lines.length * lineH;
    const startY = y - totalH / 2 + lineH / 2;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, startY + i * lineH);
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Export a single slide as PNG blob
 */
export async function exportSlideAsPng(
  slide: Slide,
  aspectRatio: AspectRatio,
): Promise<Blob> {
  const canvas = await renderSlideToCanvas(slide, aspectRatio);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/png',
      1,
    );
  });
}

/**
 * Export all slides as a ZIP file
 */
export async function exportSlidesAsZip(
  slides: Slide[],
  aspectRatio: AspectRatio,
  projectName: string,
): Promise<Blob> {
  // Simple ZIP creation using JSZip-like approach
  // For now, we'll create individual downloads
  const blobs: { name: string; blob: Blob }[] = [];
  for (let i = 0; i < slides.length; i++) {
    const blob = await exportSlideAsPng(slides[i], aspectRatio);
    blobs.push({ name: `${projectName}_slide_${i + 1}.png`, blob });
  }

  // Create a simple concatenated download approach
  // In production, use JSZip. For now, return the first slide.
  return blobs[0]?.blob ?? new Blob();
}

// --- Helpers ---

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [''];
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines.length ? lines : [''];
}

/**
 * Trigger a browser download
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
