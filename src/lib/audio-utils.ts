'use client';

/**
 * Returns a proxied URL for external audio to avoid CORS issues.
 * Local URLs (blob:, data:, /api/) are returned as-is.
 */
export function getPlayableAudioUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already local — no proxy needed
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/api/')) {
    return url;
  }
  // External URL — proxy it
  return `/api/proxy-audio?url=${encodeURIComponent(url)}`;
}
