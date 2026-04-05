# SlideViral — Tasks

## Phase 1: Foundations
- [ ] Setup project structure (types, lib, components directories)
- [ ] Define TypeScript types (Slide, Template, ExportConfig, AIProvider)
- [ ] Create Zustand store with all slices
- [ ] Design system: color tokens, typography, spacing in Tailwind config
- [ ] Layout component with navigation
- [ ] Install and configure shadcn/ui components (button, card, dialog, dropdown, input, select, slider, tabs, tooltip)

## Phase 2: Slide Editor
- [ ] SlideCanvas component (canvas-based, ratio-aware)
- [ ] ImageUploader (drag-and-drop + file picker + crop)
- [ ] TextOverlay (draggable, resizable, styleable)
- [ ] SlidePanel (side panel with slide settings)
- [ ] SlideTimeline (bottom bar, thumbnails, drag-to-reorder)
- [ ] Slide add/remove/duplicate controls
- [ ] Real-time preview rendering
- [ ] Undo/redo system

## Phase 3: Template System
- [ ] Template data structure and registry
- [ ] Create 10 trend templates with placeholder content
- [ ] TemplateGallery page with category filters
- [ ] TemplateCard component with preview
- [ ] Template application flow (populate editor)
- [ ] App promo slide slot (pre-configured final slide)

## Phase 4: AI Image Generation
- [ ] AIImageProvider interface
- [ ] fal.ai provider implementation
- [ ] Replicate provider implementation
- [ ] OpenAI (DALL-E) provider implementation
- [ ] Stability AI provider implementation
- [ ] API route proxies for each provider
- [ ] AIImageGenerator UI component
- [ ] Generation history (IndexedDB)
- [ ] Settings panel for API keys
- [ ] Smart prompt suggestions based on template context

## Phase 5: Export System
- [ ] Platform configuration registry
- [ ] Image export (canvas to PNG)
- [ ] ffmpeg.wasm integration
- [ ] Video composition (slides + transitions + text)
- [ ] Audio track support
- [ ] Platform-specific export presets
- [ ] Export progress UI
- [ ] ZIP download for multiple images
- [ ] Web carousel preview

## Phase 6: Project Management
- [ ] Auto-save to localStorage
- [ ] Manual save with naming
- [ ] Project list on landing page
- [ ] Load/delete projects
- [ ] JSON export/import

## Phase 7: Polish
- [ ] Page transitions (Framer Motion)
- [ ] Keyboard shortcuts (Ctrl+S save, Delete remove slide, arrows navigate)
- [ ] Responsive layout (editor works on tablet+)
- [ ] Error handling and user feedback (toasts)
- [ ] Empty states and onboarding hints
- [ ] Performance optimization (lazy loading, memo)
