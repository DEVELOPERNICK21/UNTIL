# ASO Studio Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Unlisted `/tools/aso-studio` tool that composites raw screenshots into App Store / Play Store marketing frames and exports a ZIP with store copy.

**Architecture:** Client-only Next.js page under `website/`. HTML canvas compositing (preview + full-res export). No server uploads, no AI. Nested tools layout without marketing Header/Footer; `robots: noindex`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, HTML Canvas, JSZip

## Global Constraints

- Route: `/tools/aso-studio` · unlisted · `noindex`
- Templates v1: Text-over-screen, Minimal Frame
- Sizes v1: iOS 6.9" (1290×2796 default; 1320×2868 / 1260×2736 picker) + Android phone 1080×1920
- Manual store copy + live char counters; block export if over limit
- Device frames: simple rounded-rect + notch/island SVG paths (no Apple/Google assets)

---

### Task 1: Route group + scaffold

- [x] Move marketing pages into `(marketing)/` with Header/Footer layout
- [x] Add `tools/aso-studio/layout.tsx` (bare, noindex) + `page.tsx`
- [x] Install `jszip`

### Task 2: Specs + templates

- [x] `storeSpecs.ts`, `limits.ts`, `types.ts`
- [x] Pure canvas renderers: `minimalFrame`, `textOverScreen`

### Task 3: Studio UI

- [x] Upload, template picker, per-slide editor, live preview, copy panel, cheat sheet

### Task 4: Export

- [x] Full-res canvas render → JSZip (`ios/6.9in/`, `android/phone/`, `icons/`, `copy/`)

### Task 5: Verify

- [x] `npm run build` in `website/`
