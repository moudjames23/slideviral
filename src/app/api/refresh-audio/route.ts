import { NextRequest, NextResponse } from 'next/server';

/**
 * Fetch a fresh Deezer preview URL for a song query.
 * Used when a previously saved Deezer URL has expired.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'q parameter required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`,
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Deezer search failed' }, { status: 502 });
    }

    const data = await res.json();
    const track = data.data?.[0];

    if (!track?.preview) {
      return NextResponse.json({ error: 'No preview found', previewUrl: null });
    }

    return NextResponse.json({
      previewUrl: track.preview,
      title: track.title,
      artist: track.artist?.name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 },
    );
  }
}
