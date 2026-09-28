# Apple Watch Time Hub · Progress Ring Reskin

**Date:** 2026-09-21  
**Status:** Approved (pending user review of this file)  
**Platform:** watchOS (`ios/UNTILWatch Watch App`, optionally shared helpers)  
**Builds on:** [`2026-07-29-apple-watch-time-hub-design.md`](./2026-07-29-apple-watch-time-hub-design.md)  
**Inspiration:** Premium watch UI refs (circular gauges, glowing progress tip); phone period detail ring + `getProgressColor`

## Goal

Reskin each Time Hub page so period progress reads as a **thick circular ring with a colorful fill and glowing tip**, instead of a thin linear red/green capsule. Same data, same four swipe pages.

## Decisions

| Decision | Choice |
|----------|--------|
| Scope | Hub-only reskin (approach 1). Complication color/ring parity is a follow-up |
| Geometry | Full ring around `%` (not bottom-arc-only) |
| Color | Phone-matched progress continuum: green → amber → red |
| Motion | No pulse / fill animation this pass |
| Pages / data | Unchanged: Day, Month, Year, Life + existing clocks / WC sync |

## Layout

Each page (`TimePeriodPageView`):

1. **Title** — small grey caps (`TODAY` / `THIS MONTH` / `THIS YEAR` / `LIFE`), above the ring  
2. **Ring** — hero; fills most of the face  
3. **`%`** — large bold near-white, **centered inside** the ring  
4. **Remaining** — `remainingLabel` under the ring (e.g. `13h 42m left`)

- Remove the horizontal capsule bar  
- Life empty state unchanged: `Open UNTIL on phone`  
- `TabView` + `.page` dots unchanged  

## Color & glow

**Progress fill** — mirror phone `src/theme/progressColor.ts` / Live Activity `liveActivityProgressColor`:

| Progress | Hex |
|----------|-----|
| 0 | `#22C55E` |
| 0.5 | `#F59E0B` |
| 1 | `#EF4444` |

Lerp RGB between stops (same piecewise rule as the phone).

**Ring chrome**

| Element | Spec |
|---------|------|
| Track | Muted dark grey `~#2A2A2E`, stroke ~10–12pt |
| Fill | Progress color, round line caps, starts at 12 o’clock |
| Tip | Small filled circle at fill end + soft outer glow (same color, low opacity) |
| Background | Keep `#0E0E10` |
| Title / remaining | Existing label / text tokens (`#9A9A9A` / `#EDEDED`) |

`%` stays near-white for contrast; fill color carries the “where you are” signal on the ring.

## Implementation

| Piece | Role |
|-------|------|
| `WatchProgressColor` (new) | Pure helper: `progress` → `Color` / hex; port of `getProgressColor` |
| `WatchProgressRing` (new SwiftUI view) | Track + trimmed fill + tip + glow; takes `progress: Double` |
| `TimePeriodPageView` | Compose title → ring-with-`%` → remaining; drop capsule |
| `DayWatchDesign` | Keep `background` / `label` / `text`; add `track`; retire unused `passed` / `left` / fixed `percent` for the hub (or leave for complication until follow-up) |

**Placement:** Prefer Watch App sources for this pass. If both `UNTILWatch` and `UNTILWatch Watch App` duplicates exist, update the target that actually builds (same pattern as current hub files). Shared module only if needed for a later complication sync.

**Unchanged:** `TimeHubView`, `WatchTimeClock`, `WatchLifeClock`, WatchConnectivity, App Group caches, phone / Wear OS, circular complication UI.

## Accessibility

- Dynamic Type: keep scaled `%` and remaining text  
- Ring is decorative: `accessibilityHidden(true)`  
- VoiceOver still gets title + percent + remaining (existing text nodes)  
- At accessibility sizes, prefer readable type over perfect ring proportions (allow scale-down / scroll as today)

## Out of scope

- Complication / widget ring or color update  
- Pulse / second-tick animation  
- New pages, charts, or metrics  
- Phone or Wear OS UI changes  

## Verification

1. Simulator: swipe Day / Month / Year / Life  
2. Spot-check progress near 0%, 50%, 90% (color + tip position)  
3. Life with no profile: empty copy still clear  
4. Large Dynamic Type: `%` and remaining remain readable; no hard crash / unusable clip  

## Follow-up (not this plan)

- Apply same progress color (and optionally ring chrome) to the circular Day complication  
- Optional soft tip pulse behind Reduce Motion  
