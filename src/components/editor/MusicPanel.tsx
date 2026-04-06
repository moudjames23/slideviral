'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Music,
  Upload,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  X,
  Check,
  Loader2,
  Volume2,
} from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import {
  getSuggestionsForTemplate,
  getAllSuggestions,
  type MusicSuggestion,
} from '@/lib/templates/music-suggestions';

interface MusicPanelProps {
  open: boolean;
  onClose: () => void;
}

interface FreesoundTrack {
  id: string;
  title: string;
  duration: number;
  previewUrl: string;
  downloadUrl: string;
  tags: string[];
  rating: number;
  author: string;
  license: string;
}

const moodFilters = [
  { value: 'all', label: 'All' },
  { value: 'dreamy', label: 'Dreamy' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'chill', label: 'Chill' },
  { value: 'confident', label: 'Confident' },
];

const moodSearchQueries: Record<string, string> = {
  dreamy: 'ambient dreamy cinematic soft',
  energetic: 'upbeat energetic electronic beat',
  chill: 'lofi chill relaxing calm',
  confident: 'confident powerful hip hop beat',
};

export function MusicPanel({ open, onClose }: MusicPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { selectedAudioUrl, selectedAudioName, setSelectedAudio } = useSlideshowStore();
  const activeTemplate = useSlideshowStore((s) => s.activeTemplate);
  const apiKeys = useSlideshowStore((s) => s.apiKeys);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Freesound search
  const [freesoundTracks, setFreesoundTracks] = useState<FreesoundTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [freesoundError, setFreesoundError] = useState<string | null>(null);
  const freesoundKey = apiKeys['FREESOUND_API_KEY'] ?? '';

  // Template suggestions
  const templateSuggestions = activeTemplate
    ? getSuggestionsForTemplate(activeTemplate.suggestedMusic)
    : [];
  const allSuggestions = getAllSuggestions();

  const filteredSuggestions = (moodFilter === 'all' ? allSuggestions : allSuggestions.filter((s) => {
    const moodMap: Record<string, string[]> = {
      dreamy: ['Dreamy', 'Warm', 'Soft', 'Nostalgic', 'Emotional', 'Cinematic', 'Hypnotic'],
      energetic: ['Dark', 'Powerful', 'Bold', 'Edgy', 'Epic', 'Synthwave'],
      chill: ['Chill', 'Cozy', 'Reflective', 'Clean', 'Minimal', 'Fun', 'Catchy', 'Positive'],
      confident: ['Sassy', 'Flex', 'Powerful', 'Luxe', 'Smooth', 'Confident', 'Unapologetic'],
    };
    return moodMap[moodFilter]?.some((m) => s.mood.includes(m));
  })).filter((s) =>
    !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Search Freesound
  const searchFreesound = useCallback(async (query?: string) => {
    if (!freesoundKey) return;
    setIsSearching(true);
    setFreesoundError(null);
    try {
      const q = query || moodSearchQueries[moodFilter] || 'ambient background music';
      const res = await fetch(`/api/search-music?q=${encodeURIComponent(q)}&apiKey=${encodeURIComponent(freesoundKey)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setFreesoundTracks(data.results || []);
    } catch (err) {
      setFreesoundError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [freesoundKey, moodFilter]);

  // Auto-search when mood filter changes and Freesound key is set
  useEffect(() => {
    if (freesoundKey && open) {
      searchFreesound();
    }
  }, [moodFilter, open, freesoundKey, searchFreesound]);

  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedAudio(url, file.name);
    e.target.value = '';
  }, [setSelectedAudio]);

  // Play/pause any audio URL
  const playAudio = useCallback((url: string, trackId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playingTrackId === trackId && isPlaying) {
      setIsPlaying(false);
      setPlayingTrackId(null);
      return;
    }
    const audio = new Audio(url);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlayingTrackId(null);
    });
    audio.play();
    audioRef.current = audio;
    setIsPlaying(true);
    setPlayingTrackId(trackId);
  }, [playingTrackId, isPlaying]);

  // Select a Freesound track as the project audio
  const selectTrack = useCallback((track: FreesoundTrack) => {
    setSelectedAudio(track.previewUrl, track.title);
    // Stop preview if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlayingTrackId(null);
    }
  }, [setSelectedAudio]);

  // Remove selected audio
  const removeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSelectedAudio(null, null);
    setIsPlaying(false);
    setPlayingTrackId(null);
  }, [setSelectedAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed top-16 right-4 z-50 w-80 max-h-[calc(100vh-5rem)] rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Music</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {/* Selected audio */}
        {selectedAudioUrl && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => playAudio(selectedAudioUrl, 'selected')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                {playingTrackId === 'selected' && isPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{selectedAudioName}</p>
                <p className="text-[10px] text-primary">Selected for export</p>
              </div>
              <button
                onClick={removeAudio}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Upload */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Upload Your Own
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary hover:bg-primary/5"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload MP3 or WAV
          </button>
        </div>

        {/* Template suggestions */}
        {templateSuggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <label className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Suggested for this template
              </label>
            </div>
            <div className="space-y-1">
              {templateSuggestions.map((s) => (
                <SuggestionRow key={s.title + s.artist} suggestion={s} highlighted />
              ))}
            </div>
          </div>
        )}

        {/* Free sounds library */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Free Sounds Library
          </label>

          {!freesoundKey ? (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Add a Freesound API key in <strong>API Keys</strong> to browse free sounds.
              </p>
              <a
                href="https://freesound.org/apiv2/apply"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 hover:underline"
              >
                Get free key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mt-2 mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) searchFreesound(searchQuery);
                  }}
                  placeholder="Search free sounds..."
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Mood filters */}
              <div className="flex flex-wrap gap-1 mb-3">
                {moodFilters.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setMoodFilter(value)}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                      moodFilter === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {isSearching && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Searching...</span>
                </div>
              )}

              {/* Error */}
              {freesoundError && (
                <p className="text-xs text-destructive py-2">{freesoundError}</p>
              )}

              {/* Results */}
              {!isSearching && freesoundTracks.length > 0 && (
                <div className="space-y-1">
                  {freesoundTracks.map((track) => (
                    <FreesoundRow
                      key={track.id}
                      track={track}
                      isPlaying={playingTrackId === track.id && isPlaying}
                      isSelected={selectedAudioUrl === track.previewUrl}
                      onPlay={() => playAudio(track.previewUrl, track.id)}
                      onSelect={() => selectTrack(track)}
                    />
                  ))}
                </div>
              )}

              {!isSearching && freesoundTracks.length === 0 && !freesoundError && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Search for sounds or pick a mood above.
                </p>
              )}
            </>
          )}
        </div>

        {/* Trending suggestions (always visible) */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Trending on TikTok
          </label>
          <p className="text-[10px] text-muted-foreground mb-2">
            Search these on TikTok when posting
          </p>
          <div className="space-y-1">
            {filteredSuggestions.slice(0, 8).map((s) => (
              <SuggestionRow key={s.title + s.artist} suggestion={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FreesoundRow({
  track,
  isPlaying,
  isSelected,
  onPlay,
  onSelect,
}: {
  track: FreesoundTrack;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
        isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
      }`}
    >
      {/* Play button */}
      <button
        onClick={onPlay}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted hover:bg-primary/20 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-3 w-3 text-primary" />
        ) : (
          <Play className="h-3 w-3 text-muted-foreground ml-0.5" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium truncate">{track.title}</p>
        <p className="text-[9px] text-muted-foreground">
          {track.author} · {track.duration}s · CC
        </p>
      </div>

      {/* Select button */}
      <button
        onClick={onSelect}
        className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
        }`}
      >
        {isSelected ? (
          <span className="flex items-center gap-1"><Check className="h-2.5 w-2.5" /> Selected</span>
        ) : (
          'Use'
        )}
      </button>
    </div>
  );
}

function SuggestionRow({ suggestion, highlighted }: { suggestion: MusicSuggestion; highlighted?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg p-2 transition-colors ${
        highlighted ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted'
      }`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Volume2 className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium truncate">{suggestion.title}</p>
          {suggestion.trending && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[7px] font-bold text-primary uppercase">
              Hot
            </span>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground truncate">
          {suggestion.artist} · {suggestion.mood}
        </p>
      </div>
      <a
        href={`https://www.tiktok.com/search?q=${encodeURIComponent(suggestion.tiktokSearch)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Find on TikTok"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
