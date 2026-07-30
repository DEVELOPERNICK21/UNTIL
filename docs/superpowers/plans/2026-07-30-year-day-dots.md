# Year Day Dots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-07-30-year-day-dots-design.md`

**Goal:** On This year, replace the circular progress with a day-dot grid (one dot per day), reusing a generalized shared dots component; keep days passed / days left and summary.

**Architecture:** Extract `PeriodDotsGrid` from `LifeWeeksGrid`. Point Life/onboarding at it. Wire `YearDetailScreen` `hero` with day label + grid. Optional thin pure helper for clamp.

**Tech Stack:** React Native, existing `PeriodDetailScreen.hero`, Jest if helper extracted

## Global Constraints

- Surfaces: hooks / `ui` / theme only
- Day / Month keep ring
- Life weeks behavior unchanged (only component rename/generalize)
- Existing fixed `DotsGrid` untouched
- Human-copy: no em dashes, no coach filler
- Label: concise `X / Y days`
- Remaining dots: `theme.progressTrack`
- Memoize shared grid

## File map

| File | Responsibility |
|------|----------------|
| `src/ui/PeriodDotsGrid.tsx` | Generic filled/total dots |
| `src/ui/LifeWeeksGrid.tsx` | Thin wrapper mapping week props → PeriodDotsGrid OR delete + update call sites |
| `src/ui/index.ts` | Export PeriodDotsGrid (+ keep LifeWeeksGrid if wrapper) |
| `src/surfaces/app/YearDetailScreen.tsx` | Hero with label + PeriodDotsGrid |
| `src/surfaces/app/LifeScreen.tsx` | Use PeriodDotsGrid (or keep wrapper) |
| `src/surfaces/auth/LifeWeeksPreviewScreen.tsx` | Same |

---

### Task 1: Extract `PeriodDotsGrid`

**Files:**
- Create: `src/ui/PeriodDotsGrid.tsx`
- Modify: `src/ui/LifeWeeksGrid.tsx` (wrapper) OR update call sites
- Modify: `src/ui/index.ts`

**Interfaces:**
- Produces: `PeriodDotsGrid({ filledCount, totalCount, fillColor?, accessibilityLabel? })`
- `LifeWeeksGrid({ livedWeeks, renderWeeks, fillColor? })` → maps to `filledCount=livedWeeks`, `totalCount=renderWeeks`, default a11y `X of Y weeks lived`

- [ ] **Step 1:** Create `PeriodDotsGrid` (memo, progressTrack remaining, accessible image role)
- [ ] **Step 2:** Make `LifeWeeksGrid` a thin wrapper OR migrate Life + onboarding call sites
- [ ] **Step 3:** Export from `ui/index.ts`
- [ ] **Step 4:** Commit `refactor(ui): extract PeriodDotsGrid from LifeWeeksGrid`

---

### Task 2: Wire YearDetailScreen hero

**Files:**
- Modify: `src/surfaces/app/YearDetailScreen.tsx`

**Interfaces:**
- Consumes: `PeriodDotsGrid`, `useTheme`, `getProgressColor` (or theme.percent), existing `PeriodDetailScreen.hero`
- Clamp: `passedDays = Math.max(0, Math.min(daysInYear, daysInYear - remainingDaysYear))`

- [ ] **Step 1:** Import View, PeriodDotsGrid, useTheme, getProgressColor
- [ ] **Step 2:** Pass `hero` with centered `X / Y days` label + `PeriodDotsGrid` filled=passedDays, total=daysInYear
- [ ] **Step 3:** Keep stats, summary, footer unchanged
- [ ] **Step 4:** Commit `feat(year): show day dots on This year screen`

---

### Task 3: Smoke verify

- [ ] Year: dots present, no ring, leap/non-leap count correct
- [ ] Day/Month: still ring
- [ ] Life/onboarding: still week dots
- [ ] Commit plan/spec if not already: docs commits only if needed
