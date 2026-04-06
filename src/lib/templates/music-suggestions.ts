export interface MusicSuggestion {
  title: string;
  artist: string;
  tiktokSearch: string; // search query for TikTok sound library
  spotifyQuery: string; // search query for Spotify
  mood: string;
  bpm?: string;
  trending: boolean;
}

/**
 * Curated trending music suggestions organized by mood/category.
 * These are suggestions to search for on TikTok's sound library —
 * the user picks the actual sound when posting.
 */
export const musicSuggestions: Record<string, MusicSuggestion[]> = {
  dreamy: [
    { title: 'A Million Dreams', artist: 'The Greatest Showman', tiktokSearch: 'A Million Dreams', spotifyQuery: 'A Million Dreams Greatest Showman', mood: 'Dreamy & Aspirational', bpm: '100', trending: true },
    { title: 'Golden Hour', artist: 'JVKE', tiktokSearch: 'Golden Hour JVKE', spotifyQuery: 'Golden Hour JVKE', mood: 'Warm & Dreamy', bpm: '96', trending: true },
    { title: 'Close Eyes', artist: 'DVRST', tiktokSearch: 'Close Eyes DVRST', spotifyQuery: 'Close Eyes DVRST', mood: 'Hypnotic & Chill', bpm: '115', trending: true },
    { title: 'Daylight', artist: 'David Kushner', tiktokSearch: 'Daylight David Kushner', spotifyQuery: 'Daylight David Kushner', mood: 'Emotional & Cinematic', bpm: '86', trending: true },
    { title: 'Heather', artist: 'Conan Gray', tiktokSearch: 'Heather Conan Gray', spotifyQuery: 'Heather Conan Gray', mood: 'Soft & Nostalgic', bpm: '104', trending: false },
  ],
  energetic: [
    { title: 'Metamorphosis', artist: 'Interworld', tiktokSearch: 'Metamorphosis Interworld', spotifyQuery: 'Metamorphosis Interworld', mood: 'Dark & Powerful', bpm: '145', trending: true },
    { title: 'Industry Baby', artist: 'Lil Nas X', tiktokSearch: 'Industry Baby', spotifyQuery: 'Industry Baby Lil Nas X', mood: 'Bold & Confident', bpm: '150', trending: false },
    { title: 'Cradles', artist: 'Sub Urban', tiktokSearch: 'Cradles Sub Urban', spotifyQuery: 'Cradles Sub Urban', mood: 'Edgy & Mysterious', bpm: '136', trending: true },
    { title: 'After Dark', artist: 'Mr.Kitty', tiktokSearch: 'After Dark Mr Kitty', spotifyQuery: 'After Dark Mr.Kitty', mood: 'Synthwave & Dark', bpm: '120', trending: true },
    { title: 'Runaway', artist: 'Aurora', tiktokSearch: 'Runaway Aurora', spotifyQuery: 'Runaway Aurora', mood: 'Epic & Emotional', bpm: '107', trending: false },
  ],
  chill: [
    { title: 'Good Days', artist: 'SZA', tiktokSearch: 'Good Days SZA', spotifyQuery: 'Good Days SZA', mood: 'Chill & Positive', bpm: '120', trending: false },
    { title: 'Sweater Weather', artist: 'The Neighbourhood', tiktokSearch: 'Sweater Weather', spotifyQuery: 'Sweater Weather The Neighbourhood', mood: 'Cozy & Aesthetic', bpm: '124', trending: true },
    { title: 'Ceilings', artist: 'Lizzy McAlpine', tiktokSearch: 'Ceilings Lizzy McAlpine', spotifyQuery: 'Ceilings Lizzy McAlpine', mood: 'Soft & Reflective', bpm: '79', trending: true },
    { title: 'Aesthetic', artist: 'Tollan Kim', tiktokSearch: 'Aesthetic Tollan Kim', spotifyQuery: 'Aesthetic Tollan Kim', mood: 'Clean & Minimal', bpm: '95', trending: false },
    { title: 'Espresso', artist: 'Sabrina Carpenter', tiktokSearch: 'Espresso Sabrina Carpenter', spotifyQuery: 'Espresso Sabrina Carpenter', mood: 'Fun & Catchy', bpm: '104', trending: true },
  ],
  confident: [
    { title: 'Taste', artist: 'Sabrina Carpenter', tiktokSearch: 'Taste Sabrina Carpenter', spotifyQuery: 'Taste Sabrina Carpenter', mood: 'Sassy & Fun', bpm: '111', trending: true },
    { title: 'Rich Flex', artist: 'Drake', tiktokSearch: 'Rich Flex Drake', spotifyQuery: 'Rich Flex Drake 21 Savage', mood: 'Flex & Value', bpm: '104', trending: false },
    { title: 'Money', artist: 'Lisa', tiktokSearch: 'Money Lisa Blackpink', spotifyQuery: 'Money Lisa', mood: 'Powerful & Luxe', bpm: '125', trending: false },
    { title: 'Snooze', artist: 'SZA', tiktokSearch: 'Snooze SZA', spotifyQuery: 'Snooze SZA', mood: 'Smooth & Confident', bpm: '143', trending: true },
    { title: 'Paint The Town Red', artist: 'Doja Cat', tiktokSearch: 'Paint The Town Red', spotifyQuery: 'Paint The Town Red Doja Cat', mood: 'Bold & Unapologetic', bpm: '100', trending: true },
  ],
};

/**
 * Get music suggestions matching a template's suggested music list.
 */
export function getSuggestionsForTemplate(templateMusic: string[]): MusicSuggestion[] {
  const all = Object.values(musicSuggestions).flat();
  const matched: MusicSuggestion[] = [];

  for (const name of templateMusic) {
    const found = all.find(
      (m) => m.title.toLowerCase().includes(name.toLowerCase()) ||
             name.toLowerCase().includes(m.title.toLowerCase()),
    );
    if (found) matched.push(found);
  }

  return matched;
}

/**
 * Get all suggestions, sorted by trending first.
 */
export function getAllSuggestions(): MusicSuggestion[] {
  return Object.values(musicSuggestions)
    .flat()
    .sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
}

/**
 * Get suggestions by mood category.
 */
export function getSuggestionsByMood(mood: string): MusicSuggestion[] {
  return musicSuggestions[mood] ?? [];
}
