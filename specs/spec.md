# SlideViral — Feature Specification

## Overview
A web platform that enables creators to build viral TikTok/Reels/Shorts slideshows for stealth app promotion. Users select a viral trend template, customize slides with their own or AI-generated images, add text overlays, and export in platform-optimized formats.

---

## Feature 1: Slide Editor

### What
A canvas-based editor where users compose individual slides with images and text overlays.

### Why
The core creation experience. Users need precise control over how each slide looks to match viral trend aesthetics.

### Requirements
- Canvas displays at the selected platform ratio (9:16 default)
- Users can upload images via drag-and-drop or file picker
- Images can be repositioned, cropped, and scaled within the canvas
- Text overlays support: content, font size, font family, color, position (draggable), text shadow, background
- Each slide has a configurable duration (2-10 seconds, default 3s)
- Each slide has a transition type to the next (fade, slide, zoom, none)
- Timeline at bottom shows all slides as thumbnails, supports drag-to-reorder
- Add/remove slides from timeline
- Real-time preview of the current slide

### Acceptance Criteria
- [ ] User can create a slideshow with 1-10 slides
- [ ] Each slide displays correctly at 9:16 ratio
- [ ] Text can be dragged to any position on the slide
- [ ] Slides can be reordered via drag-and-drop in timeline
- [ ] Preview shows the slide exactly as it will be exported

---

## Feature 2: Trend Template System

### What
A library of pre-built slideshow templates based on viral TikTok/Reels trends.

### Why
Most users don't know which trends work. Templates encode proven viral patterns and make creation 10x faster.

### Requirements
- Template gallery page with category filters (lifestyle, POV, list, comparison, reaction)
- Each template defines: slide count, text per slide, suggested image style, suggested music
- Every template has a final "app promo" slide slot pre-configured
- Applying a template pre-fills the editor with placeholder content
- Templates are fully editable after application
- Template cards show: name, preview thumbnail, category, estimated viral score

### Templates (v1)
1. "I close my eyes..." — 3 slides, lifestyle + app
2. "POV: you just..." — 3 slides, narrative + app
3. "Things that make sense in [year]" — 4 slides, list + app
4. "Nobody asked but..." — 2 slides + app
5. "This changed my life" — before/after + app
6. "Rate my [routine/setup]" — gallery + app
7. "Tell me without telling me" — metaphor + app
8. "The difference between X and Y" — comparison + app
9. "What $X gets you" — value prop + app
10. "Day in my life as a..." — story + app

### Acceptance Criteria
- [ ] Gallery displays all templates with thumbnails
- [ ] Filters work correctly (category, platform)
- [ ] Applying a template populates the editor correctly
- [ ] All template content is editable after application
- [ ] App promo slide is clearly marked and pre-configured

---

## Feature 3: AI Image Generation

### What
Generate images for slides using multiple AI providers (fal.ai, Replicate, OpenAI, Stability AI).

### Why
Not everyone has lifestyle photos. AI generation lets anyone create professional-looking slides.

### Requirements
- Unified generation interface regardless of provider
- Provider selector with model list per provider
- Prompt input with smart suggestions based on template context
- Generated image preview before inserting into slide
- Generation history (last 20 images, stored in IndexedDB)
- API keys stored in localStorage, never sent to server except via proxy
- API route proxies handle CORS for each provider

### Providers (v1)
| Provider | Models | Key Format |
|----------|--------|------------|
| fal.ai | FLUX.1 [schnell], FLUX.1 [dev] | FAL_KEY |
| Replicate | SDXL, Playground v2.5 | REPLICATE_API_TOKEN |
| OpenAI | DALL-E 3 | OPENAI_API_KEY |
| Stability AI | SD3, SDXL | STABILITY_API_KEY |

### Acceptance Criteria
- [ ] User can generate an image from any configured provider
- [ ] Generated image appears in preview before insertion
- [ ] Image can be inserted into the active slide
- [ ] Multiple providers can be configured simultaneously
- [ ] Missing API key shows clear setup instructions

---

## Feature 4: Multi-Platform Export

### What
Export slideshows in platform-optimized formats: video (MP4), individual images (PNG), or web carousel.

### Why
Each platform has specific requirements. Users need one-click export that meets those specs.

### Requirements
- Platform selector: TikTok, Instagram Reels, Instagram Story, YouTube Shorts, Twitter/X
- Each platform auto-configures: ratio, resolution, duration limits
- Video export via ffmpeg.wasm (client-side only)
- Video includes: slide transitions, text overlays baked in, optional audio track
- Image export: each slide as individual high-res PNG
- Web preview: shareable carousel view (stored locally)
- Progress indicator during video encoding
- Download as single file (video) or ZIP (images)

### Platform Specs
| Platform | Ratio | Resolution | Max Duration |
|----------|-------|------------|-------------|
| TikTok | 9:16 | 1080x1920 | 60s |
| IG Reels | 9:16 | 1080x1920 | 90s |
| IG Story | 9:16 | 1080x1920 | 15s |
| YT Shorts | 9:16 | 1080x1920 | 60s |
| Twitter/X | 16:9 | 1280x720 | 140s |

### Acceptance Criteria
- [ ] Video exports play correctly on each target platform
- [ ] Transitions render smoothly in exported video
- [ ] Text overlays are crisp in exported media
- [ ] Image export produces correct resolution PNGs
- [ ] Export progress is shown to user

---

## Feature 5: Project Persistence

### What
Save and load slideshow projects locally.

### Why
Users may work on slideshows across sessions. Local persistence with no account needed.

### Requirements
- Auto-save current project to localStorage every 30 seconds
- Manual save with custom project name
- Project list on landing page showing saved projects
- Load any saved project back into editor
- Delete saved projects
- Export project as JSON file (backup)
- Import project from JSON file

### Acceptance Criteria
- [ ] Project auto-saves without user action
- [ ] User can name and save projects manually
- [ ] Saved projects appear on landing page
- [ ] Projects can be loaded, deleted, exported, imported
