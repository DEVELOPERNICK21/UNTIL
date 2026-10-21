# App update sheet

When a newer build is live on the store, people running an older one see a bottom sheet with a short "what's new" list and an **Update now** button. A required update has no "Not now".

## How it works

1. On launch, and when the app returns to the foreground, the app downloads `/api/update-config` from the website.
2. It compares **its own build number** with the entry for **its own platform**. Android and iOS are separate: Android uses `versionCode`, iOS uses the build number (`CFBundleVersion`). The iOS marketing version stays at 1.0, so it is never compared.
3. If the installed build is below `latestBuild`, the sheet appears. "Not now" hides it for 3 days; a second "Not now" hides it until a newer build exists.
4. If the installed build is below `minimumBuild`, the sheet cannot be dismissed.
5. The sheet only ever opens our own store listing (the link is checked in the app, because it arrives over the network).

The sheet appears after onboarding, before the other prompts (widget tip, share, reminder offer), which wait their turn.

## Release day

Edit **`website/src/domain/appUpdate.ts`**, merge, and the website redeploys:

| Field | What to do |
|-------|-----------|
| `latestBuild` | Set it to the new build number **after the release has reached everyone** on that store. Too early sends people to a listing that does not have it yet. |
| `versionName` | The version shown in the sheet, e.g. `1.4`. |
| `notes` | Up to three short lines (90 characters each) shown under "What's new". Leave empty to hide the section. |
| `minimumBuild` | Leave at `1`. Raise it only to force everyone below it to update, for example after a build with a serious bug. |

Where to find the numbers: Android, Play Console > Release > Production, the version code (Codemagic sets each build to the Play latest plus one). iOS, App Store Connect > TestFlight / App Store, the build number.

## iOS

iOS prompts are off (`latestBuild: null`) until the App Store listing is public. Then set `ios.storeUrl` to `https://apps.apple.com/app/id<Apple ID>` (App Store Connect > App Information > Apple ID) and `ios.latestBuild` to the live build.

## Important limits

- A build can only show the sheet if it contains this code. People on older builds learn about updates only from the store's own update prompts. The first release that includes the sheet is the first one that can announce the next.
- The old remote-config popups were paused in September (`APP_UPDATE_PROMPTS_PAUSED`). Builds from before that kept reading the legacy fields `latest_version` and `minimum_supported_version`; the route keeps them at `"1"` so those builds stay quiet.
- Checking is cheap (one small request). A "nothing to show" answer is cached for 6 hours; an update prompt is checked again on every launch so a required update cannot be skipped.

## Analytics

`app_update_sheet_shown` (kind, latest_build, installed_build), `app_update_tapped`, `app_update_later`. Compare shown against tapped to see how many people update when asked.

## Not used

`CheckForAppUpdateUseCase` / `sp-react-native-in-app-updates` (Play's own in-app update flow) is wired but never called. It could be added later for Android's background download, but it only works for Play-installed builds and cannot be tested from a debug build.
