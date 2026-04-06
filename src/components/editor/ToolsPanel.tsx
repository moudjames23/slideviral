'use client';

import { useRef, useCallback, useState } from 'react';
import {
  ImageIcon,
  Sparkles,
  Type,
  Trash2,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Minus,
  Plus,
  Settings,
  Music,
  Play,
  Pause,
} from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import { AIImageGenerator } from './AIImageGenerator';
import { SettingsPanel } from './SettingsPanel';
import { MusicPanel } from './MusicPanel';
import type { TextOverlay } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToolsPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const { slideshow, activeSlideIndex, updateSlide, selectedAudioUrl, selectedAudioName, setSelectedAudio } = useSlideshowStore();
  const activeSlide = slideshow.slides[activeSlideIndex];
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const selectedOverlay = activeSlide?.textOverlays.find((o) => o.id === selectedTextId);

  // Upload image
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateSlide(activeSlideIndex, { imageUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [activeSlideIndex, updateSlide],
  );

  // Add text overlay
  const addTextOverlay = useCallback(() => {
    if (!activeSlide) return;
    const newOverlay: TextOverlay = {
      id: generateId(),
      content: 'Your text here',
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: 'Inter',
      fontWeight: 700,
      color: '#ffffff',
      textAlign: 'center',
      maxWidth: 80,
      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
      lineHeight: 1.3,
    };
    updateSlide(activeSlideIndex, {
      textOverlays: [...activeSlide.textOverlays, newOverlay],
    });
    setSelectedTextId(newOverlay.id);
  }, [activeSlide, activeSlideIndex, updateSlide]);

  // Remove image
  const removeImage = useCallback(() => {
    updateSlide(activeSlideIndex, { imageUrl: undefined });
  }, [activeSlideIndex, updateSlide]);

  // Update text overlay property
  const updateOverlay = useCallback(
    (id: string, data: Partial<TextOverlay>) => {
      if (!activeSlide) return;
      const overlays = activeSlide.textOverlays.map((o) =>
        o.id === id ? { ...o, ...data } : o,
      );
      updateSlide(activeSlideIndex, { textOverlays: overlays });
    },
    [activeSlide, activeSlideIndex, updateSlide],
  );

  // Remove text overlay
  const removeOverlay = useCallback(
    (id: string) => {
      if (!activeSlide) return;
      updateSlide(activeSlideIndex, {
        textOverlays: activeSlide.textOverlays.filter((o) => o.id !== id),
      });
      if (selectedTextId === id) setSelectedTextId(null);
    },
    [activeSlide, activeSlideIndex, updateSlide, selectedTextId],
  );

  if (!activeSlide) return null;

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tools
        </h2>

        {/* Action buttons */}
        <div className="mt-4 space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Upload Image
          </button>
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            onClick={() => setShowAIGenerator(true)}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Generate with AI
          </button>
          <button
            onClick={addTextOverlay}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Type className="h-4 w-4 text-muted-foreground" />
            Add Text
          </button>
          {activeSlide.imageUrl && (
            <button
              onClick={removeImage}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Remove Image
            </button>
          )}

          {/* Music & Settings */}
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            {/* Selected audio mini-player */}
            {selectedAudioUrl && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (audioPreviewRef.current) {
                        audioPreviewRef.current.pause();
                      }
                      if (isPreviewPlaying) {
                        setIsPreviewPlaying(false);
                        return;
                      }
                      // Use proxy for external URLs
                      const url = selectedAudioUrl.startsWith('blob:') || selectedAudioUrl.startsWith('data:')
                        ? selectedAudioUrl
                        : `/api/proxy-audio?url=${encodeURIComponent(selectedAudioUrl)}`;
                      const audio = new Audio(url);
                      audio.addEventListener('ended', () => setIsPreviewPlaying(false));
                      audio.play().catch(() => setIsPreviewPlaying(false));
                      audioPreviewRef.current = audio;
                      setIsPreviewPlaying(true);
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    {isPreviewPlaying ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{selectedAudioName}</p>
                    <p className="text-[9px] text-primary">Will play in export</p>
                  </div>
                  <button
                    onClick={() => {
                      if (audioPreviewRef.current) audioPreviewRef.current.pause();
                      setSelectedAudio(null, null);
                      setIsPreviewPlaying(false);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowMusic(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Music className="h-4 w-4 text-muted-foreground" />
              {selectedAudioUrl ? 'Change Music' : 'Music'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              API Keys
            </button>
          </div>
        </div>
      </div>

      {/* Modals / Panels */}
      <MusicPanel open={showMusic} onClose={() => setShowMusic(false)} />
      <AIImageGenerator
        open={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onOpenSettings={() => {
          setShowAIGenerator(false);
          setShowSettings(true);
        }}
      />
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />

      {/* Text layers list */}
      {activeSlide.textOverlays.length > 0 && (
        <div className="border-t border-border p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Text Layers
          </h3>
          <div className="mt-3 space-y-1.5">
            {activeSlide.textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                onClick={() => setSelectedTextId(overlay.id)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selectedTextId === overlay.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="truncate max-w-[160px]">
                  {overlay.content || 'Empty text'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOverlay(overlay.id);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text style editor */}
      {selectedOverlay && (
        <div className="border-t border-border p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Text Style
          </h3>

          {/* Font size */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground">Size</label>
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() =>
                  updateOverlay(selectedOverlay.id, {
                    fontSize: Math.max(12, selectedOverlay.fontSize - 2),
                  })
                }
                className="rounded-md border border-border p-1 hover:bg-muted"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-10 text-center text-sm font-mono">
                {selectedOverlay.fontSize}
              </span>
              <button
                onClick={() =>
                  updateOverlay(selectedOverlay.id, {
                    fontSize: Math.min(120, selectedOverlay.fontSize + 2),
                  })
                }
                className="rounded-md border border-border p-1 hover:bg-muted"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Bold toggle */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground">Weight</label>
            <div className="mt-1 flex gap-1">
              {[400, 600, 700, 900].map((w) => (
                <button
                  key={w}
                  onClick={() => updateOverlay(selectedOverlay.id, { fontWeight: w })}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    selectedOverlay.fontWeight === w
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {w === 400 ? 'Light' : w === 600 ? 'Med' : w === 700 ? 'Bold' : 'Black'}
                </button>
              ))}
            </div>
          </div>

          {/* Text color */}
          <div className="mb-4">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Palette className="h-3 w-3" />
              Color
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={selectedOverlay.color}
                onChange={(e) =>
                  updateOverlay(selectedOverlay.id, { color: e.target.value })
                }
                className="h-7 w-7 cursor-pointer rounded border border-border"
              />
              <div className="flex gap-1">
                {['#ffffff', '#000000', '#ff6b6b', '#51cf66', '#339af0'].map((c) => (
                  <button
                    key={c}
                    onClick={() => updateOverlay(selectedOverlay.id, { color: c })}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      selectedOverlay.color === c ? 'border-primary' : 'border-border'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Text alignment */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground">Align</label>
            <div className="mt-1 flex gap-1">
              {[
                { value: 'left' as const, icon: AlignLeft },
                { value: 'center' as const, icon: AlignCenter },
                { value: 'right' as const, icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateOverlay(selectedOverlay.id, { textAlign: value })}
                  className={`flex-1 flex items-center justify-center rounded-md p-2 transition-colors ${
                    selectedOverlay.textAlign === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Text shadow toggle */}
          <div>
            <label className="text-xs text-muted-foreground">Shadow</label>
            <div className="mt-1 flex gap-1">
              {[
                { label: 'None', value: 'none' },
                { label: 'Soft', value: '0 2px 8px rgba(0,0,0,0.5)' },
                { label: 'Strong', value: '0 2px 12px rgba(0,0,0,0.8)' },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() =>
                    updateOverlay(selectedOverlay.id, {
                      textShadow: value === 'none' ? undefined : value,
                    })
                  }
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    (selectedOverlay.textShadow ?? 'none') === value ||
                    (!selectedOverlay.textShadow && value === 'none')
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
