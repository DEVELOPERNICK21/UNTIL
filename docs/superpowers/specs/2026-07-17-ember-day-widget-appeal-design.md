# Ember Day widget appeal redesign

**Date:** 2026-07-17  
**Status:** Approved — ready for implementation  
**Inspiration:** Duolingo / Stimuler character widgets (mood × gradient × streak × bold number)  
**Scope:** Day home-screen widget only (small + medium), iOS + Android  
**Depends on:** [2026-07-14 Ember widgets Phase 1](./2026-07-14-ember-widgets-phase1-design.md)

## Goal

Make the Day widget feel like a **companion glance**, not a flat percentage tile: Ember mood, solid mood gradient, bold leftover time, one UNTIL line, and a 7-day presence streak row — Duo-inspired layout, UNTIL brand voice.

## Non-goals

- Animated Ember on the widget
- Month / Year / Life / Tasks / Counter restyle (later phases)
- Guilt / “I’ll die” copy (reject Duo cruelty; keep UNTIL clarity)
- Live blur / true glass on OS widgets
- Changing trial, pricing, or Play product IDs

## Success criteria

1. Small and medium Day widgets use **full-opacity mood gradients** (no washed-out glass).
2. Medium layout is **Ember left · content right** (Duo medium pattern).
3. Ember face + gradient band from the same day-progress mood rules as in-app Ember.
4. Urgent copy is exactly: **“This day will never repeat.”**
5. Medium shows **7 presence-streak dots** when streak data is available; graceful empty state otherwise.
6. Visual parity on iOS WidgetKit and Android App Widget (Day family).
7. Tap opens the app (Day / Home) — same as today.
8. In-app `WidgetPreview` for Day matches the new layout language.

## Constraints

| Platform | Reality |
|----------|---------|
| Android | RemoteViews + Canvas/bitmap Ember; gradients via drawable or pre-rendered bitmap background |
| iOS | SwiftUI; static timeline refresh; Ember as SwiftUI shapes / shared glyph |
| Both | Snapshot UI only; refresh when app syncs widget cache / periodic worker |
| Data | Extend `WidgetCache` only when needed; keep MMKV schema shared with native |

## Mood system (3 bands for v1)

Map day progress `0…1` (passed fraction of today) into three appeal moods. Align with existing Ember bands where possible (`dawn`/`open` → Calm, `mid` → Mid, `late`/`dusk` → Urgent).

| Mood | Progress (passed) | Gradient feel | Ember | Headline support | Body line |
|------|-------------------|---------------|-------|------------------|-----------|
| **Calm** | &lt; ~0.40 | Soft amber → cream | Soft / open | Leftover time bold | “Day still open” |
| **Mid** | ~0.40–0.70 | Ember orange → warm | Focused | Leftover time bold | “Make the hours count” |
| **Urgent** | ≥ ~0.70 | Deep ember → warm red | Intense | Leftover time bold | **“This day will never repeat.”** |

Exact thresholds may reuse existing Ember mood cutoffs in `Ember.tsx` / native helpers — **one SSOT mapping** documented in implementation (mirror in Kotlin + Swift + optional TS preview).

## Layout

### Small

```
┌─────────────────┐
│  [Ember]        │
│  6h 12m         │  ← bold leftover
│  Day still open │  ← mood line (1 line, truncate)
└─────────────────┘
```

- Full-bleed mood gradient background
- Ember ~40–45% of height, top or center-left
- No streak dots (too dense)

### Medium (primary target)

```
┌──────────────────────────────────────┐
│  [ large Ember ]   6h 12m left       │
│                    This day will…    │
│                    ●●●●○○○  4-day    │
└──────────────────────────────────────┘
```

- Left ~42%: Ember (larger than Phase 1 ring-center)
- Right: leftover time (hero), mood line, streak row
- Optional micro label “TODAY” above time (caption, low contrast)
- Progress: optional thin bar under time **or** rely on Ember mood only (prefer **no second competing ring** in medium — Ember is the character hero)

### Phase 1 ring relationship

Phase 1 put Ember **inside** a day ring. V1 appeal medium **demotes the ring** (optional thin arc behind Ember or omit) so Ember + copy read like Duo. Small may keep a subtle arc if it aids glanceability without fighting Ember.

## Streak row

- Source: presence streak / last-7-day noticed flags (existing `presenceStreak` domain).
- UI: 7 dots (Mon–Sun or rolling last 7 — pick **rolling last 7 ending today** for simplicity).
- Filled = presence recorded that day; today can pulse statically (brighter fill, not animation).
- If no streak data / count 0: show 7 empty dots + “Start watching” microcopy, or hide row and keep mood line only (prefer **always show 7 dots** for layout stability).

## Copy SSOT

| Key | String |
|-----|--------|
| calmLine | Day still open |
| midLine | Make the hours count |
| urgentLine | This day will never repeat. |
| leftoverSuffix | left |
| emptyStreakHint | Start watching |

No Duo-style death/abandonment threats.

## Color tokens (widget Day appeal)

Document concrete hex in implementation; intent:

- Calm: warm cream / soft amber (`#F4E4D0` → `#E8A85C` class)
- Mid: brand orange depth (`#E87C20` family)
- Urgent: ember red (`#C44A2F` → `#8B1E1E` class)
- Text: high-contrast white / near-white on dark gradients; dark ink only if calm gradient is light enough for WCAG-ish glance contrast
- Streak filled: white or percent orange; empty: white @ ~25%

## Data / sync

1. Ensure `WidgetCache` (or adjacent native prefs) exposes:
   - `dayProgress` (already)
   - leftover time string or hours/minutes (already / compute native)
   - presence streak count + last-7 bitmask or 7 bools (**add if missing**)
2. `syncWidgetCache()` / worker refresh updates Day providers after presence record and time tick.
3. Preview in `WidgetPreview` / customization screen reflects mood + layout for Day type.

## Architecture sketch

1. **Shared mood helper** (concept): `dayProgress → Calm|Mid|Urgent` + colors + line key — mirrored in:
   - `src/` (preview / tests)
   - Android `UNTILWidgetWorker` / Day provider bitmap drawer
   - iOS `UNTILWidgets.swift` Ember + background
2. **Android:** new/updated `widget_day.xml` (and medium layout if size-qualified); gradient background drawable(s) or full-card bitmap; Ember bitmap; streak `ImageView` or 7 small views.
3. **iOS:** size families small/medium; `LinearGradient` + Ember glyph + `HStack` streak.
4. **Tests:** pure TS mood mapping unit tests; optional snapshot notes for manual QA.

## Rollout

1. Spec approved  
2. Implementation plan (writing-plans)  
3. Ship Day small+medium Android + iOS  
4. Later: Month/Life appeal pass using same mood language  

## Open questions (resolved for v1)

| Question | Decision |
|----------|----------|
| First widget | Day |
| Urgent copy | “This day will never repeat.” |
| Character | Ember (not new mascot) |
| Opacity | Solid mood gradients |

## Spec self-review

- [x] No TBD placeholders for core decisions  
- [x] Consistent with Phase 1 Ember constraints (static, dual platform)  
- [x] Scope limited to Day; no pricing/trial changes  
- [x] Success criteria are testable on device (visual + copy + streak)
