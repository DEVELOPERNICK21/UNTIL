# App size: what is in it and what to cut

Measured on 20 November 2026. Android numbers are in [`ANDROID_RELEASE_BUILD.md`](ANDROID_RELEASE_BUILD.md) ("Keeping the app small"); this adds the iOS side and the one change that would shrink both.

## iOS

An unsigned Release build for a device (`xcodebuild … -configuration Release -sdk iphoneos CODE_SIGNING_ALLOWED=NO`, built from the repo at `a059aad`), then stripped the way an archive strips it, zipped to estimate the IPA.

| | Size |
|---|---:|
| App folder, stripped (what the phone installs) | **63.6 MB** |
| Estimated IPA (zip) | **28.7 MB** |
| App Store listing "size" (lookup API `fileSizeBytes`, 1.0.1) | 70.4 MB |

The 70.4 MB on the listing is the **installed** size, not the download: it matches the stripped app folder, and the download is about 29 MB. Do not compare it with a download size.

What is inside the 63.6 MB:

| Part | MB | Note |
|------|---:|------|
| Main executable | 46.6 | 86.8 MB before strip; `__TEXT` (code) is 38.7 MB |
| `main.jsbundle` | 10.0 | Hermes bytecode. About 7.4 MB after the three unused SVGs were removed in this branch (they added 2.5 MB of base64) |
| Hermes framework | 5.1 | Needed |
| Apple Watch app | 2.5 | Needed |
| Asset catalog | 1.8 | Three 1024 px app icons are about 1.5 MB of it |
| Widgets extension | 1.7 | Needed |
| Fonts and other assets | 1.8 | Inter Bold, Medium, Regular |

### The big one: Skia

The static libraries that go into the executable add up to **82 MB before dead-stripping, and all 82 MB of it is `react-native-skia`**: `libskia` 35.4, `libskottie` 12.8, `libsvg` 11.1, `libsksg` 10.2, `libskshaper` 9.5, plus smaller ones. On Android it is the largest native library too (11.2 MB of arm64, about half of the 22.8 MB download).

The app uses Skia in exactly two files:

- `src/shared/ui/PeriodDotsGrid.tsx` (92 lines): two paths of circles. `react-native-svg` is already a dependency and can draw the same thing as two `<Path>` elements.
- `src/features/share/ui/ShareSnapshotScreen.tsx` (1,042 lines): the share picture, drawn on a Skia canvas and exported with `makeImageSnapshot`. It could be one `<Svg>` shown scaled for the preview and exported at full size with `toDataURL`, or captured with `react-native-view-shot` (also already a dependency).

Replacing Skia with the two libraries the app already has would remove the largest piece of both apps: the estimate is 15 to 25 MB of installed size on iOS and about 11 MB of the download on Android. It is a real change to the Life grid (the hero of the listing) and to the share image, so it needs a before-and-after check of both screens on a phone, on both platforms, and the Skia dependency removed from `package.json` and `Podfile.lock`.

### Smaller levers, in order

1. **Done here:** drop the three unused SVGs (2.5 MB from the JS bundle, both platforms).
2. Keep an eye on `src/assets/icons/index.ts`: everything exported from it is bundled whether it is shown or not.
3. Firebase Analytics, Firestore (and its gRPC) and Crashlytics are all in use; there is nothing to drop without losing a feature.
4. Fonts: the three Inter weights are 1 MB together. Only worth it if a weight turns out to be unused.

### How to measure again

```bash
xcodebuild -workspace ios/UNTIL.xcworkspace -scheme UNTIL -configuration Release -sdk iphoneos \
  -destination 'generic/platform=iOS' -derivedDataPath /tmp/dd CODE_SIGNING_ALLOWED=NO build
APP="/tmp/dd/Build/Products/Release-iphoneos/UNTIL : Countdown & Time Left.app"
strip -S -x "$APP/UNTIL : Countdown & Time Left"        # an archive does this for you
ditto -c -k --keepParent "$APP" /tmp/estimate.zip && ls -l /tmp/estimate.zip
```

Codemagic's archived IPA is the real number; this is within a few MB of it.
