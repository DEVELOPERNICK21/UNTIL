# UNTIL — Subscription & License Management

One-device license model: purchase on website → enter license key in app → bound to this device only.

---

## Overview

| Item | Value |
|------|-------|
| **Purchase** | Website (Stripe, Paddle, or custom) |
| **Activation** | User enters license key in Settings → app calls backend |
| **Device binding** | One device per license; backend rejects if already activated elsewhere |
| **Verification** | On app launch and when app becomes active; revokes if invalid |

---

## Free vs Premium

### Free (no license required)

- **Widgets**: Day (today), Year, Counter
- **Dynamic Island / Overlay**: Day, Year

### Premium (license required)

- **Widgets**: Month, Countdown, Daily Tasks, Hour Calculation
- **Dynamic Island / Overlay**: Month, Life, Daily Tasks, Hour Timer

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

## Native Widget Gating (Future)

- **iOS**: `WidgetCacheReader.isPremium` reads from UserDefaults.
- **Android**: Worker reads `premium.isActive` from MMKV.
- When building premium widget views and `!isPremium`, show "Upgrade to Premium" placeholder.
