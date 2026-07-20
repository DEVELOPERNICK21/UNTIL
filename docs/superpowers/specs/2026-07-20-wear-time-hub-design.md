# Wear OS Time Hub — Design Spec

**Date:** 2026-07-20  
**Status:** Implemented  
**Platform:** Wear OS (`android/wear`)  
**Supersedes (scope):** Day-only watch app UI in [`docs/WEAR_OS.md`](../../WEAR_OS.md) / Day MVP in [`2026-07-14-apple-watch-day-design.md`](./2026-07-14-apple-watch-day-design.md) for **Wear app screens only** (tiles/complications stay Day-only).

## Decisions

| Decision | Choice |
|----------|--------|
| Goal | Time hub: Day, Month, Year, Life on the wrist |
| Navigation | Horizontal swipe pager + page dots |
| Tile / complication | Day only (unchanged) |
| Day / Month / Year data | Computed on watch clock (offline) |
| Life data | Needs `birthDate` + `deathAge` synced from phone |
| Gating | All four free on watch (no Premium check) |
| UI stack | Keep View-based Kotlin (no Compose rewrite this round) |
| Approach | Watch-local math + phone profile sync for Life |

## Product

| Page | Label | Primary content | Empty / missing data |
|------|-------|-----------------|----------------------|
| Day | `TODAY` | % done, progress bar, passed / left, whisper | N/A (always computable) |
| Month | `THIS MONTH` | Same chrome as Day | N/A |
| Year | `THIS YEAR` | Same chrome as Day | N/A |
| Life | `LIFE` | Same chrome as Day | `Open UNTIL on phone` until profile synced |

- Default page on launch: **Day**
- Dots under content indicate page index (4)
- Swipe left/right between pages
- Tile + complication remain **UNTIL Day** only

## Architecture

```
Phone UNTIL (app.until.time)
  → UNTILWidgetWorker / profile write
  → WearDaySync.push (extend JSON: birthDate, deathAge)
        ↓  MessageClient + Data Layer path /until/day
Wear OS (:wear, applicationId app.until.time)
  → DayDataListenerService
  → ProfileStore (SharedPreferences: birthDate, deathAge)
  → TimeHubActivity (ViewPager2)
       ├─ Day page   ← TimeClock.day()
       ├─ Month page ← TimeClock.month()
       ├─ Year page  ← TimeClock.year()
       ├─ Life page  ← LifeClock (ProfileStore) or empty
       ├─ DayTileService (unchanged)
       └─ DayComplicationService (unchanged)
```

### Components (Wear)

| Path / type | Role |
|-------------|------|
| `TimeHubActivity` | Replaces launcher `DayActivity` as main UI; hosts ViewPager2 |
| `TimePeriodPageView` (or equivalent) | Shared page chrome: label, %, bar, passed/left, footer |
| `TimeClock` | Pure Kotlin: day / month / year snapshots from watch `Calendar` |
| `LifeClock` | Life snapshot from birth + death age + now |
| `ProfileStore` | Persist `birthDate` (ISO string), `deathAge` (int) |
| `DayWearStore` / `DayClock` | Keep for tile/complication Day %; may share math with `TimeClock.day` |
| `DayDataListenerService` | Parse extended payload; update profile + day cache; refresh UI |

### Phone

| Path | Role |
|------|------|
| `WearDaySync.kt` | Add `birthDate`, `deathAge` to existing push JSON / DataMap |
| Call sites (`UNTILWidgetWorker`, sync request handler) | Pass profile when pushing; on `/until/day/request` include profile |

Do **not** push month/year/life percents as SSOT for the pager — watch computes those (except Life needs profile inputs).

## Math (parity with phone core)

Match `src/core/time` semantics so watch numbers feel consistent with the phone app:

| Period | Rule |
|--------|------|
| **Day** | Elapsed ms / (endOfDay − startOfDay); keep current Wear second-level left/passed strings |
| **Month** | `(dayOfMonth - 1) / daysInMonth` (same as `getMonthProgress`); left = remaining calendar days (and optional time-into-day refinement only if needed for UX — default stay day-granularity like phone) |
| **Year** | `dayOfYear / daysInYear` (same as `getYearProgress`) |
| **Life** | Same as `getLifeProgress(birthDate, deathAge)` — elapsed / (death − birth); default death age **80** if missing but birth present |

Colors / tokens stay as Day today: orange `%` `#E87C20`, bar red/green `#AA2222` / `#22AA22`, dark bg `#0E0E10`.

## Sync rules

- **Path:** keep `/until/day` (and `/until/day/request` for watch → phone ping)
- **New fields (optional in payload):** `birthDate` (string ISO `YYYY-MM-DD`), `deathAge` (int)
- **When phone pushes:** existing widget/day sync path; include profile whenever available from MMKV / TimeRepository
- **When watch requests:** phone replies with day fields **and** profile fields
- **Unpaired / no profile:** Day/Month/Year still work; Life shows empty state
- **v1:** no watch → phone profile writes

## UI details

- One shared page layout reused 4× (label differs; Life footer may say `Synced profile` vs Day whisper)
- Month/Year left line: e.g. `12 days left` (calendar remaining); Day keeps `Xh Ym Zs left`
- Life left line: e.g. years/days remaining in a short form suitable for round screens
- Page dots: 4 indicators; active = accent orange
- Round / chin devices: keep padding similar to current `DayActivity`

## Error handling

| Case | Behavior |
|------|----------|
| No connected phone | Day/Month/Year live; Life empty if never synced |
| Corrupt / missing birthDate | Life empty state |
| Invalid deathAge | Fall back to 80 |
| Phone APK installed on watch | Unchanged ops guidance in `WEAR_OS.md` |

## Out of scope

- Month/Year/Life tiles or complications
- Tasks, deadlines, Ember on Wear
- Premium gating on Wear
- Compose for Wear rewrite
- Apple Watch multi-page parity (separate work)
- Two-way profile edit on watch

## Testing

1. Open Wear app → Day page; swipe through Month, Year, Life  
2. Without profile: Life empty; Day/Month/Year show live %  
3. Open phone UNTIL (with birth date set) → sync → Life populates  
4. Airplane / unpaired: Day/Month/Year still tick; Life keeps last profile if stored  
5. Tile / complication still show Day only and open hub on Day page  
6. Release AAB still `applicationId app.until.time`, signed, Wear form factor

## Success criteria

- Four swipeable time pages on Wear  
- Day/Month/Year work offline from watch clock  
- Life works after one successful phone sync with birth date  
- Tile + complication unchanged (Day)  
- No Premium requirement on watch  

## Docs to update after implementation

- [`docs/WEAR_OS.md`](../../WEAR_OS.md) — Time hub + profile sync  
- Website copy only if marketing should mention Month/Year/Life on Wear (optional follow-up)
