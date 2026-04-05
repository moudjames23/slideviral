import type { SlideTransition, AspectRatio } from './slide';

export type TemplateCategory = 'lifestyle' | 'pov' | 'list' | 'comparison' | 'reaction' | 'story';

export interface TemplateSlide {
  suggestedText: string;
  suggestedImagePrompt: string; // AI prompt to generate a fitting image
  transition: SlideTransition;
  duration: number;
  isAppPromo: boolean;
  textStyle?: {
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    position?: { x: number; y: number };
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface TrendTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  slides: TemplateSlide[];
  suggestedMusic: string[];
  suggestedPlatforms: AspectRatio[];
  previewImageUrl?: string;
  viralScore: number; // 1-10
  tags: string[];
}
