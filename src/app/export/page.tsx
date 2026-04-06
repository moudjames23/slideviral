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

const formatOptions: { value: ExportFormat; label: string; desc: string; icon: typeof Film }[] = [
  { value: 'video', label: 'Video', desc: 'MP4 with transitions', icon: Film },
  { value: 'images', label: 'Images', desc: 'Individual PNGs', icon: ImageIcon },
];

export default function ExportPage() {
  const { slideshow, exportConfig, setExportConfig, selectedAudioUrl } = useSlideshowStore();
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platform = PLATFORMS[exportConfig.platform];
  const hasSlides = slideshow.slides.length > 0;
  const totalDuration = slideshow.slides.reduce((sum, s) => sum + s.duration, 0);

  const handleExportImages = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      for (let i = 0; i < slideshow.slides.length; i++) {
        const blob = await exportSlideAsPng(slideshow.slides[i], slideshow.aspectRatio);
        downloadBlob(blob, `${slideshow.name}_slide_${i + 1}.png`);
        // Small delay between downloads
        await new Promise((r) => setTimeout(r, 300));
      }
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
      const blob = await composeVideo(
        slideshow.slides,
        slideshow.aspectRatio,
        setProgress,
        selectedAudioUrl,
      );

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
    if (exportConfig.format === 'images') {
      handleExportImages();
    } else {
      handleExportVideo();
    }
  }, [exportConfig.format, handleExportImages, handleExportVideo]);

  return (
    <div className="mx-auto max-w-screen-md px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export</h1>
          <p className="text-sm text-muted-foreground">
            Download your slideshow for any platform.
          </p>
        </div>
      </div>

      {!hasSlides ? (
        <div className="rounded-xl border border-border p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No slides to export. Create a slideshow first.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Project summary */}
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-2">{slideshow.name}</h3>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{slideshow.slides.length} slides</span>
              <span>{totalDuration}s total</span>
              <span>{slideshow.aspectRatio}</span>
            </div>
          </div>

          {/* Platform selector */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Platform
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {platformList.map(({ type, icon: Icon }) => {
                const p = PLATFORMS[type];
                const active = exportConfig.platform === type;
                return (
                  <button
                    key={type}
                    onClick={() => setExportConfig({ platform: type })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      active
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.width}x{p.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Format
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map(({ value, label, desc, icon: Icon }) => {
                const active = exportConfig.format === value;
                return (
                  <button
                    key={value}
                    onClick={() => setExportConfig({ format: value })}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`rounded-lg p-2 ${active ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${active ? 'text-primary' : ''}`}>{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export specs */}
          <div className="rounded-xl bg-muted/50 p-5">
            <h3 className="text-sm font-semibold mb-3">Export Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Resolution</span>
                <p className="font-medium">{platform.width} x {platform.height}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Aspect Ratio</span>
                <p className="font-medium">{platform.aspectRatio}</p>
              </div>
              {exportConfig.format === 'video' && (
                <>
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <p className="font-medium">{totalDuration}s</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frame Rate</span>
                    <p className="font-medium">{platform.fps} fps</p>
                  </div>
                </>
              )}
              {exportConfig.format === 'images' && (
                <div>
                  <span className="text-muted-foreground">Files</span>
                  <p className="font-medium">{slideshow.slides.length} PNGs</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {progress && progress.phase !== 'done' && progress.phase !== 'error' && (
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">{progress.message}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {progress?.phase === 'done' && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                Export complete! Check your downloads.
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Export {exportConfig.format === 'video' ? 'Video' : 'Images'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
