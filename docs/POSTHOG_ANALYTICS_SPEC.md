# PostHog Analytics — Implementation Spec

**Goal:** Improve user behavior insights and profitability by adding PostHog alongside existing Firebase Analytics, without breaking architecture boundaries or privacy commitments.

**Status:** Spec (not yet implemented)  
**Last updated:** 2026-06-12

---

## 1. Summary

| Item | Decision |
|------|----------|
| Product analytics | **PostHog** (primary exploration tool) |
| Crash reporting | **Firebase Crashlytics** (unchanged) |
| Legacy events | **Firebase Analytics** (dual-write during transition) |
| Session replay | PostHog mobile replay — **Phase 3**, sampled at 10% |
| User identity | Anonymous `device_id` only — no birth date, tasks, or health data |
| Architecture | Extend `src/services/analytics.ts` as SSOT; surfaces use `useAnalytics()` only |

---

## 2. Business outcomes this unlocks

### North star metrics

| Metric | Definition | PostHog insight type |
|--------|------------|----------------------|
| Activation | `onboarding_complete` within 24h of install | Funnel |
| Widget adoption | `widget_add_tapped` → confirmed install | Funnel + cohort |
| Habit | D1/D7 retention on `app_open` | Retention |
| Monetization | `premium_viewed` → `premium_purchase_completed` | Funnel by `source` |
| Trial conversion | `trial_preview_started` → purchase within 5 days | Cohort |
| Plan mix | % yearly vs monthly vs lifetime | Trends breakdown |

### Dashboards to create (PostHog UI)

1. **Acquisition** — Install proxy (`app_open` first seen) → onboarding steps → widget coach → D7 return  
2. **Monetization** — premium_viewed → purchase_started → purchase_completed (breakdown: `source`, `plan_id`)  
3. **Retention** — D1/D7/D30 by cohort: widget users vs non-widget, trial vs no-trial  

---

## 3. PostHog project setup

You already have a PostHog org (`developernick`). Create or reuse a project for UNTIL mobile.

### 3.1 Console steps

1. [PostHog](https://us.posthog.com) → **New project** (or use existing) → name: `UNTIL Mobile`
2. **Project Settings → General** — copy **Project API Key** (starts with `phc_`)
3. **Project Settings → Session replay** — enable **Record user sessions** (leave off auto-start until Phase 3)
4. **Project Settings → Autocapture** — disable web autocapture (N/A); mobile autocapture handled by SDK
5. **Data pipeline → Event definitions** — after Phase 1 deploy, import event schema from section 6

### 3.2 Environment variables

Add to local `.env` (not committed) and CI/release config:

```bash
# PostHog — client-safe project key (not personal API key)
UNTIL_POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
UNTIL_POSTHOG_HOST=https://us.i.posthog.com
```

Wire via `react-native-config` **or** a small `src/config/analytics.ts` that reads from a checked-in example file. Match existing pattern used by `TrialPreviewApiAdapter.ts` (`process.env.UNTIL_*`).

**`src/config/analytics.ts.example`** (commit this):

```ts
export const POSTHOG_API_KEY = ''; // phc_...
export const POSTHOG_HOST = 'https://us.i.posthog.com';
export const POSTHOG_ENABLED = true; // false in __DEV__ unless testing
export const POSTHOG_SESSION_REPLAY_SAMPLE_RATE = 0.1; // Phase 3
```

In `__DEV__`, default `POSTHOG_ENABLED=false` unless key is set — avoids polluting production data during local dev.

### 3.3 Data residency

Use `https://us.i.posthog.com` (US cloud). If EU users become significant, evaluate `https://eu.i.posthog.com` migration later.

---

## 4. Architecture

### 4.1 Data flow (respects layer boundaries)

```
Surfaces / Components
    → useAnalytics() hook          (src/hooks/useAnalytics.ts)
    → logAnalyticsEvent()          (src/services/analytics.ts)  ← SSOT
         ├→ Firebase Analytics      (existing)
         └→ PostHog client         (new sink)

Domain / DI (purchase completion only)
    → logAnalyticsEvent() via callback in di.ts onApplied hooks
    → NO PostHog imports in surfaces from infrastructure
```

**Rule:** Surfaces never import `posthog-react-native` directly. All product events go through `logAnalyticsEvent()`.

### 4.2 New files

| File | Purpose |
|------|---------|
| `src/config/analytics.ts` | API key, host, feature flags |
| `src/config/analytics.ts.example` | Template for setup |
| `src/services/posthogClient.ts` | Lazy PostHog init, identify, capture wrapper |
| `src/services/analyticsUserProperties.ts` | Sync person properties from AccessState |
| `src/navigation/useNavigationAnalytics.ts` | Screen-view tracking for both navigators |
| `docs/POSTHOG_ANALYTICS.md` | Operator guide (events, dashboards, dev notes) |

### 4.3 Modified files

| File | Change |
|------|--------|
| `package.json` | Add `posthog-react-native` (+ session replay plugin in Phase 3) |
| `ios/Podfile` | `pod install` after yarn |
| `src/app.tsx` | Wrap tree in `PostHogProvider` |
| `src/services/analytics.ts` | Dual-write; expand `AnalyticsEventName` union |
| `src/hooks/useAnalytics.ts` | Optional: add `setUserProperties()` |
| `src/navigation/RootNavigator.tsx` | Attach `useNavigationAnalytics(rootNavigationRef)` |
| `src/navigation/AuthNavigator.tsx` | Attach navigation state listener for auth screens |
| `src/components/premium/PremiumPaywallBody.tsx` | Purchase started / failed / cancelled events |
| `src/di.ts` | Purchase completed + restore completed events |
| `src/domain/useCases/SyncTrialPreviewUseCase.ts` | Trial started event (first sync only) |
| `src/hooks/useTrialEndingReminder.ts` | Trial ended / reminder shown events |
| `src/surfaces/app/ShareSnapshotScreen.tsx` | `share_tapped` event |
| `src/surfaces/app/PremiumScreen.tsx` | Pass `source` prop to paywall |
| `src/components/engagement/DeferredPaywallModal.tsx` | `source: 'deferred'` on premium_viewed |
| `src/surfaces/auth/OnboardingPaywallScreen.tsx` | `source: 'onboarding'` |
| `website/src/domain/legal/privacy.ts` | Analytics disclosure (section 2, 7, new §) |
| `docs/FIREBASE_ANALYTICS.md` | Cross-link to PostHog doc |

---

## 5. SDK integration

### 5.1 Dependencies

```bash
yarn add posthog-react-native
# Phase 3 only:
yarn add posthog-react-native-session-replay
cd ios && pod install && cd ..
```

Peer deps (likely already present): `@react-navigation/native`, `react-native-safe-area-context`, `react-native-device-info`.

### 5.2 Provider placement (`src/app.tsx`)

Wrap **after** `SafeAreaProvider`, **before** `ThemeProvider`:

```tsx
import { PostHogProvider } from 'posthog-react-native';
import { POSTHOG_API_KEY, POSTHOG_HOST, POSTHOG_ENABLED } from './config/analytics';

// Inside App component return (post-splash):
<SafeAreaProvider>
  <PostHogProvider
    apiKey={POSTHOG_API_KEY}
    options={{
      host: POSTHOG_HOST,
      disabled: !POSTHOG_ENABLED,
      captureAppLifecycleEvents: true,
      enableSessionReplay: false, // Phase 3
    }}
    autocapture={{
      captureScreens: false, // we use explicit navigation listener (two containers)
      captureTouches: false, // avoid noise; use explicit events
    }}
  >
    <ThemeProvider>
      <PostSplashContent />
    </ThemeProvider>
  </PostHogProvider>
</SafeAreaProvider>
```

### 5.3 Screen tracking (two `NavigationContainer`s)

Auth and main app use separate containers. Do **not** rely on PostHog autocapture alone.

**`src/navigation/useNavigationAnalytics.ts`:**

```ts
// On NavigationContainer onStateChange:
// - Extract current route name from navigation state
// - logAnalyticsEvent('screen_view', { screen: routeName })
// - Debounce duplicate emissions (300ms)
```

Attach to:
- `RootNavigator` — `ref={rootNavigationRef}` already exists; add `onStateChange`
- `AuthNavigator` — inline `onStateChange` on its `NavigationContainer`

### 5.4 User identification

On first `app_open` after PostHog init:

```ts
import { getDeviceId } from '../infrastructure/DeviceId';

const deviceId = await getDeviceId();
posthog.identify(deviceId); // anonymous, stable per device
```

**Never send:** birth date, expected lifespan, task titles, counter names, reflection content.

### 5.5 Person properties (sync on access state change)

Create `syncAnalyticsUserProperties(access: AccessState)` called from:
- `app.tsx` after `verifySubscriptionUseCase`
- `observeSubscriptionUseCase.subscribe` callback (via thin hook in `app.tsx` or `analyticsUserProperties.ts`)

| Property | Type | Source |
|----------|------|--------|
| `is_premium` | boolean | `access.isPremium` |
| `trial_active` | boolean | `access.trialActive` |
| `trial_days_remaining` | number | computed from `trialStartDate` |
| `app_open_count` | number | `access.appOpenCount` |
| `onboarding_complete` | boolean | `useOnboardingState` / MMKV |
| `platform` | string | `Platform.OS` |
| `app_version` | string | `react-native-device-info` |

---

## 6. Event catalog

### 6.1 Existing events (keep, dual-write)

All events in `AnalyticsEventName` today — no renames (avoids breaking Firebase funnels).

### 6.2 P0 — Revenue (Phase 1)

| Event | When | Properties | File |
|-------|------|------------|------|
| `premium_purchase_started` | Before `requestPurchase()` | `plan_id`, `source`, `price_display` | `PremiumPaywallBody.tsx` |
| `premium_purchase_completed` | After `applyStorePurchaseUseCase` succeeds | `plan_id`, `purchase_type` | `di.ts` `onApplied` callback |
| `premium_purchase_failed` | Catch in `onBuy` (non-cancel) | `plan_id`, `error_code` | `PremiumPaywallBody.tsx` |
| `premium_purchase_cancelled` | `ErrorCode.UserCancelled` | `plan_id` | `PremiumPaywallBody.tsx` |
| `premium_restore_completed` | `restorePurchasesUseCase` returns `restored: true` | — | `di.ts` or `PremiumPaywallBody.tsx` |

**`source` enum:** `premium_screen` | `deferred_paywall` | `onboarding_paywall` | `trial_ending_modal` | `widget_gate` | `unknown`

Pass `source` via optional prop on `PremiumPaywallBody`:

```tsx
<PremiumPaywallBody source="premium_screen" />
```

### 6.3 P1 — Habit & value (Phase 2)

| Event | When | Properties | File |
|-------|------|------------|------|
| `screen_view` | Navigation state change | `screen` | `useNavigationAnalytics.ts` |
| `share_tapped` | Share button pressed | `snapshot_type` (if known) | `ShareSnapshotScreen.tsx` |
| `task_completed` | Task marked done | — | Daily tasks hook/screen |
| `life_progress_viewed` | Life screen mount | — | `LifeScreen.tsx` |
| `trial_preview_started` | First trial start persisted | `trial_days` | `SyncTrialPreviewUseCase.ts` |
| `trial_preview_ended` | Trial no longer active (day 6+) | `converted` | `useTrialEndingReminder` or access observer |
| `trial_reminder_shown` | Trial ending modal visible | `trial_day` | `TrialEndingModal` / hook |

### 6.4 Event naming rules

- snake_case, past tense for completed actions (`purchase_completed` not `purchase_complete`)
- Max 5 properties per event; no PII
- Booleans as `0`/`1` in Firebase payload (existing `sanitizeParams`); PostHog can receive native booleans via separate path if needed

---

## 7. `analytics.ts` dual-write pattern

```ts
// src/services/analytics.ts (conceptual)

export async function logAnalyticsEvent(name, params?) {
  const payload = sanitizeParams(params);
  if (__DEV__) console.log('[analytics]', name, payload);

  await Promise.allSettled([
    sendToFirebase(name, payload),
    sendToPostHog(name, payload),
  ]);
}
```

`sendToPostHog` uses lazy require of `posthogClient.ts` — same safe no-op pattern as Firebase when disabled.

---

## 8. Privacy & compliance

### 8.1 What we collect via PostHog

- Anonymous device identifier (hashed/stable ID, not email or name)
- App version, platform, screen names
- Product interaction events (button taps we explicitly log)
- Optional: session replay (screen recording of UI, no keyboard input by default)

### 8.2 What we do NOT collect

- Birth date, lifespan, health-related user content
- Task titles, goal text, counter names
- Purchase tokens or Play billing receipts

### 8.3 Privacy policy updates (`website/src/domain/legal/privacy.ts`)

1. Bump `PRIVACY_LAST_UPDATED`
2. **§2 Data We Collect** — add bullet:

   > **Analytics:** We use PostHog (PostHog, Inc.) to collect anonymous usage events (e.g., screens viewed, feature usage, purchase funnel steps) and, if enabled, sampled session replays. This data does not include the health or personal content you enter in the App.

3. **§7 Sharing** — add PostHog as service provider under confidentiality
4. **New §5a Analytics and session replay** — opt-out note: uninstall clears local ID; contact email for deletion requests
5. Redeploy website so Play Store privacy URL stays current

### 8.4 Google Play Data safety form

Declare:
- **Analytics** — device or other IDs, app interactions, crash logs (Crashlytics)
- **Not** health data transmitted to PostHog
- Data encrypted in transit; users can request deletion via support email

### 8.5 iOS App Privacy (when shipping iOS)

- Identifiers: device ID for analytics
- Usage data: product interaction
- No data linked to identity (anonymous analytics)

---

## 9. Implementation phases

### Phase 1 — Foundation + revenue (~1 day)

- [ ] PostHog project + env keys
- [ ] Install SDK, `PostHogProvider`, `posthogClient.ts`
- [ ] Dual-write in `analytics.ts`
- [ ] `identify(deviceId)` on launch
- [ ] P0 purchase events + `source` prop on paywall
- [ ] Verify events in PostHog **Activity** tab (debug build with `POSTHOG_ENABLED=true`)

**Exit criteria:** `premium_purchase_started` and `premium_purchase_completed` visible in PostHog with `plan_id` and `source`.

### Phase 2 — Behavior + properties (~1 day)

- [ ] `useNavigationAnalytics` on both navigators
- [ ] Person properties sync
- [ ] `share_tapped`, `life_progress_viewed`, trial events
- [ ] Build Acquisition + Monetization dashboards

**Exit criteria:** Funnel onboarding → widget → D7 return is queryable; monetization funnel by source works.

### Phase 3 — Session replay + experiments (ongoing)

- [ ] `posthog-react-native-session-replay` plugin
- [ ] `enableSessionReplay: true`, sample rate 10%
- [ ] Enable recording in PostHog project settings
- [ ] First feature flag: `deferred_paywall_session` (session 2 vs session 4)

**Exit criteria:** At least one session replay viewable; one A/B test defined (can run with low traffic).

---

## 10. Testing checklist

| Test | How |
|------|-----|
| Dev no-op | `POSTHOG_ENABLED=false` → no network to PostHog |
| Event fired | Enable in dev, check PostHog Live events |
| Firebase still works | Firebase DebugView (Android) shows same events |
| Purchase flow | Sandbox purchase → `purchase_completed` with correct `plan_id` |
| No PII leak | Inspect payload in PostHog — no birth date, task text |
| Offline | Events queue and flush on reconnect (PostHog default) |
| iOS build | `pod install` succeeds, app launches |

---

## 11. Rollback plan

1. Set `POSTHOG_ENABLED=false` in config — immediate stop
2. Remove `PostHogProvider` wrapper — one file change
3. Firebase Analytics continues unaffected
4. No user data migration needed

---

## 12. Cost estimate

PostHog free tier (as of 2026):
- ~1M events/month free
- 2,500 mobile session replays/month free

At UNTIL's current scale (~30–50 installs/month per growth checklist), you will remain on free tier for a long time.

---

## 13. Alternatives considered (why not)

| Option | Reason skipped |
|--------|----------------|
| Firebase only | Weak funnels, paths, replay; already hitting limits |
| Amplitude / Mixpanel | Cost and complexity at current scale |
| Replace Firebase entirely | Lose Crashlytics integration; dual-write is safer |
| UXCam only | Replay without flags/funnels/purchase cohorts |

---

## 14. Open questions (decide before Phase 1)

1. **Dev data:** Send events from `__DEV__` builds to a separate PostHog project, or disable entirely?  
   **Recommendation:** Disable in dev; use `POSTHOG_ENABLED=true` manually when testing.

2. **Session replay default:** Auto-record 10% or manual-only on paywall sessions?  
   **Recommendation:** 10% sample after Phase 2 dashboards are stable.

3. **iOS purchases:** Not implemented yet — skip iOS purchase events until StoreKit ships; log `platform: ios` on paywall views only.

---

## 15. References

- Existing: [`docs/FIREBASE_ANALYTICS.md`](./FIREBASE_ANALYTICS.md)
- Monetization funnels: [`docs/PLAY_STORE_GROWTH_CHECKLIST.md`](./PLAY_STORE_GROWTH_CHECKLIST.md)
- PostHog RN docs: https://posthog.com/docs/libraries/react-native
- PostHog session replay RN: https://posthog.com/docs/session-replay/installation/react-native
