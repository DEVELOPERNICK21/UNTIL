# Store listing images and copy checks

Google Play: `build.py` (below). App Store: `build_ios.py` and `check_app_store_copy.py` (section at the end).

## Play Store images

`build.py` turns real captures of the app into the Play Store screenshots and feature graphic.

```bash
python3 scripts/store-listing/build.py     # needs Pillow: pip3 install pillow
```

| In | Out |
|----|-----|
| `docs/store-listing/captures/*.png` | `docs/store-listing/screenshots/01.png … 08.png` (1080×1920) |
| | `docs/store-listing/feature-graphic.png` (1024×500, red, the control) |
| | `docs/store-listing/feature-graphic-dark.png` (1024×500, the app's dark look, for the experiment in `docs/PLAY_STORE_ASO.md`) |

Headlines and the line under each are in `SHOTS` at the top of `build.py`. They must match the table in `docs/PLAY_STORE_ASO.md`.

## Taking the captures again

Play wants screenshots that show the real app, so the captures are real, not drawn.

1. A fresh Pixel-sized emulator (1344×2992) so no personal data is on screen. Use `UNTIL_Store`, not your everyday emulator.
2. Make the status bar clean (the script in the next block), then add the demo data by hand in the app.
3. `adb exec-out screencap -p > docs/store-listing/captures/<name>.png`

```bash
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false
adb shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4
adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false
```

Capture names the script looks for: `01-home-widgets`, `02-life`, `03-deadlines`, `04-home`, `05-counters`, `06-tasks`, `07-badges`, `08-premium`.

Tips that saved time: set the emulator's time zone (`adb shell service call alarm 3 s16 America/Sao_Paulo`) so "today" is not nearly over, turn on dark mode (`adb shell cmd uimode night yes`), and open a screen directly with `adb shell am start -a android.intent.action.VIEW -d until://open/Premium -n app.until.time/.MainActivity` (also `Life`, `Countdowns`, `CustomCounters`, `Badges`, `DailyTasks`).

Do not publish a capture that shows a real name, email or birth date.

---

## App Store

### Check the copy

```bash
python3 scripts/store-listing/check_app_store_copy.py
```

Reads `docs/store-listing/app-store/metadata/<locale>/*.txt` and checks Apple's limits, keyword rules, the Terms and Privacy links and unbacked claims. The plan and the text are in `docs/APP_STORE_LISTING.md`.

### Build the screenshots

```bash
python3 scripts/store-listing/build_ios.py     # needs Pillow
```

| In | Out |
|----|-----|
| `docs/store-listing/captures-ios/*.png` (1320×2868) | `screenshots-ios/1206x2622/01.png … 04.png` for the **required** "iPhone with Dynamic Island (medium display)" slot, and `screenshots-ios/1320x2868/` for the optional large slot |

Each App Store Connect slot takes only its own sizes; a wrong-size file fails with "File dimensions are invalid". The slot table is in `docs/APP_STORE_LISTING.md`.

Headlines are in `SHOTS` at the top of `build_ios.py`; keep them the same as the table in `docs/APP_STORE_LISTING.md`.

Why not reuse the Play ones: they show Android's status bar and launcher, and Apple rejects screenshots with other platforms in them (Guideline 2.3.10). These come from the iOS Simulator.

### Apple Watch screenshots

```bash
python3 scripts/store-listing/build_watch.py     # needs Pillow
```

Reads `docs/store-listing/captures-watch/*.png` (raw captures, 416×496) and writes `screenshots-watch/416x496/NN.png` as RGB (no alpha) for the "Apple Watch Series 12" slot, which also covers Series 11 and 10.

To retake them: create and pair a 46mm watch simulator, install the watch app on it, open it, and capture each page.

```bash
xcrun simctl create UNTIL_Store_Watch com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-11-46mm com.apple.CoreSimulator.SimRuntime.watchOS-26-5
xcrun simctl pair <watch-udid> <iphone-udid>
xcrun simctl boot <watch-udid>
xcrun simctl install <watch-udid> "<DerivedData>/Build/Products/Debug-iphonesimulator/<App>.app/Watch/UNTILWatch Watch App.app"
xcrun simctl launch <watch-udid> com.developernick.until.watchapp
xcrun simctl io <watch-udid> screenshot docs/store-listing/captures-watch/01-today.png
```

Swipe left for each next page (the tool that drives the iPhone simulator also drives the watch one). Installing the iPhone app on a paired simulator did not put the watch app on the watch, so it is installed directly. A 42mm or Ultra simulator gives a different size and App Store Connect will refuse it for this slot.

### Build the header and search results assets

```bash
python3 scripts/store-listing/build_header_ios.py --guides     # needs Pillow
```

Writes `docs/store-listing/header-search/` (`universal.png` 5244×2950, `universal-notext.png`, `header.png` 3840×1646, `search.png` 3840×2560; RGB PNG, no alpha) from the Home Screen widget capture `captures-ios/02-home-widgets.png`. `--guides` also writes copies with Apple's art safe area drawn on, into `docs/store-listing/previews/`. Specs, rules and upload steps are in `docs/APP_STORE_LISTING.md`.

### Preview the listing (search result and product page header)

```bash
python3 scripts/store-listing/preview_ios.py --before <folder with the live icon.jpg, shot1.jpg … shot3.jpg>
```

Writes `docs/store-listing/previews/search-result.png` and `product-header.png`, the live listing next to the new one. A mock-up: Inter stands in for Apple's font.

### Taking the iOS captures again

1. A clean simulator so no personal data is on screen: `xcrun simctl create UNTIL_Store com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max com.apple.CoreSimulator.SimRuntime.iOS-26-5`, then `xcrun simctl boot <udid>`.
2. A clean status bar and dark mode:

```bash
xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --operatorName ""
xcrun simctl ui <udid> appearance dark
```

3. Build and install a Debug build, start Metro on a free port, and point the app at it: `xcrun simctl spawn <udid> defaults write com.developernick.until RCT_jsLocation localhost:<port>`.
4. Open a screen with a deep link: `xcrun simctl openurl <udid> until://open/Life` (also `Premium`, `Countdowns`, `CustomCounters`, `Badges`, `DailyTasks`), then `xcrun simctl io <udid> screenshot docs/store-listing/captures-ios/<name>.png`.
5. Widgets and the Lock Screen need the widgets added by hand from the widget gallery. Use fictional demo data: no real name, e-mail or birth date.

Capture names `build_ios.py` looks for today: `01-life`, `02-home-widgets`, `03-home`, `04-badges`. Add `lock-screen`, `watch`, `deadlines`, `counters` and `premium` captures the same way and list them in `SHOTS`.

Tips from the first run: pass `-derivedDataPath` so your own DerivedData is untouched; build with signing on (a build with `CODE_SIGNING_ALLOWED=NO` crashes at launch because the App Group is not accessible); the Debug build shows a "debugger warnings" toast, dismiss it before each capture; the first visit to each screen shows a badge popup, so visit every screen once before the real capture; `xcrun simctl io <udid> screenshot <file>` takes the capture without a screenshot tool.

