# UNTIL — Subscription & License Management

Two premium paths:

1. **Store purchase** via RevenueCat (Play / App Store). Entitlement `premium` on offering `default`.
2. **Website license key**: purchase on website → enter key in app → bound to this device only.

---

## Overview

| Item | Value |
|------|-------|
| **Store purchase** | RevenueCat (`react-native-purchases`). See `MONETIZATION_SETUP.md`. |
| **Website purchase** | License key (Stripe, Paddle, or custom) |
| **Activation (license)** | User enters license key in Settings → app calls backend |
| **Device binding (license)** | One device per license; backend rejects if already activated elsewhere |
| **License verification** | On app launch and when app becomes active; revokes if invalid |

---

## After a purchase

What the app keeps and shows once RevenueCat says a plan is active (`SyncCustomerInfoUseCase`, `premium/domain/plan.ts`).

| Piece | What it does |
|-------|--------------|
| Plan record | `premium.plan` in MMKV: kind (weekly, monthly, yearly, student, lifetime), store, start, end or renewal date, whether it will renew, free trial, billing problem. Read through `usePlan`. |
| Welcome popup | `PurchaseWelcomeSheet`, driven by `usePurchaseWelcome`. Queued the first time a plan becomes active (a purchase, a restore, or Premium arriving from another device), shown once after a short pause so it never opens under the store sheet or the RevenueCat paywall. It greets by time of day, names the plan, says when it renews or ends, and lists what is unlocked. A renewal never queues one, and neither does a subscriber from before this existed. |
| Plan card | `PlanCard` on the Premium screen: the plan, when it renews or ends, since when, who bills it, and Manage subscription. Lifetime reads "yours for good". |
| Profile chip | `PlanChip` in the Settings profile: "Premium · Yearly plan". Tap opens the Premium screen. |
| Badges | One per plan (`plan_weekly`, `plan_monthly`, `plan_yearly`, `plan_student`, `plan_lifetime`, family `premium`), earned the moment that plan is active and kept after it lapses. Backed by `premium.plansBought`, which never shrinks. |

### When Premium ends

RevenueCat lists entitlements that are no longer active (`entitlements.all`). When it says `premium` has ended (expired, refunded), the app turns Premium off, clears the plan record and the purchase type, and keeps the badges. An answer that is merely empty (offline, a fresh sign-in) does not take Premium away: only an explicit "ended" does. A web license key keeps Premium on whatever the store says.

### Finding a customer by email in RevenueCat

People who sign in are RevenueCat customers under their Firebase user ID. After the login the app sends their email as the `$email` attribute (`IdentifyPurchasesUserUseCase`, every launch and at sign-in), so the dashboard search bar (or Cmd/Ctrl+K) finds them by the exact address. Guests have no email: they appear only as `$RCAnonymousID:…` until they sign in. An Apple "Hide My Email" address is searchable as the relay address, not the real one. The email is cleared again for a signed-out customer, and nothing is sent for anyone who could not create an account (under 13). The privacy policy says so (Purchases paragraph).

To reward or win back someone: open the customer, then **Grant promotional entitlement** on `premium` for a duration (a month, a year, lifetime). It takes effect the next time the app syncs and shows as the same Premium, without any store purchase. Store offer codes (Play promo codes, App Store offer codes) are the other route for a discount on a paid plan.

### Dashboard checklist

All five products attached to the `premium` entitlement; offering `default` current, with packages `$rc_weekly`, `$rc_monthly`, `$rc_annual`, `$rc_lifetime` and `student_yearly`; products Active in Play Console and App Store Connect; release builds use the `appl_` and `goog_` keys, never `test_`.

---

## Free vs Premium

### Free (no license required)

- **Widgets**: Day (today), Year, Counter, Countdown (deadline), Daily Tasks, Hour Calculation
- **Dynamic Island / Overlay**: Day, Year
- **Deadlines and counters**: 1 of each

### Premium (license required)

- **Widgets**: Month, Life, Next deadlines (the three nearest)
- **Dynamic Island / Overlay**: Month, Life
- **Deadlines and counters**: up to 20 of each (`src/config/featureLimits.ts`)

---

## Backend API

Configure `UNTIL_LICENSE_API` (or edit `LicenseVerificationServiceAdapter.ts`) to point to your backend.

### POST /activate

Activate a license on this device. One device only.

**Request:**
```json
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceId": "unique-device-id-from-app"
}
```

**Response (success):**
```json
{ "success": true }
```

**Response (failure):**
```json
{
  "success": false,
  "error": "License already activated on another device",
  "code": "already_activated"
}
```

**Error codes:** `invalid_license`, `already_activated`, `network_error`, `unknown`

### GET /verify?licenseKey=...&deviceId=...

Verify license is still valid.

**Response (valid):**
```json
{ "valid": true }
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "License has been revoked",
  "code": "revoked"
}
```

**Error codes:** `invalid`, `revoked`, `device_mismatch`, `network_error`, `unknown`

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| **Offline at launch** | If last verification was within 7 days, trust cached premium. Otherwise show free. |
| **Network error during verify** | Same 7-day grace. After grace, revoke premium. |
| **User switches device** | Second device gets "already_activated". User must request transfer from website/support. |
| **Refund** | Backend revokes license; next verify fails; app revokes premium. |
| **App reinstall** | Device ID may change (iOS). Use stable ID (getUniqueId); document that iOS can change after OS update. |
| **License key typo** | Activation returns `invalid_license`; user can retry. |
| **Multiple tabs / rapid activate** | Backend should be idempotent; first successful activation wins. |
| **Expired subscription** | Backend returns `invalid` or `revoked`; app revokes. |

---

## Implementation Notes

### Device ID

- Uses `react-native-device-info` `getUniqueId()` when available.
- Fallback: hash of model + buildId, or random (less stable).
- **iOS**: `getUniqueId` can change after OS update; test on target devices.

### Storage

- `premium.isActive` — boolean, MMKV (Android) / UserDefaults App Group (iOS for widgets)
- `subscription.licenseKey` — license key (trimmed)
- `subscription.deviceId` — bound device ID
- `subscription.lastVerified` — timestamp of last successful verification

### Sync

- `syncPremiumStatus()` writes premium state to native (iOS UserDefaults, Android triggers widget update).
- Called on app launch and when app becomes active, after `verifySubscriptionUseCase.execute()`.

---

## Website Purchase Flow

1. User buys on website (Stripe Checkout, Paddle, etc.).
2. After payment, backend generates license key (e.g. UUID or custom format).
3. User receives key by email or on confirmation page.
4. User opens UNTIL → Settings → Premium → enters key → Activate.
5. App calls `POST /activate` with key + deviceId.
6. Backend: if key valid and not yet activated, bind deviceId, return success.
7. App stores key, deviceId, sets isPremium=true.

---

## Transfer / Deactivate

To support "move to new device":

1. Add `POST /deactivate` or `POST /transfer` on backend.
2. User requests from website (e.g. "Move license to new device").
3. Backend clears deviceId for that license.
4. User activates on new device with same key.

---

## Native widget & overlay gating (shipped)

- **Effective premium** = paid **or** active in-app preview. JS writes `premium.effectiveAccess` to MMKV (`WidgetSync.syncPremiumStatus`) and iOS App Group (`WidgetBridge.setPremiumStatus`).
- **iOS**: `MonthWidgetView` and `LifeWidgetView` read `WidgetCacheReader.isPremium`; locked state shows upgrade placeholder.
- **Android**: `UNTILWidgetWorker` reads `premium.effectiveAccess` (falls back to `premium.isActive`); Month/Life widgets show lock copy when not entitled.
- **Android overlay**: `UNTILOverlayService` coerces `month`/`life` overlay types to `day` when not entitled.
