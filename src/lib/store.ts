'use client';

import { create } from 'zustand';
import { saveProjectImages, loadProjectImages, deleteProjectImages } from '@/lib/storage/image-db';
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
  hydrated: boolean;

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

  // Audio
  selectedAudioUrl: string | null;
  selectedAudioName: string | null;
  setSelectedAudio: (url: string | null, name: string | null) => void;

  // Export
  exportConfig: ExportConfig;
  setExportConfig: (config: Partial<ExportConfig>) => void;

  // Projects
  savedProjects: Array<{ id: string; name: string; updatedAt: number }>;
  saveProject: () => void;
  loadProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => void;
  loadProjectList: () => void;
  restoreLastProject: () => Promise<void>;
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
  hydrated: false,

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

    // Auto-select music: fetch trending sounds and pick one matching the template mood
    const templateMood =
      template.tags?.includes('dreamy') || template.tags?.includes('emotional') ? 'dreamy'
      : template.tags?.includes('energetic') || template.tags?.includes('edgy') ? 'energetic'
      : template.tags?.includes('chill') || template.tags?.includes('casual') ? 'chill'
      : template.category === 'comparison' || template.category === 'reaction' ? 'confident'
      : 'dreamy';

    // Fire-and-forget: fetch trending sounds and auto-select
    fetch(`/api/trending-sounds?mood=${templateMood}`)
      .then((r) => r.json())
      .then((data) => {
        const sounds = (data.sounds || []) as Array<{ title: string; artist: string; previewUrl: string | null; trending: boolean }>;
        const best = sounds.find((s) => s.trending && s.previewUrl) || sounds.find((s) => s.previewUrl);
        if (best?.previewUrl) {
          set({
            selectedAudioUrl: best.previewUrl,
            selectedAudioName: `${best.title} — ${best.artist}`,
          });
        }
      })
      .catch(() => {}); // silently fail if offline

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

  // Audio
  selectedAudioUrl: null,
  selectedAudioName: null,

  setSelectedAudio: (url, name) => {
    set({ selectedAudioUrl: url, selectedAudioName: name });
    // Persist to localStorage (only external URLs, not blob:)
    if (typeof window !== 'undefined') {
      if (url && !url.startsWith('blob:')) {
        localStorage.setItem('slideviral-audio', JSON.stringify({ url, name }));
      } else if (!url) {
        localStorage.removeItem('slideviral-audio');
      }
    }
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
      // Save images to IndexedDB (async, fire-and-forget)
      saveProjectImages(project.id, project.slides).catch(() => {});

      // Save project metadata + slide config (without image data) to localStorage
      const lightweight = {
        ...project,
        slides: project.slides.map((s) => ({
          ...s,
          // Keep a marker that an image exists, but strip the data URL
          imageUrl: s.imageUrl ? (s.imageUrl.startsWith('data:') ? `idb:${s.id}` : s.imageUrl) : undefined,
          imageFile: undefined,
        })),
      };

      try {
        localStorage.setItem(
          `slideviral-project-${project.id}`,
          JSON.stringify(lightweight),
        );
      } catch {
        console.warn('Failed to save project to localStorage');
        return;
      }

      // Update project list
      const list = JSON.parse(localStorage.getItem('slideviral-projects') || '[]');
      const existing = list.findIndex((p: { id: string }) => p.id === project.id);
      const meta = { id: project.id, name: project.name, updatedAt: project.updatedAt };
      if (existing >= 0) list[existing] = meta;
      else list.push(meta);
      localStorage.setItem('slideviral-projects', JSON.stringify(list));

      // Track last active project for auto-restore
      localStorage.setItem('slideviral-last-project', project.id);

      set({ savedProjects: list });
    }
  },

  loadProject: async (id) => {
    if (typeof window === 'undefined') return;

    const raw = localStorage.getItem(`slideviral-project-${id}`);
    if (!raw) return;

    const slideshow = JSON.parse(raw) as Slideshow;

    // Restore images from IndexedDB
    const slideIds = slideshow.slides.map((s) => s.id);
    const images = await loadProjectImages(id, slideIds);

    // Rehydrate image URLs
    const slides = slideshow.slides.map((s) => {
      let imageUrl = s.imageUrl;
      // If it's an idb marker, restore from IndexedDB
      if (imageUrl?.startsWith('idb:')) {
        const slideId = imageUrl.slice(4);
        imageUrl = images[slideId] || undefined;
      }
      // Also check by slide id directly
      if (!imageUrl && images[s.id]) {
        imageUrl = images[s.id];
      }
      return { ...s, imageUrl };
    });

    // Don't overwrite if a template was applied while we were loading images
    const currentState = get();
    if (currentState.activeTemplate || currentState.slideshow.templateId) {
      return;
    }

    set({
      slideshow: { ...slideshow, slides },
      activeSlideIndex: 0,
      hydrated: true,
    });

    // Track as last active
    localStorage.setItem('slideviral-last-project', id);
  },

  deleteProject: (id) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`slideviral-project-${id}`);
      deleteProjectImages(id).catch(() => {});

      const list = JSON.parse(localStorage.getItem('slideviral-projects') || '[]');
      const filtered = list.filter((p: { id: string }) => p.id !== id);
      localStorage.setItem('slideviral-projects', JSON.stringify(filtered));

      // Clear last project if it was this one
      if (localStorage.getItem('slideviral-last-project') === id) {
        localStorage.removeItem('slideviral-last-project');
      }

      set({ savedProjects: filtered });
    }
  },

  loadProjectList: () => {
    if (typeof window !== 'undefined') {
      const list = JSON.parse(localStorage.getItem('slideviral-projects') || '[]');

      // Also restore API keys
      try {
        const keys = localStorage.getItem('slideviral-api-keys');
        if (keys) set({ apiKeys: JSON.parse(keys) });
      } catch { /* ignore */ }

      set({ savedProjects: list });
    }
  },

  restoreLastProject: async () => {
    if (typeof window === 'undefined') return;

    // Don't overwrite if a template was already applied (race condition guard)
    const currentState = get();
    if (currentState.activeTemplate || currentState.slideshow.templateId) {
      set({ hydrated: true });
      return;
    }

    const lastId = localStorage.getItem('slideviral-last-project');
    if (lastId) {
      // Check again after async load — template may have been applied while we were loading
      await get().loadProject(lastId);
    }

    // Also restore API keys
    try {
      const keys = localStorage.getItem('slideviral-api-keys');
      if (keys) set({ apiKeys: JSON.parse(keys) });
    } catch { /* ignore */ }

    // Restore selected audio
    try {
      const audio = localStorage.getItem('slideviral-audio');
      if (audio) {
        const { url, name } = JSON.parse(audio);
        if (url) set({ selectedAudioUrl: url, selectedAudioName: name });
      }
    } catch { /* ignore */ }

    set({ hydrated: true });
  },
}));
