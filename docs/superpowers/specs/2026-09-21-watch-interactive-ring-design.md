# Watch Hub Interactive Ring · Wear Parity + Motion

**Date:** 2026-09-21  
**Status:** Approved  
**Platforms:** Wear OS (`android/wear`), watchOS (`ios/UNTILWatch Watch App`)  
**Builds on:** [`2026-09-21-watch-progress-ring-design.md`](./2026-09-21-watch-progress-ring-design.md), [`2026-07-20-wear-time-hub-design.md`](./2026-07-20-wear-time-hub-design.md)  
**Inspiration:** Premium watch refs (thick arc, glowing tip halo, centered metric, swipe dots) — adapted to UNTIL progress colors, not fitness branding

## Goal

Make Time Hub pages on **both** watches feel like the reference video/screens: colorful circular progress with a **living glowing tip**, light tap feedback, and fill-on-appear — while bringing **Wear OS** to visual parity with the Apple Watch ring reskin.

## Decisions

| Decision | Choice |
|----------|--------|
| Scope | Approach 1: shared visual language, platform-native motion |
| Wear | Full colorful ring hub chrome (replace linear bar) |
| Apple Watch | Keep existing ring layout; add motion only |
| Tip pulse | Soft **continuous** halo pulse while page is visible |
| Extra motion | Fill animates on appear; tap bounce on ring |
| Reduce Motion | Pulse + bounce off; fill snaps to value |
| Complications / tiles | Unchanged |

## Layout (parity)

Both platforms:

1. Period title (caps) above  
2. Thick full ring; `%` centered inside  
3. Remaining label under the ring  
4. Swipe pages: Day / Month / Year / Life + page dots  

Wear-specific removals: linear red/green capsule, fixed orange `%`, dual passed/left colored lines as primary chrome (remaining line stays; passed line may drop to keep the dial clean like Apple).

Life empty copy unchanged on both platforms.

## Color

Same continuum as phone / Apple Watch ring:

| Progress | Hex |
|----------|-----|
| 0 | `#22C55E` |
| 0.5 | `#F59E0B` |
| 1 | `#EF4444` |

Track `~#2A2A2E`, background `#0E0E10`, title grey, `%` / remaining near-white.

Hide tip when progress ≈ 0 (`< 0.001`).

## Motion (video-inspired)

| Event | Behavior | Timing |
|-------|----------|--------|
| Page visible | Tip halo breathes (opacity ~0.25→0.55, scale ~1.0→1.15) | ~1.2s ease-in-out, loop |
| Page appear / swipe-in | Fill animates from 0 → current progress; `%` may slight fade/scale | ~0.45s ease-out |
| Tap ring / `%` area | Bounce scale 1 → ~1.06 → 1; optional light haptic; one stronger pulse cycle | ~0.25s bounce |
| Reduce Motion / animator scale 0 | No pulse, no bounce; fill at final value | — |

Borrow from refs: glowing tip + soft halo, thick stroke, centered hero metric.  
Do **not** borrow: flame icons, HR waveforms, multi-activity ring stacks, teal gradient skins, rotary scrub.

## Implementation

### Wear OS

| Piece | Role |
|-------|------|
| `ProgressColor.kt` | Pure JVM-testable green→amber→red |
| `ProgressRingView.kt` | Custom View: track, animated fill, tip + pulse, tap bounce |
| `TimePeriodPageView.kt` | Compose ring layout; remove old bar chrome |

### Apple Watch

| Piece | Role |
|-------|------|
| `WatchProgressRing.swift` | Tip pulse loop, appear fill animation, tap bounce; Reduce Motion |
| `TimePeriodPageView.swift` | Tap target; trigger appear when page becomes active |

### Docs

Short notes in `docs/WEAR_OS.md` and `docs/APPLE_WATCH.md` pointing at this spec.

## Out of scope

- Complication / tile chrome  
- Phone or website UI  
- Continuous full-ring shimmer / rainbow stroke  
- Crown / rotary scrub / haptic tick scrubbing  
- New hub pages or metrics  

## Verification

1. Wear: install on watch emulator only; swipe four pages; confirm ring colors, continuous tip pulse, tap bounce, Life empty  
2. Apple Watch: same checks; Reduce Motion on → static tip, no bounce  
3. Large font / Dynamic Type: text readable; ring may shrink  
4. Wear WO-V1: no clipped essential text at large font  

## Follow-up (not this plan)

- Complication ring color sync  
- Optional page-dot brighten on swipe  
