'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Music,
  Upload,
  Play,
  Pause,
  Trash2,
  X,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';

interface TrendingSound {
  id: string;
  title: string;
  artist: string;
  mood: string;
  usageCount: string;
  trending: boolean;
  previewUrl: string | null;
  coverUrl: string | null;
}

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

  const { selectedAudioUrl, selectedAudioName, setSelectedAudio } = useSlideshowStore();
  const activeTemplate = useSlideshowStore((s) => s.activeTemplate);

  const [sounds, setSounds] = useState<TrendingSound[]>([]);
  const [loading, setLoading] = useState(false);
  const [moodFilter, setMoodFilter] = useState('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Fetch trending sounds on mount
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/trending-sounds')
      .then((r) => r.json())
      .then((data) => setSounds(data.sounds || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Filter sounds
  const filtered = moodFilter === 'all'
    ? sounds
    : sounds.filter((s) => s.mood === moodFilter);

  // Get template-suggested sounds
  const templateMood = activeTemplate
    ? (activeTemplate.tags?.includes('dreamy') || activeTemplate.tags?.includes('emotional') ? 'dreamy'
      : activeTemplate.tags?.includes('energetic') || activeTemplate.tags?.includes('edgy') ? 'energetic'
      : activeTemplate.tags?.includes('chill') || activeTemplate.tags?.includes('casual') ? 'chill'
      : activeTemplate.category === 'comparison' || activeTemplate.category === 'reaction' ? 'confident'
      : 'dreamy')
    : null;

  const suggested = templateMood
    ? sounds.filter((s) => s.mood === templateMood && s.trending).slice(0, 3)
    : [];

  // Play/pause
  const togglePlay = useCallback((sound: TrendingSound) => {
    if (!sound.previewUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (playingId === sound.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(sound.previewUrl);
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(sound.id);
  }, [playingId]);

  // Select sound
  const selectSound = useCallback((sound: TrendingSound) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    setSelectedAudio(sound.previewUrl, `${sound.title} — ${sound.artist}`);
  }, [setSelectedAudio]);

  // Upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedAudio(url, file.name);
    e.target.value = '';
  }, [setSelectedAudio]);

  // Remove
  const removeAudio = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    setSelectedAudio(null, null);
    setPlayingId(null);
  }, [setSelectedAudio]);

  // Cleanup
  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
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
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Selected audio */}
        {selectedAudioUrl && (
          <div className="px-4 pt-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    if (playingId === 'selected') { setPlayingId(null); return; }
                    const a = new Audio(selectedAudioUrl);
                    a.addEventListener('ended', () => setPlayingId(null));
                    a.play().catch(() => {});
                    audioRef.current = a;
                    setPlayingId('selected');
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  {playingId === 'selected' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{selectedAudioName}</p>
                  <p className="text-[10px] text-primary">Ready for export</p>
                </div>
                <button onClick={removeAudio} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload */}
        <div className="px-4 pt-4">
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary hover:bg-primary/5"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload your own audio
          </button>
        </div>

        {/* Template suggestions */}
        {suggested.length > 0 && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Recommended for this template
              </span>
            </div>
            {suggested.map((s) => (
              <SoundRow
                key={s.id}
                sound={s}
                isPlaying={playingId === s.id}
                isSelected={selectedAudioName === `${s.title} — ${s.artist}`}
                onPlay={() => togglePlay(s)}
                onSelect={() => selectSound(s)}
              />
            ))}
          </div>
        )}

        {/* Trending sounds */}
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Trending Sounds
            </span>
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
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading sounds...</span>
            </div>
          )}

          {/* Sound list */}
          {!loading && filtered.map((s) => (
            <SoundRow
              key={s.id}
              sound={s}
              isPlaying={playingId === s.id}
              isSelected={selectedAudioName === `${s.title} — ${s.artist}`}
              onPlay={() => togglePlay(s)}
              onSelect={() => selectSound(s)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SoundRow({
  sound,
  isPlaying,
  isSelected,
  onPlay,
  onSelect,
}: {
  sound: TrendingSound;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: () => void;
  onSelect: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg p-2 mb-1 transition-colors ${
      isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
    }`}>
      {/* Play */}
      <button
        onClick={onPlay}
        disabled={!sound.previewUrl}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
          sound.previewUrl
            ? 'bg-muted hover:bg-primary/20'
            : 'bg-muted/50 cursor-not-allowed'
        }`}
      >
        {isPlaying ? (
          <Pause className="h-3 w-3 text-primary" />
        ) : (
          <Play className={`h-3 w-3 ml-0.5 ${sound.previewUrl ? 'text-muted-foreground' : 'text-muted-foreground/30'}`} />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium truncate">{sound.title}</p>
          {sound.trending && (
            <span className="shrink-0 rounded-full bg-orange-100 px-1 py-0.5 text-[7px] font-bold text-orange-600 uppercase dark:bg-orange-500/10 dark:text-orange-400">
              Hot
            </span>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground truncate">
          {sound.artist} · {sound.usageCount}
        </p>
      </div>

      {/* Select */}
      <button
        onClick={onSelect}
        disabled={!sound.previewUrl}
        className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
          isSelected
            ? 'bg-primary text-primary-foreground'
            : sound.previewUrl
              ? 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
              : 'bg-muted/50 text-muted-foreground/30 cursor-not-allowed'
        }`}
      >
        {isSelected ? (
          <span className="flex items-center gap-1"><Check className="h-2.5 w-2.5" /> On</span>
        ) : (
          'Use'
        )}
      </button>
    </div>
  );
}
