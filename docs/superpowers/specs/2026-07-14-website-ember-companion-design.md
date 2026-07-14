# Website Ember companion (pointer follow)

**Date:** 2026-07-14  
**Status:** Approved design  
**Approach:** Client `EmberCompanion` + rAF lerp (#1)

## Goal

On the marketing landing page (`/`), after the cinematic hero, show an app-faithful Ember that lazily follows the visitor’s pointer and offers a short calm whisper on click.

## Non-goals

- Ember on `/privacy` or `/terms`
- GSAP-driven follower or cinematic hero rewrite
- Full chat / assistant UX
- Port of full RN Ember particle + orbit clock-hand stack
- Apple Watch or Wear marketing UI in this component

## Decisions

| Topic | Choice |
|-------|--------|
| Travel | Lazy pointer follow (offset, not stuck to tip) |
| Pages | Landing only |
| Look | App-faithful SVG (orb, eyes, smile, glow) |
| Click | Whisper bubble + soft bounce |
| Timing | Hidden during cinematic hero; appear after |
| Motion engine | `requestAnimationFrame` lerp (not GSAP) |

## Behavior

### Appear / travel

1. Companion mounts on home but stays **hidden / inactive** while `.landing-cinematic-hero` (or equivalent) occupies the viewport.
2. When that section is mostly out of view (IntersectionObserver threshold or scroll past), Ember **fades in** and begins following.
3. Fixed positioning; position updated via eased lerp toward pointer with a small offset.
4. Touch: follow last pointer/touch point softly; avoid finger-stuck overlap on primary taps.
5. `document.visibilityState === 'hidden'` → pause rAF loop.

### Look / mood

- SVG soft orb with eyes, smile silhouette, glow.
- Mood palette matches app Ember: `dawn` / `open` / `mid` / `late` / `dusk` (`src/ui/Ember.tsx` colors).
- Mood derived from **local clock** (time-of-day bands), not fake day-progress unless trivial to map.

### Click / whisper

- Click/activate Ember → soft bounce + show whisper bubble near Ember.
- Whisper lines live in `LANDING_COPY.emberCompanion.whispers` (SSOT).
- Dismiss on second click, Escape, or short timeout (~4–6s).
- Copy tone: calm companion, can lightly nudge toward Get the app — never spammy.

### Accessibility & reduced motion

- Ember is keyboard-focusable (`role="button"` or `<button>` styling) with `aria-label` e.g. “Ember, UNTIL companion”.
- Whisper announced via polite live region.
- `prefers-reduced-motion: reduce` → no pointer follow / float; Ember parked bottom-end (still clickable).

### Performance / layering

- Only Ember (and bubble when open) receive pointer events; layer below modals if any, above page content (`z-index` high but not above dialogs).
- Prefer `transform` for movement; keep SVG lightweight.

## Files

| File | Role |
|------|------|
| `website/src/components/EmberCompanion.tsx` | Client component: SVG, follow, whisper UI |
| `website/src/domain/copy.ts` | `emberCompanion` whisper strings (+ optional labels) |
| `website/src/app/page.tsx` | Mount `<EmberCompanion />` on home only |
| `website/src/app/globals.css` | Minimal bubble / reduced-motion helpers if needed |

## Success criteria

- [ ] Landing shows Ember only after cinematic hero section is past
- [ ] Ember lazily follows pointer (desktop); reduced-motion parks it
- [ ] Visual reads as Ember (orb + face + mood colors)
- [ ] Click shows a whisper from SSOT copy; dismiss works
- [ ] Privacy/terms pages have no companion
- [ ] No GSAP dependency for companion motion

## Risks

- Competing attention with cinematic hero → mitigated by delayed appear
- Mobile finger occlusion → offset + soft follow, don’t steal scroll
- z-index fights with future overlays → document stacking token
