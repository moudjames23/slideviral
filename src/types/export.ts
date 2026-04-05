import type { AspectRatio } from './slide';

export type PlatformType = 'tiktok' | 'ig-reels' | 'ig-story' | 'yt-shorts' | 'twitter';
export type ExportFormat = 'video' | 'images' | 'web';

export interface PlatformSpec {
  type: PlatformType;
  name: string;
  icon: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  maxDuration: number; // seconds
  videoCodec: string;
  fps: number;
}

export interface ExportConfig {
  platform: PlatformType;
  format: ExportFormat;
  quality: 'high' | 'medium' | 'low';
  includeAudio: boolean;
  audioFile?: File;
}

export const PLATFORMS: Record<PlatformType, PlatformSpec> = {
  tiktok: {
    type: 'tiktok',
    name: 'TikTok',
    icon: 'smartphone',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 60,
    videoCodec: 'h264',
    fps: 30,
  },
  'ig-reels': {
    type: 'ig-reels',
    name: 'Instagram Reels',
    icon: 'instagram',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 90,
    videoCodec: 'h264',
    fps: 30,
  },
  'ig-story': {
    type: 'ig-story',
    name: 'Instagram Story',
    icon: 'circle-dot',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 15,
    videoCodec: 'h264',
    fps: 30,
  },
  'yt-shorts': {
    type: 'yt-shorts',
    name: 'YouTube Shorts',
    icon: 'youtube',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDuration: 60,
    videoCodec: 'h264',
    fps: 30,
  },
  twitter: {
    type: 'twitter',
    name: 'Twitter / X',
    icon: 'twitter',
    aspectRatio: '16:9',
    width: 1280,
    height: 720,
    maxDuration: 140,
    videoCodec: 'h264',
    fps: 30,
  },
};
