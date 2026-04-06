'use client';

import { useState, useCallback } from 'react';
import {
  Download,
  Image as ImageIcon,
  Film,
  Smartphone,
  Monitor,
  Loader2,
  Check,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import { useSlideshowStore } from '@/lib/store';
import { exportSlideAsPng, downloadBlob } from '@/lib/export/renderer';
import { composeVideo, type VideoProgress } from '@/lib/export/video-composer';
import { PLATFORMS } from '@/types';
import type { PlatformType, ExportFormat } from '@/types';

const platformList: { type: PlatformType; icon: typeof Smartphone }[] = [
  { type: 'tiktok', icon: Smartphone },
  { type: 'ig-reels', icon: Smartphone },
  { type: 'ig-story', icon: Smartphone },
  { type: 'yt-shorts', icon: Smartphone },
  { type: 'twitter', icon: Monitor },
];

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { slideshow, exportConfig, setExportConfig } = useSlideshowStore();
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const platform = PLATFORMS[exportConfig.platform];
  const totalDuration = slideshow.slides.reduce((sum, s) => sum + s.duration, 0);

  const handleExportImages = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      for (let i = 0; i < slideshow.slides.length; i++) {
        const blob = await exportSlideAsPng(slideshow.slides[i], slideshow.aspectRatio);
        downloadBlob(blob, `${slideshow.name}_slide_${i + 1}.png`);
        await new Promise((r) => setTimeout(r, 300));
      }
      setProgress({ phase: 'done', percent: 100, message: 'Images downloaded!' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [slideshow]);

  const handleExportVideo = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setProgress({ phase: 'rendering', percent: 0, message: 'Starting...' });

    try {
      const blob = await composeVideo(slideshow.slides, slideshow.aspectRatio, setProgress);
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      downloadBlob(blob, `${slideshow.name}.${ext}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video export failed');
      setProgress({ phase: 'error', percent: 0, message: 'Failed' });
    } finally {
      setIsExporting(false);
    }
  }, [slideshow]);

  const handleExport = useCallback(() => {
    setProgress(null);
    setError(null);
    if (exportConfig.format === 'images') {
      handleExportImages();
    } else {
      handleExportVideo();
    }
  }, [exportConfig.format, handleExportImages, handleExportVideo]);

  if (!open) return null;

  return (
    <div className="fixed top-16 right-4 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Export</span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Project info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{slideshow.slides.length} slides</span>
            <span>{totalDuration}s</span>
            <span>{slideshow.aspectRatio}</span>
          </div>

          {/* Platform */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Platform
            </label>
            <div className="mt-1.5 grid grid-cols-5 gap-1">
              {platformList.map(({ type, icon: Icon }) => {
                const p = PLATFORMS[type];
                const active = exportConfig.platform === type;
                return (
                  <button
                    key={type}
                    onClick={() => setExportConfig({ platform: type })}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-[9px] font-medium leading-tight text-center ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                      {p.name.replace('Instagram ', 'IG ').replace('YouTube ', 'YT ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Format
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {([
                { value: 'video' as ExportFormat, label: 'Video', icon: Film, desc: 'With transitions' },
                { value: 'images' as ExportFormat, label: 'Images', icon: ImageIcon, desc: 'Individual PNGs' },
              ]).map(({ value, label, icon: Icon, desc }) => {
                const active = exportConfig.format === value;
                return (
                  <button
                    key={value}
                    onClick={() => setExportConfig({ format: value })}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`text-xs font-medium ${active ? 'text-primary' : ''}`}>{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-[11px]">
            <div>
              <span className="text-muted-foreground">Resolution</span>
              <p className="font-medium">{platform.width}x{platform.height}</p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {exportConfig.format === 'video' ? 'Duration' : 'Files'}
              </span>
              <p className="font-medium">
                {exportConfig.format === 'video' ? `${totalDuration}s @ ${platform.fps}fps` : `${slideshow.slides.length} PNGs`}
              </p>
            </div>
          </div>

          {/* Progress */}
          {progress && progress.phase !== 'done' && progress.phase !== 'error' && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground">{progress.message}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Done */}
          {progress?.phase === 'done' && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2.5 dark:bg-green-500/10">
              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-[11px] font-medium text-green-700 dark:text-green-300">
                {progress.message}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/5 p-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[11px] text-destructive">{error}</span>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {exportConfig.format === 'video' ? 'Video' : 'Images'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
