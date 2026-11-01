# Play Store listing images

`build.py` turns real captures of the app into the Play Store screenshots and feature graphic.

```bash
python3 scripts/store-listing/build.py     # needs Pillow: pip3 install pillow
```

| In | Out |
|----|-----|
| `docs/store-listing/captures/*.png` | `docs/store-listing/screenshots/01.png … 08.png` (1080×1920) |
| | `docs/store-listing/feature-graphic.png` (1024×500) |

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
