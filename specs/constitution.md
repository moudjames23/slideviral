# SlideViral — Constitution

## Purpose
SlideViral is a web platform for creating viral slideshow content that promotes apps and products using the "stealth ad" strategy — where organic-looking trend content naturally leads into a product showcase on the final slide.

## Governing Principles

### 1. Design First
- Clean, minimal, intentional UI — no visual clutter
- Every color, spacing, and interaction must feel deliberate
- No generic AI-generated aesthetics. Human-crafted feel.
- High contrast, accessible, consistent palette throughout

### 2. User Autonomy
- No accounts, no auth — open and frictionless
- All data stays client-side (localStorage, IndexedDB)
- Users own their API keys — stored locally, proxied only for CORS

### 3. Output Quality
- Exported content must look native to each platform
- Video encoding must meet platform specs exactly
- Images must be high-res and production-ready

### 4. Modular AI
- AI image generation supports multiple providers via a unified interface
- Adding a new provider = implementing one interface
- Users pick their preferred provider and model

### 5. Template-Driven
- Viral trends are codified as reusable templates
- Templates guide but don't constrain — every element is editable
- The "app promo" final slide is always the anchor pattern

### 6. Performance
- Video composition runs client-side (ffmpeg.wasm)
- No server-side processing for core flows
- Fast, responsive editor — no loading spinners during editing

## Technical Constraints
- Next.js 15 (App Router), TypeScript strict mode
- Tailwind CSS + shadcn/ui for UI components
- Zustand for state management
- No database — localStorage + IndexedDB only
- API routes only for proxying AI provider calls
