import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for Freesound API to search royalty-free audio.
 * Freesound offers CC-licensed sounds perfect for slideshow backgrounds.
 *
 * Get a free API key at: https://freesound.org/apiv2/apply
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'ambient music';
  const page = searchParams.get('page') || '1';
  const apiKey = searchParams.get('apiKey');

  if (!apiKey) {
    return NextResponse.json({ error: 'Freesound API key required' }, { status: 400 });
  }

  try {
    const url = new URL('https://freesound.org/apiv2/search/text/');
    url.searchParams.set('query', query);
    url.searchParams.set('page', page);
    url.searchParams.set('page_size', '15');
    url.searchParams.set('fields', 'id,name,duration,previews,tags,avg_rating,num_ratings,username');
    url.searchParams.set('filter', 'duration:[5 TO 120]'); // 5s to 2min
    url.searchParams.set('sort', 'rating_desc');
    url.searchParams.set('token', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Freesound error: ${err}`);
    }

    const data = await response.json();

    // Transform to our format
    const results = (data.results || []).map((s: {
      id: number;
      name: string;
      duration: number;
      previews: Record<string, string>;
      tags: string[];
      avg_rating: number;
      username: string;
    }) => ({
      id: String(s.id),
      title: s.name,
      duration: Math.round(s.duration),
      previewUrl: s.previews?.['preview-hq-mp3'] || s.previews?.['preview-lq-mp3'] || '',
      downloadUrl: s.previews?.['preview-hq-mp3'] || '',
      tags: s.tags?.slice(0, 5) || [],
      rating: s.avg_rating,
      author: s.username,
      license: 'CC',
      source: 'freesound',
    }));

    return NextResponse.json({
      results,
      total: data.count || 0,
      page: Number(page),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
