# Year Day Dots on This Year Screen — Design Spec

**Date:** 2026-07-30  
**Status:** Approved  
**Surface:** App `YearDetailScreen` (`This year`)  
**Approach:** Generalize life week dots into shared `PeriodDotsGrid`; replace year ring with one-dot-per-day grid; keep day stats below

## Decisions

| Decision | Choice |
|----------|--------|
| Screen | This year only (`YearDetailScreen`) |
| Dot meaning | One dot per day of the calendar year (365 or 366) |
| Circular progress on Year | Removed (replaced by day dots) |
| Days passed / days left + summary | Kept below the dots |
| Label above grid | `X / Y days` (passed / days in year) |
| Shared component | Generalize `LifeWeeksGrid` → `PeriodDotsGrid` |
| Life / onboarding week dots | Keep behavior; switch to `PeriodDotsGrid` |
| Day / Month detail | Unchanged (keep ring) |
| Existing fixed `DotsGrid` (10×10) | Untouched |

## Product

### User-facing behavior

1. Home → **This year** → day-dots grid instead of the ring.
2. Filled dots = days passed; muted = days left.
3. Below: existing flip cards for days passed / days left, then summary + progress line + Year widget footer hint.
4. Leap years show 366 dots.

### Copy

- Label near the grid: plain `X / Y days` (or “You have lived X / Y days” only if it stays short and non-coachy). Prefer concise `X / Y days` to match period language.
- Existing captions (`Days passed`, `Days left`) and summary unchanged.
- Human-copy rules apply (no em dashes, no coach filler).

## Architecture

```
YearDetailScreen
  → useObserveTimeState (year progress, remainingDaysYear)
  → daysInYear (365/366) + passedDays
  → PeriodDetailScreen
       hero = day label + PeriodDotsGrid(filled=passed, total=daysInYear)
       day stats + summary + footer unchanged

LifeScreen / LifeWeeksPreviewScreen
  → PeriodDotsGrid (same component; weeks counts from useLifeWeeks)
```

### Components

| Piece | Role |
|-------|------|
| `PeriodDotsGrid` (`ui/`) | Generic filled/total flex-wrap dots; memoized; `theme.progressTrack` remaining; accessible |
| `LifeWeeksGrid` | Thin wrapper or removed; call sites use `PeriodDotsGrid` |
| Optional `computeYearDays` | Pure `{ daysInYear, passedDays }` if it clarifies Year screen; otherwise inline from existing timeState is fine |
| `YearDetailScreen` | Passes `hero` with label + grid |
| `PeriodDetailScreen` | Already supports `hero` (no API change required) |

### Data flow

1. `remainingDaysYear` and year progress already from `useObserveTimeState`.
2. `daysInYear` from current calendar year leap rule (existing Year screen helper).
3. `passedDays = daysInYear - remainingDaysYear` (clamped to `[0, daysInYear]`).
4. Grid: `filledCount = passedDays`, `totalCount = daysInYear`. No render cap (max 366).

### Layer rules

- Surfaces: hooks / `ui` / theme only.
- Pure helpers in `core/time` if extracted.
- No new repository or use case.

## UI details

### Year unlocked layout (top → bottom)

1. Existing header (glyph + “This year” + tagline/chip)
2. **Hero:** day count label + `PeriodDotsGrid`
3. Stats row: days passed / days left
4. Summary card + `ProgressLine` + feel line
5. Existing Year widget footer hint

### Visual parity with Life dots

- Same dot size/spacing/wrap as life weeks grid.
- Fill: progress accent (`getProgressColor(yearProgress)` or `theme.percent`).
- Remaining: `theme.progressTrack`.

## Out of scope

- Month detail dots
- Home year `TimeBlock` list card
- Year widget native UI
- Life year-of-life dots (one per year of lifespan)

## Testing

- If `computeYearDays` exists: leap vs non-leap, clamp passed days.
- Year detail: no ring when hero present; grid count matches days in year.
- Day / Month: still ring.
- Life / onboarding: still week dots after rename/generalize.

## Success criteria

- This year shows a day-dot grid matching the life weeks visual language.
- Day stats and summary remain under the grid.
- One shared dots component drives Life weeks and Year days.
