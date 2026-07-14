# Ember on home widgets + Day UX pass (Phase 1)

**Date:** 2026-07-14  
**Status:** Approved for implementation planning  
**Choice:** Placement **D — Combo** + Phase 1 UX (hero hierarchy, unify Day, color/glass SSOT, empty-state Ember)

## Goal

Bring Ember’s calm companion identity onto home-screen widgets without fighting widget platform limits, and tighten Day widget readability across iOS and Android.

## Non-goals (Phase 1)

- Animated Ember (float, blink loops, particles, orbiting hands) on widgets
- Ember on Year / Life dense grids, Counter, Hour calc (tap clarity / noise)
- Full Year/Life redesign, Tasks flip alignment, preview parity, Watch density changes (Phase 2)

## Constraints

| Platform | Reality |
|----------|---------|
| Android App Widgets | RemoteViews: static images / TextViews; Ember = pre-rendered mood bitmaps or Canvas bitmaps in `UNTILWidgetWorker` |
| iOS WidgetKit | SwiftUI shapes OK; no continuous Ember animation; mood from `dayProgress` |
| Both | Fake glass only (no live blur). Refresh-driven mood updates only |

## Design — Ember (Combo)

### Mood mapping

Reuse in-app progress bands (`dawn` / `open` / `mid` / `late` / `dusk`) from day progress `0…1`. Widget Ember is a **simplified static face**: soft orb + two eyes + smile silhouette. Colors match in-app Ember mood palette (hi / mid / deep).

### Placement

| Widget | Ember | Layout |
|--------|-------|--------|
| **Day** | **Center of ring** | Ember sits in ring interior; primary time readout remains one support row below (not competing center %) |
| **Daily Tasks** | **Corner mark** (~24–28dp) | Top-trailing; does not cover pie or task list |
| **Empty / sync** | **Centered soft presence** | When cache missing, no tasks, or Life needs birth date: Ember + one short line |
| Year / Life / Counter / Countdown / Hour | **None** in Phase 1 | — |

### Day hierarchy (Phase 1 UX)

**One hero:** circular day ring (passed purple / left track) with Ember center.  
**One support row:** e.g. leftover time + done/left % — same primary language on iOS and Android.

Drop or demote seconds on the default home-screen Day glance (detailed seconds stay out of Phase 1 small/medium home glance unless already required by an existing large layout; prefer unify toward leftover %).

### Color / glass SSOT

Document and apply one token set for widgets:

- Passed / ring: purple `#BB86FC` (or current iOS `Design` equivalent — pick one and use on both)
- Current / accent: orange `#E87C20`
- Done / Left labels: system-like red / green used today on Android Day (`#FF3B30` / `#34C759`)
- Glass: dark fill + light stroke + 16dp-class corner radius (`widget_background` / `WidgetGlassBackground`)

Ember mood fills come from the same palette as `src/ui/Ember.tsx` mood colors.

### Empty-state copy (soft, not guilt)

Examples (final strings in implementation):

- Sync needed: “Open UNTIL — Ember is waiting with today’s light.”
- No tasks: “Nothing listed yet — a quiet day is still a day.”
- Life / birth date: “Set birth date in UNTIL to see life progress.”

## Architecture (implementation sketch)

1. **Shared mood helper (concept)**  
   Pure mapping `progress → band → colors` mirrored in:
   - Kotlin bitmap drawer (Android worker / provider)
   - SwiftUI `EmberGlyph` view (iOS widgets)
   Keep visual parity with `Ember.tsx` palettes; do not import RN into widgets.

2. **Android Day**  
   Draw Ember into the day dots/ring bitmap center (or layered ImageView). Update `widget_day.xml` hierarchy to match “ring hero + one support row.”

3. **Android Tasks**  
   Corner `ImageView` with mood bitmap from day progress (from widget cache / shared prefs).

4. **iOS**  
   `EmberGlyph(progress:)` in `UNTILWidgets.swift`; Day ring ZStack center; Tasks overlay corner; empty views reuse glyph.

5. **Watch**  
   Out of Phase 1 scope except optional later mood tint (Phase 2 item 8).

## Files likely touched

- `android/app/src/main/res/layout/widget_day.xml`, `widget_daily_tasks.xml`
- `android/app/src/main/java/app/until/time/UNTILWidgetWorker.kt` (and/or Day/Tasks providers)
- `ios/UNTILWidgets/UNTILWidgets.swift`
- `docs/WIDGETS.md` (token SSOT update)
- Optional: small shared color constants comments linking to `src/ui/Ember.tsx`

## Success criteria

- [ ] Day widget shows Ember in ring center on iOS + Android; mood changes with day progress after refresh
- [ ] Daily Tasks shows corner Ember without covering primary metrics
- [ ] Empty/sync states show Ember + one line where those states exist today
- [ ] Day glance hierarchy is clearer (one hero + one support); iOS/Android primary readout aligned
- [ ] Widget glass/progress colors documented and matched across Day/Tasks at least
- [ ] No new continuous animation / battery-heavy timeline hacks

## Phase 2 (explicit backlog)

1. Simplify Year / Life density  
2. Align Daily Tasks flip vs stacked cross-platform  
3. Upgrade Counter / Countdown / Hour brand accents  
4. Match RN `WidgetPreview` to native  
5. Watch mood tint only  

## Risks

- Bitmap size / quality on small Android Day  
- Layout regression if Day already packed with hours rows — must cut copy, not shrink Ember into illegibility  
- iOS accessory sizes may omit Ember (too small) — allow hide on accessory families
