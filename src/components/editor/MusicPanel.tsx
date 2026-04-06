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
  Volume2,
  VolumeX,
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

const moodFilters = [
  { value: 'all', label: 'All' },
  { value: 'dreamy', label: 'Dreamy' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'chill', label: 'Chill' },
  { value: 'confident', label: 'Confident' },
];

export function MusicPanel({ open, onClose }: MusicPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { exportConfig, setExportConfig } = useSlideshowStore();
  const activeTemplate = useSlideshowStore((s) => s.activeTemplate);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moodFilter, setMoodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get suggestions based on context
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

  // Handle file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous audio
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioName(file.name);
    setExportConfig({ includeAudio: true, audioFile: file });
    e.target.value = '';
  }, [audioUrl, setExportConfig]);

  // Play/pause
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Remove audio
  const removeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioName(null);
    setIsPlaying(false);
    setExportConfig({ includeAudio: false, audioFile: undefined });
  }, [audioUrl, setExportConfig]);

  // Setup audio element
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current = audio;
      return () => {
        audio.pause();
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);

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
        {/* Upload section */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Your Audio
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {audioUrl ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border p-3">
              <button
                onClick={togglePlayback}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{audioName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {isPlaying ? 'Playing...' : 'Ready for export'}
                </p>
              </div>
              <button
                onClick={removeAudio}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary hover:bg-primary/5"
            >
              <Upload className="h-4 w-4" />
              Upload MP3 or WAV
            </button>
          )}
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

        {/* All trending suggestions */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Trending Sounds
          </label>

          {/* Search */}
          <div className="relative mt-2 mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs..."
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

          {/* List */}
          <div className="space-y-1">
            {filteredSuggestions.map((s) => (
              <SuggestionRow key={s.title + s.artist} suggestion={s} />
            ))}
            {filteredSuggestions.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No songs match your search.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionRow({ suggestion, highlighted }: { suggestion: MusicSuggestion; highlighted?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg p-2.5 transition-colors ${
        highlighted ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted'
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Music className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium truncate">{suggestion.title}</p>
          {suggestion.trending && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold text-primary uppercase">
              Hot
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {suggestion.artist} · {suggestion.mood}
        </p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
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
    </div>
  );
}
