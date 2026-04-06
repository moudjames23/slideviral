'use client';

import { create } from 'zustand';
import type {
  Slide,
  Slideshow,
  AspectRatio,
  TrendTemplate,
  AIProviderType,
  ExportConfig,
  PlatformType,
} from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultSlide(isAppPromo = false): Slide {
  return {
    id: generateId(),
    textOverlays: [],
    duration: 3,
    transition: 'fade',
    backgroundColor: '#000000',
    isAppPromo,
  };
}

interface SlideshowState {
  // Current slideshow
  slideshow: Slideshow;
  activeSlideIndex: number;

  // Slide actions
  setActiveSlide: (index: number) => void;
  addSlide: (slide?: Partial<Slide>) => void;
  removeSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  updateSlide: (index: number, data: Partial<Slide>) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;

  // Slideshow actions
  setAspectRatio: (ratio: AspectRatio) => void;
  setSlideshowName: (name: string) => void;
  resetSlideshow: () => void;

  // Template
  activeTemplate: TrendTemplate | null;
  applyTemplate: (template: TrendTemplate) => void;
  clearTemplate: () => void;

  // AI
  aiProvider: AIProviderType;
  apiKeys: Record<string, string>;
  setAiProvider: (provider: AIProviderType) => void;
  setApiKey: (provider: string, key: string) => void;

  // Export
  exportConfig: ExportConfig;
  setExportConfig: (config: Partial<ExportConfig>) => void;

  // Projects
  savedProjects: Array<{ id: string; name: string; updatedAt: number }>;
  saveProject: () => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  loadProjectList: () => void;
}

const defaultSlideshow: Slideshow = {
  id: generateId(),
  name: 'Untitled Slideshow',
  slides: [createDefaultSlide()],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  aspectRatio: '9:16',
};

const defaultExportConfig: ExportConfig = {
  platform: 'tiktok' as PlatformType,
  format: 'video',
  quality: 'high',
  includeAudio: false,
};

export const useSlideshowStore = create<SlideshowState>((set, get) => ({
  slideshow: { ...defaultSlideshow },
  activeSlideIndex: 0,

  setActiveSlide: (index) => set({ activeSlideIndex: index }),

  addSlide: (partial) => {
    set((state) => {
      const newSlide: Slide = { ...createDefaultSlide(), ...partial };
      const slides = [...state.slideshow.slides, newSlide];
      return {
        slideshow: { ...state.slideshow, slides, updatedAt: Date.now() },
        activeSlideIndex: slides.length - 1,
      };
    });
  },

  removeSlide: (index) => {
    set((state) => {
      if (state.slideshow.slides.length <= 1) return state;
      const slides = state.slideshow.slides.filter((_, i) => i !== index);
      const newIndex = Math.min(state.activeSlideIndex, slides.length - 1);
      return {
        slideshow: { ...state.slideshow, slides, updatedAt: Date.now() },
        activeSlideIndex: newIndex,
      };
    });
  },

  duplicateSlide: (index) => {
    set((state) => {
      const source = state.slideshow.slides[index];
      if (!source) return state;
      const duplicate: Slide = {
        ...source,
        id: generateId(),
        textOverlays: source.textOverlays.map((t) => ({ ...t, id: generateId() })),
      };
      const slides = [...state.slideshow.slides];
      slides.splice(index + 1, 0, duplicate);
      return {
        slideshow: { ...state.slideshow, slides, updatedAt: Date.now() },
        activeSlideIndex: index + 1,
      };
    });
  },

  updateSlide: (index, data) => {
    set((state) => {
      const slides = [...state.slideshow.slides];
      slides[index] = { ...slides[index], ...data };
      return { slideshow: { ...state.slideshow, slides, updatedAt: Date.now() } };
    });
  },

  reorderSlides: (fromIndex, toIndex) => {
    set((state) => {
      const slides = [...state.slideshow.slides];
      const [moved] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, moved);
      return {
        slideshow: { ...state.slideshow, slides, updatedAt: Date.now() },
        activeSlideIndex: toIndex,
      };
    });
  },

  setAspectRatio: (ratio) => {
    set((state) => ({
      slideshow: { ...state.slideshow, aspectRatio: ratio, updatedAt: Date.now() },
    }));
  },

  setSlideshowName: (name) => {
    set((state) => ({
      slideshow: { ...state.slideshow, name, updatedAt: Date.now() },
    }));
  },

  resetSlideshow: () => {
    set({
      slideshow: { ...defaultSlideshow, id: generateId(), createdAt: Date.now(), updatedAt: Date.now() },
      activeSlideIndex: 0,
      activeTemplate: null,
    });
  },

  // Template
  activeTemplate: null,

  applyTemplate: (template) => {
    const slides: Slide[] = template.slides.map((ts) => ({
      id: generateId(),
      textOverlays: ts.suggestedText
        ? [
            {
              id: generateId(),
              content: ts.suggestedText,
              x: ts.textStyle?.position?.x ?? 50,
              y: ts.textStyle?.position?.y ?? 40,
              fontSize: ts.textStyle?.fontSize ?? 32,
              fontFamily: 'Inter',
              fontWeight: ts.textStyle?.fontWeight ?? 700,
              color: ts.textStyle?.color ?? '#ffffff',
              textAlign: ts.textStyle?.textAlign ?? 'center',
              maxWidth: 80,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            },
          ]
        : [],
      duration: ts.duration,
      transition: ts.transition,
      backgroundColor: '#000000',
      isAppPromo: ts.isAppPromo,
    }));

    set({
      slideshow: {
        id: generateId(),
        name: template.name,
        slides,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        templateId: template.id,
        aspectRatio: template.suggestedPlatforms[0] ?? '9:16',
      },
      activeSlideIndex: 0,
      activeTemplate: template,
    });
  },

  clearTemplate: () => set({ activeTemplate: null }),

  // AI
  aiProvider: 'fal',
  apiKeys: {},

  setAiProvider: (provider) => set({ aiProvider: provider }),

  setApiKey: (provider, key) => {
    set((state) => {
      const apiKeys = { ...state.apiKeys, [provider]: key };
      if (typeof window !== 'undefined') {
        localStorage.setItem('slideviral-api-keys', JSON.stringify(apiKeys));
      }
      return { apiKeys };
    });
  },

  // Export
  exportConfig: defaultExportConfig,

  setExportConfig: (config) => {
    set((state) => ({
      exportConfig: { ...state.exportConfig, ...config },
    }));
  },

  // Projects
  savedProjects: [],

  saveProject: () => {
    const state = get();
    const project = { ...state.slideshow, updatedAt: Date.now() };
    if (typeof window !== 'undefined') {
      // Strip large data URLs from slides to avoid localStorage quota issues.
      // Only keep external URLs (http/https). Data URLs (base64 images) are
      // too large for the ~5MB localStorage limit.
      const lightweight = {
        ...project,
        slides: project.slides.map((s) => ({
          ...s,
          imageUrl: s.imageUrl?.startsWith('data:') ? undefined : s.imageUrl,
          imageFile: undefined, // File objects aren't serializable
        })),
      };
      try {
        localStorage.setItem(
          `slideviral-project-${project.id}`,
          JSON.stringify(lightweight),
        );
      } catch (e) {
        // If it still exceeds quota, save without any images
        const minimal = {
          ...project,
          slides: project.slides.map((s) => ({
            ...s,
            imageUrl: undefined,
            imageFile: undefined,
          })),
        };
        try {
          localStorage.setItem(
            `slideviral-project-${project.id}`,
            JSON.stringify(minimal),
          );
        } catch {
          console.warn('Failed to save project: localStorage quota exceeded');
          return;
        }
      }
      const list = JSON.parse(localStorage.getItem('slideviral-projects') || '[]');
      const existing = list.findIndex((p: { id: string }) => p.id === project.id);
      const meta = { id: project.id, name: project.name, updatedAt: project.updatedAt };
      if (existing >= 0) list[existing] = meta;
      else list.push(meta);
      localStorage.setItem('slideviral-projects', JSON.stringify(list));
      set({ savedProjects: list });
    }
  },

  loadProject: (id) => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(`slideviral-project-${id}`);
      if (raw) {
        const slideshow = JSON.parse(raw) as Slideshow;
        set({ slideshow, activeSlideIndex: 0 });
      }
    }
  },

  deleteProject: (id) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`slideviral-project-${id}`);
      const list = JSON.parse(localStorage.getItem('slideviral-projects') || '[]');
      const filtered = list.filter((p: { id: string }) => p.id !== id);
      localStorage.setItem('slideviral-projects', JSON.stringify(filtered));
      set({ savedProjects: filtered });
    }
  },

  loadProjectList: () => {
    if (typeof window !== 'undefined') {
      const list = JSON.parse(localStorage.getItem('slideviral-projects') || '[]');
      set({ savedProjects: list });
    }
  },
}));
