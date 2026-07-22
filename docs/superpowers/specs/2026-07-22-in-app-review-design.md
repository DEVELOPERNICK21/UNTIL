# In-App Review (Play + App Store) — Design Spec

**Date:** 2026-07-22  
**Status:** Implemented  
**Platform:** Android (Play In-App Review) + iOS (StoreKit `requestReview`)  
**Approach:** Thin native wrapper via `react-native-store-review` (no custom “enjoying UNTIL?” modal)

## Decisions

| Decision | Choice |
|----------|--------|
| Scope | Android + iOS in one pass |
| API | Native in-app review; OS may no-op (quota / eligibility) |
| Auto triggers | Countdown completed + sustained use (opens + calendar days) |
| Manual | Settings “Rate UNTIL” |
| Custom pre-prompt | No |
| Cooldown (app-side) | One auto request per 90 days |
| Settings cooldown | None; always try API, then store listing fallback |
| Stacking | Never while widget coach, feature coach, share, or deferred paywall is visible |

## Product

### User-facing behavior

1. **Auto (countdown)** — After a countdown reaches day 0, the existing share prompt may show first. When that prompt is dismissed (or if share is not pending), request native review if eligible.
2. **Auto (sustained use)** — After `appOpenCount >= 5` **and** at least **3 calendar days** since first recorded open, request native review if eligible and no blocking engagement UI is up.
3. **Settings** — CONFIGURATION row: “Rate UNTIL”. Calls native review; if unavailable / fails, opens the public store listing URL.

No custom rating UI. No “enjoying the app?” gate before the OS dialog.

### Copy (Settings only)

- Row label: `Rate UNTIL`
- No marketing body text required for native dialog (OS owns chrome)

## Architecture

```
Surface / Hook
  → Use case (MaybeRequest / FromSettings)
       → IInAppReviewService (port)
            → StoreReviewAdapter (react-native-store-review + Linking)
       → IEngagementRepository (pending flags + cooldown timestamps)
       → ISubscriptionRepository (appOpenCount; first-open date if stored there or engagement)
```

### Components

| Piece | Role |
|-------|------|
| `IInAppReviewService` | Port: `requestReview(): Promise<void>`, `openStoreListing(): Promise<void>` |
| `StoreReviewAdapter` | Wrap `react-native-store-review`; Play/App Store URLs via `Linking` |
| Engagement MMKV keys | `reviewPending`, `lastAutoReviewRequestAt`, `firstOpenDate` (ISO day key) if not already present |
| `MaybeRequestInAppReviewUseCase` | Check eligibility + no blocking modals context; call `requestReview`; stamp cooldown |
| `RequestInAppReviewFromSettingsUseCase` | Always `requestReview`, then `openStoreListing` on failure / when adapter reports unavailable |
| `useInAppReview` | Hook for Settings CTA |
| Wiring | `di.ts` composition root |

Surfaces must not import the native review module or infrastructure adapters directly (architecture rule).

### Data / eligibility (SSOT)

| Field | Storage | Rule |
|-------|---------|------|
| `reviewPending` | engagement MMKV | Set when countdown completion schedules review (after or alongside share schedule); cleared when auto request is attempted |
| `lastAutoReviewRequestAt` | engagement MMKV | ISO timestamp; auto blocked if within 90 days |
| `appOpenCount` | existing subscription / engagement open count | Sustained-use gate: `>= 5` |
| `firstOpenDate` | engagement MMKV (add if missing) | Sustained-use gate: local calendar days since first open `>= 3` |

**Auto eligibility** (all must pass):

1. `lastAutoReviewRequestAt` absent or older than 90 days
2. Not in onboarding (main app shell only)
3. Caller confirms no blocking engagement overlay (widget coach / feature coach / share / deferred paywall)
4. Trigger-specific: countdown path uses `reviewPending`; opens path uses opens + days gates and does not require `reviewPending`

**Settings:** skip auto gates; try native review every tap; fallback to store URL.

### Trigger wiring

1. **Countdown** — In `CheckCountdownCompletionUseCase` (or immediately after `scheduleSharePrompt`), also `scheduleReviewPrompt()` → sets `reviewPending`.
2. **After share dismiss** — When share prompt dismisses in `AppEngagementLayer` / `useEngagementModals`, if `reviewPending` and eligible, call `MaybeRequestInAppReviewUseCase` with source `countdown`, then clear pending.
3. **Sustained use** — On app become active / existing open-count bump path (same place feature coach schedules), if eligible for opens path, call maybe-request with source `opens`. Do not set `reviewPending` for this path.
4. **Settings** — Row invokes settings use case with source `settings`.

### Store listing fallback URLs

- Android: Play Store package URL for `app.until.time` (confirm package id from `applicationId`)
- iOS: App Store URL when available; if App Store ID not yet known, no-op after failed `requestReview` (document placeholder / env constant)

### Analytics

| Event | Props |
|-------|--------|
| `review_requested` | `source`: `countdown` \| `opens` \| `settings` |
| `review_store_fallback` | `source`: `settings` (when listing opened) |

Do not claim the user submitted a rating (OS does not expose that).

### Error handling

- Auto: swallow adapter errors; stamp cooldown only after a successful call into the native API (attempted request). If the module is missing (e.g. bad link), do not stamp cooldown so a later build can retry.
- Settings: try `requestReview`; on throw / unavailable, `openStoreListing`; if that also fails, silent (no crash).

### Testing

- Unit: eligibility helpers (90-day cooldown, opens + days, pending clear)
- Manual: Settings path on device / emulator; auto path in debug with cooldown bypass flag **only in `__DEV__`** if needed for QA
- Note: Play In-App Review often only shows on builds installed from Play (internal testing track); local debug may no-op

## Out of scope

- Custom pre-prompt modal
- Wear OS / widgets rating
- Email feedback form
- Forcing the OS dialog or detecting star rating result

## Success criteria

1. Settings “Rate UNTIL” works on Android and iOS (API and/or store fallback).
2. Auto request can fire after countdown share flow and after sustained use, without stacking on other engagement modals.
3. App-side auto cooldown is 90 days.
4. Layer boundaries respected (port + use case + MMKV; no surface → native).
