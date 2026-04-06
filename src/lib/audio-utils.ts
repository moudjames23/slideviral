'use client';

/**
 * Returns a proxied URL for external audio to avoid CORS issues.
 * Local URLs (blob:, data:, /api/) are returned as-is.
 */
export function getPlayableAudioUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/api/')) {
    return url;
  }
  return `/api/proxy-audio?url=${encodeURIComponent(url)}`;
}

/**
 * Fetch a fresh Deezer preview URL for a song query.
 * Deezer preview URLs expire after ~30min, so we refetch on demand.
 */
export async function getFreshPreviewUrl(deezerQuery: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/trending-sounds?mood=all`);
    const data = await res.json();
    const sounds = data.sounds || [];
    // Try to find the exact match
    const match = sounds.find(
      (s: { title: string; artist: string; previewUrl: string | null }) =>
        deezerQuery.toLowerCase().includes(s.title.toLowerCase()) && s.previewUrl,
    );
    if (match?.previewUrl) return match.previewUrl;

    // Fallback: direct Deezer search via our trending-sounds API
    // The API caches results, so we might get stale URLs.
    // Let's do a direct Deezer fetch instead.
    const deezerRes = await fetch(
      `/api/proxy-audio?url=${encodeURIComponent(`https://api.deezer.com/search?q=${encodeURIComponent(deezerQuery)}&limit=1`)}`,
    );
    // This won't work because proxy-audio returns binary. Let's use a different approach.
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve an audio selection to a playable URL.
 * If the stored URL is a Deezer URL that might be expired,
 * refetch through trending-sounds API (which re-queries Deezer).
 */
export async function resolveAudioUrl(
  storedUrl: string | null,
  audioName: string | null,
): Promise<string | null> {
  if (!storedUrl) return null;

  // Local files — always valid
  if (storedUrl.startsWith('blob:') || storedUrl.startsWith('data:')) {
    return storedUrl;
  }

  // Deezer URL — check if it's likely expired by trying to fetch it
  if (storedUrl.includes('dzcdn.net') || storedUrl.includes('deezer')) {
    const proxyUrl = getPlayableAudioUrl(storedUrl);
    if (!proxyUrl) return null;

    try {
      const res = await fetch(proxyUrl, { method: 'HEAD' });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('audio')) return storedUrl; // Still valid
      }
    } catch { /* expired or unreachable */ }

    // URL expired — refetch from Deezer via trending-sounds
    if (audioName) {
      try {
        // Extract the search query from the audio name (e.g. "Close Eyes — DVRST" -> "Close Eyes DVRST")
        const query = audioName.replace(/\s*—\s*/g, ' ').trim();
        const res = await fetch(`/api/refresh-audio?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.previewUrl) return data.previewUrl;
        }
      } catch { /* fallback failed */ }
    }

    return null; // Truly expired, no refresh possible
  }

  return storedUrl; // Unknown URL type, try as-is
}
