# Wear OS Day % (Android watch)

Parity with [Apple Watch Day %](./APPLE_WATCH.md): circular / glanceable **Day %** on the wrist, synced from the phone.

Design: [`docs/superpowers/specs/2026-07-14-apple-watch-day-design.md`](./superpowers/specs/2026-07-14-apple-watch-day-design.md) (same MVP: Day only, free, phone → watch one-way).

---

## Architecture

```
Phone UNTIL (app.until.time)
  → UNTILWidgetWorker.updateWidgets
  → WearDaySync.push (Data Layer path /until/day)
        ↓
Wear OS app (same applicationId, :wear module)
  → DayDataListenerService
  → DayWearStore (SharedPreferences)
       ├─ Day Tile (UNTIL Day)
       ├─ Day Complication (SHORT_TEXT / RANGED_VALUE)
       └─ DayActivity (detail on tap / launcher)
```

---

## What’s in the repo

| Path | Role |
|------|------|
| `android/app/.../WearDaySync.kt` | Phone pushes Day fields after widget updates |
| `android/wear/` | Wear OS companion module |
| `DayTileService` | Watch tile |
| `DayComplicationService` | Watch-face complication |
| `DayActivity` | Detail screen |
| `DayDataListenerService` | Receives Data Layer updates |

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

**Important:** Do not install the phone React Native APK on the watch. That shows a white screen (`MainActivity`). Wear app id is `app.until.time.watch`.

If you already installed the wrong package:

```bash
# On the WATCH — remove phone package if present
adb -s <wear-serial> uninstall app.until.time

# On the PHONE — remove wear package if present
adb -s <phone-serial> uninstall app.until.time.watch
```

3. Pair Wear OS with the phone (same Google account / Bluetooth pairing).
4. Open UNTIL on the phone so widgets sync (triggers `WearDaySync`). Opening the watch **UNTIL** app also requests a sync from the phone.
5. On the watch: add **UNTIL Day** tile and/or complication; open **UNTIL** for the detail screen.

### Why the watch shows “—” / does nothing

| Cause | Fix |
|-------|-----|
| Phone APK on watch | `adb uninstall app.until.time` on watch, install `:wear` only |
| Not paired | Android Studio Wear Pairing Assistant, or `adb -s <phone> forward tcp:5601 tcp:5601` then pair in Wear OS app |
| No Day push yet | Open phone UNTIL (foreground syncs widgets → Wear). Watch app also pings `/until/day/request` |
| Looking at white screen | That’s the RN phone app — use `app.until.time.watch` |

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
adb -s emulator-5556 shell am start -n app.until.time.watch/.DayActivity
```

---

## Empty state

Day % is computed **on the watch clock** — the activity, tile, and complication work without phone pairing.

Phone sync is optional. If you still see “Open UNTIL on phone to sync”, you’re on an old build — reinstall wear:

```bash
cd android && ./gradlew :wear:assembleDebug
adb -s <wear-serial> install -r wear/build/outputs/apk/debug/wear-debug.apk
adb -s <wear-serial> shell am start -n app.until.time.watch/.DayActivity
```

---

## Out of scope (same as Apple Watch v1)

Countdown / Life, standalone Wear without phone, two-way sync.

---

## Play Store note

Ship phone and Wear as related form-factor artifacts (multi-APK / multi-artifact release) signed with the same keystore. Do not use the deprecated `wearApp` Gradle configuration.
