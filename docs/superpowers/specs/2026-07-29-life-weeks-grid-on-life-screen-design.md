# Life Weeks Grid on Your Life Screen — Design Spec

**Date:** 2026-07-29  
**Status:** Approved  
**Surface:** App `LifeScreen` (`Your life`) + onboarding `LifeWeeksPreviewScreen`  
**Approach:** Shared `LifeWeeksGrid` UI; replace circular progress on Life with week dots; keep day stats below

## Decisions

| Decision | Choice |
|----------|--------|
| Primary visual on Life | Week-of-life dots (same as onboarding preview) |
| Circular progress on Life | Removed (replaced by dots) |
| Days lived / days left + summary | Kept below the dots |
| Weeks label above grid | Yes: `You have lived X / Y weeks` (match onboarding meaning) |
| Shared component | Extract `LifeWeeksGrid`; reuse on onboarding + Life |
| Existing `DotsGrid` (10×10) | Untouched; different use case |
| Day / Month / Year detail | Unchanged |
| Locked / no birth date Life | Unchanged |

## Product

### User-facing behavior

1. User completes birth date in onboarding → sees week dots on `LifeWeeksPreviewScreen`.
2. Later, from Home → **Your life** (when birth date set and Life access allowed) → sees the **same** week-dots visual instead of the ring.
3. Below the dots: existing flip cards for **days lived** / **days left**, then summary + progress line.
4. Without birth date or without Life access: existing locked / CTA UI only (no dots).

### Copy

- Weeks headline near the grid (Life): same idea as onboarding — lived weeks called out, total weeks shown.
- Keep existing Life captions for day stats (`Days lived`, `Days left`) and death-age summary.
- Follow human-copy rules (no em dashes, no coach filler).

## Architecture

```
LifeScreen
  → useObserveTimeState (birthDate, deathAge, remainingDaysLife, life progress)
  → computeLifeWeeks(deathAge, remainingDaysLife)   // shared pure helper
  → PeriodDetailScreen
       hero = weeks label + LifeWeeksGrid
       passed/left day stats + summary unchanged

LifeWeeksPreviewScreen
  → same helper + LifeWeeksGrid
```

### Components

| Piece | Role |
|-------|------|
| `computeLifeWeeks` (core/pure) | `totalWeeks`, `livedWeeks` from `deathAge` + `remainingDaysLife`; cap render count at 5200 |
| `LifeWeeksGrid` (`ui/`) | Renders lived vs remaining week dots; themed fill; same size/spacing as onboarding |
| `PeriodDetailScreen` | Optional `hero?: React.ReactNode`; when set, replaces `CircularProgress` block |
| `LifeScreen` | Passes hero with weeks label + grid; keeps day labels/summary props |
| `LifeWeeksPreviewScreen` | Switches to `LifeWeeksGrid` + helper; drops inline duplicate styles |

### Data flow

1. `remainingDaysLife` and `deathAge` already come from `TimeRepository` / `useObserveTimeState`.
2. Helper: `totalWeeks = round(deathAge * (365.25/7))`; `livedWeeks = clamp(total - round(remainingDaysLife/7), 0, total)`.
3. Grid: one dot per week up to `min(totalWeeks, 5200)`; index `< livedWeeks` → filled (theme percent / accent); else muted remaining.

### Layer rules

- Surfaces import `ui` + hooks only.
- Pure week math lives in `core/` (no React).
- No new repository or use case required unless we later want weeks on widgets.

## UI details

### Life unlocked layout (top → bottom)

1. Existing header (glyph + “Your life” + tagline/chip as today)
2. **Hero:** weeks label + `LifeWeeksGrid` (replaces ring + tap cue)
3. Stats row: days lived / days left (flip behavior unchanged)
4. Summary card + `ProgressLine` + feel line
5. Optional footer unchanged

### Grid visual parity

- Dot size ~6, wrap row layout, lived color = `theme.percent` (or current progress accent), remaining = muted gray matching onboarding.
- Scrollable with the rest of `PeriodDetailScreen` content.

## Out of scope

- Home list `TimeBlock` for Life (still days + progress bar)
- Widgets / overlay life visuals
- Animating thousands of dots on first paint
- Changing premium / unlock gating

## Testing

- Helper: known deathAge + remainingDaysLife → expected total/lived weeks; clamp and 5200 cap.
- Life unlocked: no `CircularProgress`; grid present; day stats still show.
- Life locked / no birth date: no grid.
- Day / Month / Year detail: still show circular progress.
- Onboarding preview: still shows same grid after extract.

## Success criteria

- Navigating Home → Your life shows the same week-dots visualization language as post-DOB onboarding.
- Day stats and summary remain available under the grid.
- One shared component drives onboarding + Life; no duplicated grid markup.
