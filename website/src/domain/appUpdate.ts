/**
 * What the phone app is told about the newest store builds. This file is the one place to edit on
 * release day; merging it redeploys the website and the app picks it up within hours.
 *
 * Builds are compared as integers, per platform:
 *   - Android: versionCode (Play Console, e.g. 33).
 *   - iOS: build number / CFBundleVersion (App Store Connect, e.g. 12). The iOS marketing version
 *     barely changes, so never use it here.
 *
 * Release day (after the new build is live to everyone on that store):
 *   1. Set `latestBuild` for that platform, and `versionName` (shown in the sheet).
 *   2. Replace `notes` with up to three short lines (90 characters each).
 *   3. Leave `minimumBuild` alone. Raise it only to force everyone below it to update; that sheet
 *      cannot be dismissed, so use it for a build with a serious bug.
 * An installed build at or above `latestBuild` sees nothing. Do not set `latestBuild` before the
 * release has finished rolling out, or people are sent to a listing that does not have it yet.
 */

export interface PlatformUpdate {
  /** Newest build available to everyone. `null` switches prompts off for the platform. */
  latestBuild: number | null;
  /** Builds below this are required to update. */
  minimumBuild: number;
  versionName: string | null;
  storeUrl: string | null;
  notes: string[];
}

export const APP_UPDATE: { android: PlatformUpdate; ios: PlatformUpdate } = {
  android: {
    // 1.3 (33) is the latest build confirmed on Play. Raise this when the next release is live.
    latestBuild: 33,
    minimumBuild: 1,
    versionName: '1.3',
    storeUrl: 'https://play.google.com/store/apps/details?id=app.until.time',
    notes: [],
  },
  ios: {
    // Off until the App Store listing is public. Then set the real numeric Apple ID in `storeUrl`
    // (App Store Connect > App Information > Apple ID) and the live build number here.
    latestBuild: null,
    minimumBuild: 1,
    versionName: null,
    storeUrl: null,
    notes: [],
  },
};
