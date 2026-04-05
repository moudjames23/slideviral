export interface TextOverlay {
  id: string;
  content: string;
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  fontSize: number; // px
  fontFamily: string;
  fontWeight: number;
  color: string;
  backgroundColor?: string;
  textShadow?: string;
  textAlign: 'left' | 'center' | 'right';
  maxWidth: number; // percentage of canvas width
  letterSpacing?: number;
  lineHeight?: number;
}

export type SlideTransition = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'dissolve';

export interface Slide {
  id: string;
  imageUrl?: string; // data URL or blob URL
  imageFile?: File;
  textOverlays: TextOverlay[];
  duration: number; // seconds
  transition: SlideTransition;
  backgroundColor: string;
  isAppPromo: boolean; // marks the final "stealth ad" slide
}

export interface Slideshow {
  id: string;
  name: string;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
  templateId?: string;
  aspectRatio: AspectRatio;
}

export type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';

export const ASPECT_RATIOS: Record<AspectRatio, { width: number; height: number; label: string }> = {
  '9:16': { width: 1080, height: 1920, label: 'Vertical (TikTok, Reels)' },
  '1:1': { width: 1080, height: 1080, label: 'Square (Instagram)' },
  '16:9': { width: 1280, height: 720, label: 'Landscape (Twitter, YouTube)' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait (Instagram Feed)' },
};
