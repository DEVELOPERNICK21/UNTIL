# Wear OS Time Hub (Android watch)

Parity with [Apple Watch Day %](./APPLE_WATCH.md) for **tiles/complications** (Day only). The Wear **app** is a **Time Hub**: swipeable Day, Month, Year, and Life pages synced from the phone where needed.

Design: [`docs/superpowers/specs/2026-07-20-wear-time-hub-design.md`](./superpowers/specs/2026-07-20-wear-time-hub-design.md). Day tile/complication MVP: [`2026-07-14-apple-watch-day-design.md`](./superpowers/specs/2026-07-14-apple-watch-day-design.md).

---

## Architecture

```
Phone UNTIL (app.until.time)
  → UNTILWidgetWorker.updateWidgets
  → WearDaySync.push (Data Layer path /until/day)
        JSON: day fields + optional birthDate, deathAge (MMKV user.birthDate / user.deathAge)
        ↓
Wear OS app (same applicationId, :wear module)
  → DayDataListenerService
  → DayWearStore (SharedPreferences) — tile/complication Day cache
  → ProfileStore (SharedPreferences) — birthDate, deathAge for Life page
       ├─ Day Tile (UNTIL Day) — Day % only; tap opens Time Hub
       ├─ Day Complication (SHORT_TEXT / RANGED_VALUE) — Day % only
       └─ TimeHubActivity (launcher) — ViewPager2: Day / Month / Year / Life
            ├─ Day, Month, Year ← TimeClock (watch clock, offline)
            └─ Life ← LifeClock (ProfileStore) or empty until profile synced
```

**Tile and complication stay Day-only.** They open `TimeHubActivity` on the Day page when tapped.

---

## Time Hub (app UI)

| Page | Label | Data source | Empty state |
|------|-------|-------------|-------------|
| Day | `TODAY` | Watch clock (`TimeClock.day`) | — |
| Month | `THIS MONTH` | Watch clock (`TimeClock.month`) | — |
| Year | `THIS YEAR` | Watch clock (`TimeClock.year`) | — |
| Life | `LIFE` | Phone profile (`birthDate`, `deathAge`) | `Open UNTIL on phone` |

- Horizontal swipe between four pages; page dots under content (default: Day).
- Day / Month / Year work without phone pairing.
- Life needs a one-way profile sync from the phone (birth date set in UNTIL).

---

## Profile sync

Phone pushes optional profile fields on the existing `/until/day` path (and on `/until/day/request` replies):

| Field | Type | Phone source | Wear store |
|-------|------|--------------|------------|
| `birthDate` | ISO string `YYYY-MM-DD` | MMKV `user.birthDate` | `ProfileStore` |
| `deathAge` | int (default **80**) | MMKV `user.deathAge` | `ProfileStore` |

`DayDataListenerService` parses the payload, updates `ProfileStore`, and broadcasts `TimeHubActivity.ACTION_REFRESH` (`app.until.time.watch.DAY_REFRESH`) to refresh the hub UI.

---

## What’s in the repo

| Path | Role |
|------|------|
| `android/app/.../WearDaySync.kt` | Phone pushes Day fields + optional profile after widget updates |
| `android/wear/` | Wear OS companion module |
| `TimeHubActivity` | Launcher; ViewPager2 hub (Day / Month / Year / Life) |
| `TimePeriodPageView` | Shared page chrome (% , bar, passed/left, footer) |
| `TimeClock` / `LifeClock` | Watch-local time math |
| `ProfileStore` | Persist synced `birthDate` / `deathAge` |
| `DayTileService` | Watch tile (Day % only) |
| `DayComplicationService` | Watch-face complication (Day % only) |
| `DayDataListenerService` | Receives Data Layer updates |
| `DayWearStore` / `DayClock` | Tile/complication Day cache |

Phone `app/build.gradle` includes Play Services Wearable. Install phone and wear APKs separately (the old `wearApp` embedding is deprecated in AGP 9).

```gradle
implementation("com.google.android.gms:play-services-wearable:19.0.0")
```

---

## Build & run

```bash
cd android
./gradlew :wear:assembleDebug
./gradlew :app:assembleDebug
```

1. Install the **phone** debug APK (`yarn android` / `:app:installDebug`) on the **phone** only.
2. Install the **wear** APK on the **watch** only:

```bash
cd android
./gradlew :wear:installDebug
# or explicitly:
# adb -s <wear-serial> install -r wear/build/outputs/apk/debug/wear-debug.apk
```

**Important:** Phone and Wear share Play package `app.until.time`. Do **not** install the phone React Native APK on the watch — that replaces the Wear build and shows a white screen (`MainActivity`). Always install `:wear` on the watch and `:app` on the phone only.

If the watch has the wrong (phone) build:

```bash
# On the WATCH — remove, then reinstall Wear
adb -s <wear-serial> uninstall app.until.time
cd android && ./gradlew :wear:installDebug
```

If a leftover separate Wear package from older builds exists on phone/watch:

```bash
adb uninstall app.until.time.watch
```

3. Pair Wear OS with the phone (same Google account / Bluetooth pairing).
4. Open UNTIL on the phone so widgets sync (triggers `WearDaySync`). Opening the watch **UNTIL** app also requests a sync from the phone.
5. On the watch: add **UNTIL Day** tile and/or complication; open **UNTIL** for the Time Hub (swipe for Month / Year / Life).

### Why the watch shows “—” / does nothing

| Cause | Fix |
|-------|-----|
| Phone APK on watch | `adb uninstall app.until.time` on watch, then `:wear:installDebug` |
| Not paired | Android Studio Wear Pairing Assistant, or `adb -s <phone> forward tcp:5601 tcp:5601` then pair in Wear OS app |
| No Day push yet | Open phone UNTIL (foreground syncs widgets → Wear). Watch app also pings `/until/day/request` |
| Looking at white screen | Phone APK on watch — reinstall `:wear` only |
| Life page empty | Set birth date on phone UNTIL and sync; Day/Month/Year still work offline |

Check logs:

```bash
adb -s <phone-serial> logcat -s WearDaySync WearSyncRequest
adb -s <wear-serial> logcat | grep -i until
```

`WearDaySync: No connected Wear nodes` means pairing is missing.

### Wear emulator tips

- Android Studio → Device Manager → Wear OS image (API 30+).
- Emulators: identify with `adb devices -l` (`watch` in characteristics).
- `adb -s <phone> forward tcp:5601 tcp:5601` then pair emulator (classic pairing flow), or use Android Studio’s Wear Pairing Assistant.
- Your machines: phone `emulator-5554`, wear `emulator-5556` (serials vary).

```bash
# Fresh wear install onto wear emulator only
cd android
./gradlew :wear:installDebug
adb -s emulator-5556 shell am start -n app.until.time/app.until.time.watch.TimeHubActivity
```

---

## Empty state

Day / Month / Year % is computed **on the watch clock** — the hub, tile, and complication work without phone pairing.

**Life** needs `birthDate` (and optionally `deathAge`) synced from the phone. Until then, the Life page shows `Open UNTIL on phone`.

Phone Day-field sync is optional for the tile/complication cache. If you still see “Open UNTIL on phone to sync” on **Day**, you’re on an old build — reinstall wear:

```bash
cd android && ./gradlew :wear:assembleDebug
adb -s <wear-serial> install -r wear/build/outputs/apk/debug/wear-debug.apk
adb -s <wear-serial> shell am start -n app.until.time/app.until.time.watch.TimeHubActivity
```

---

## Out of scope

- Month / Year / Life **tiles or complications** (Day only)
- Standalone Wear without phone (profile still phone-sourced for Life)
- Two-way profile edit on watch
- Premium gating on Wear (all four hub pages are free)

---

## Play Store (same listing as phone)

Phone and Wear use **`applicationId "app.until.time"`**. Wear declares `android.hardware.type.watch` so Play serves it to watches only.

1. Play Console → UNTIL (`app.until.time`) → **Advanced settings** / **Form factors** → add **Wear OS** (if not already).
2. Build both release bundles (same upload keystore):

```bash
cd android
./gradlew :app:bundleRelease
./gradlew :wear:bundleRelease
```

3. Upload **both** AABs into the same release (or Wear OS track on that app):
   - Phone: `android/app/build/outputs/bundle/release/app-release.aab`
   - Wear: `android/wear/build/outputs/bundle/release/wear-release.aab`
4. Use **different `versionCode`s** in one release (e.g. phone `16`, wear `17`).

Do not use the deprecated `wearApp` Gradle embedding.
