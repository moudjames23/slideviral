import { NextRequest, NextResponse } from 'next/server';
import trendingSounds from '@/lib/templates/trending-sounds.json';

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  preview: string; // 30s MP3 URL — free, no API key
  duration: number;
  album?: { cover_small: string };
}

interface EnrichedSound {
  id: string;
  title: string;
  artist: string;
  mood: string;
  usageCount: string;
  trending: boolean;
  previewUrl: string | null;
  coverUrl: string | null;
  deezerQuery: string;
}

// In-memory cache
let cache: { data: EnrichedSound[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get('mood');

  // Return from cache if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    const filtered = mood ? cache.data.filter((s) => s.mood === mood) : cache.data;
    return NextResponse.json({ sounds: filtered });
  }

  // Enrich each sound with Deezer preview URLs
  const enriched: EnrichedSound[] = await Promise.all(
    trendingSounds.map(async (sound) => {
      let previewUrl: string | null = null;
      let coverUrl: string | null = null;

      try {
        const res = await fetch(
          `https://api.deezer.com/search?q=${encodeURIComponent(sound.deezerQuery)}&limit=1`,
          { next: { revalidate: 3600 } }, // cache 1h on server
        );
        if (res.ok) {
          const data = await res.json();
          const track = data.data?.[0] as DeezerTrack | undefined;
          if (track) {
            previewUrl = track.preview || null;
            coverUrl = track.album?.cover_small || null;
          }
        }
      } catch {
        // Deezer unavailable — return without preview
      }

      return {
        id: sound.id,
        title: sound.title,
        artist: sound.artist,
        mood: sound.mood,
        usageCount: sound.usageCount,
        trending: sound.trending,
        previewUrl,
        coverUrl,
        deezerQuery: sound.deezerQuery,
      };
    }),
  );

  // Cache results
  cache = { data: enriched, timestamp: Date.now() };

  const filtered = mood ? enriched.filter((s) => s.mood === mood) : enriched;
  return NextResponse.json({ sounds: filtered });
}
