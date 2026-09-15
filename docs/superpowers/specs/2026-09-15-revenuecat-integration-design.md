# RevenueCat integration design

**Date:** 2026-09-15  
**Status:** Approved for planning  
**App:** UNTIL (React Native 0.86, bare)

## Goal

Replace Google Play Billing (`react-native-iap`) with RevenueCat as the purchase and store-entitlement layer. Keep UNTIL’s custom paywall UI and copy. Keep web license keys as a second premium path. Identify users with Firebase UID after sign-in. Configure iOS and Android SDK keys now; ship live purchases on Android first. Leave a clean seam for RevenueCat Paywalls later without building them in this pass.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Purchase / entitlement owner | RevenueCat SDK |
| Paywall UI | Custom screens; optional RC Paywalls later |
| Platforms | Android + iOS SDK keys; Android purchases first |
| License keys | Keep as OR entitlement (`premium` if RC **or** valid license) |
| Identity | `Purchases.logIn(firebaseUid)` after Firebase sign-in |
| Architecture style | New `IPurchasesRepository` port (not reuse Play-shaped interface) |
| RC project | New project **UNTIL** (not Pawsoul / occasio) |

## Architecture

### Layer boundaries

- Surfaces and hooks must not import `react-native-purchases`.
- New port: `IPurchasesRepository` in `domain/repository/` — offerings, purchase package, restore, customer info, listener.
- Adapter: `RevenueCatPurchasesRepository` in `infrastructure/`.
- Use cases own purchase / restore / sync / identify flows.
- Wiring in `di.ts` (composition root).
- Optional later: `IPaywallPresenter` (no-op now; later wraps `react-native-purchases-ui`).

### Entitlement SSOT

- Local premium state, license fields, trial, and purchase metadata stay on `ISubscriptionRepository` (MMKV).
- Gates read MMKV `isPremium` (and existing access helpers). Writers must keep:
  - `isPremium === true` if RC entitlement `premium` is active **or** a valid license is on device.
- `SyncCustomerInfoUseCase` maps `CustomerInfo` → purchase type/date and store-side premium. When writing `isPremium`, it must **OR** with license presence (never set `false` if a license key is still considered active via existing verify/activate rules).
- License activate/verify continues to set `isPremium` independently of RC.

### Auth identity

- App launch: `Purchases.configure` once with platform public API key.
- If Firebase user already signed in: `Purchases.logIn(uid)`.
- Sign-in success: `IdentifyPurchasesUserUseCase(uid)`.
- Sign-out: `Purchases.logOut()` (anonymous again). Do not wipe license fields. Clear store purchase metadata only when RC reports no active `premium`.

### Remove after cutover

- Dependency: `react-native-iap`
- `IPlayBillingRepository`, `PlayBillingRepository`, `NoOpPlayBillingRepository`
- `ensurePlayBillingSession` and Play purchase listeners in `di.ts`
- Client reliance on website `verify-purchase` for granting premium (API may remain unused; deleting it is out of scope)

## RevenueCat dashboard

### Project and apps

| App | Identifier | Notes |
|-----|------------|--------|
| Test Store | (default) | Enough for early SDK / offerings testing |
| Google Play | `app.until.time` | Link when Play products / credentials ready |
| App Store | `com.develoeprnick.UNTIL` | Register + public key now; products later |

### Entitlement and products

- Entitlement id: `premium` (single entitlement for all Premium features).
- Current offering: `default`.

| Store product ID | Package | Notes |
|------------------|---------|--------|
| `monthly_subscription` | `$rc_monthly` | |
| `yearly_subscription` | `$rc_annual` | Default / “Best value” |
| `lifetime_unlock` | `$rc_lifetime` | One-time |
| `yearly_subscription_student` | custom | Only if `MONETIZATION_FEATURE_FLAGS.studentPlanEnabled` |

### API keys

- Public SDK keys only in the client (`appl_…` / `goog_…` / Test Store).
- Inject via env: `REVENUECAT_API_KEY_IOS`, `REVENUECAT_API_KEY_ANDROID` (or equivalent). Do not commit secret API keys.
- Debug logging on during integration; off in release.

## App data flow

### Bootstrap

1. Configure Purchases once at app entry.
2. Identify if Firebase session exists.
3. Fetch CustomerInfo → sync to MMKV.
4. Attach CustomerInfo listener for the session.

### Paywall (visual UI unchanged)

1. Hook loads offerings via use case → packages + localized price strings.
2. Plan cards keep monetization copy; prices prefer RC package price, fall back to `MONETIZATION_PRICING`.
3. Purchase → `PurchasePackageUseCase` → sync → gates unlock.
4. Restore → `RestorePurchasesUseCase` → sync.

### Gates

- Existing `isPremium` / access hooks and premium feature gates stay as consumers of `ISubscriptionRepository`.
- No change to free-forever rules (Day widget, Year widget, Share).

### Analytics

- Keep existing purchase / paywall events.
- Prefer `payment_provider: 'revenuecat'` (or store name from RC when available) instead of hard-coded `google_play`.

## Error handling

| Case | Behavior |
|------|----------|
| User cancels | Soft dismiss; analytics failure with cancel code; no error toast |
| Network / store error | Short message; paywall stays open |
| Empty offerings | Fallback prices from config; purchase disabled until offerings load / retry |
| Bad API key | Debug log; UI fails soft |

## Migration

- Existing Play subscribers: after Play app is linked and products imported in RC, first `getCustomerInfo` / restore should grant `premium`.
- Do not revoke premium solely because Play client verify is removed.
- License users unchanged.

## Testing

1. SDK configures (native log: Purchases is configured).
2. Offerings non-empty (Test Store or Play).
3. Sandbox purchase → premium true → gates unlock.
4. Kill / relaunch → still premium.
5. Restore on fresh install (same store account and/or after `logIn`).
6. Sign-in → `logIn`; sign-out → anonymous; license alone still grants premium.
7. iOS configures without crash when App Store products are not live yet.

## Out of scope

- Shipping RevenueCat remote Paywalls UI (seam only).
- Full App Store Connect product creation (unless already done).
- Deleting website `verify-purchase` API.
- Changing monetization ethics (48h cooldown, trial reminders, free forever).

## File touch map (expected)

| Area | Change |
|------|--------|
| `package.json` | Add `react-native-purchases`; remove `react-native-iap` |
| `src/domain/repository/` | Add `IPurchasesRepository`; remove Play billing port |
| `src/infrastructure/` | Add RC adapter; remove Play billing repos |
| `src/domain/useCases/` | Purchase / restore / sync / identify; retire ApplyStorePurchase Play-verify path |
| `src/hooks/usePurchase.ts`, paywall body | Offerings + packages instead of product ID lists |
| `src/di.ts`, `src/app.tsx` | Configure, session, listeners |
| Auth use cases / adapters | `logIn` / `logOut` |
| `src/config/` | RC key helpers; keep billing product ID constants for mapping |
| Docs | Update `PLAY_BILLING.md` / monetization setup companions in implementation plan |

## Success criteria

- Custom paywall purchases and restores work through RevenueCat on Android.
- Premium gates and license path behave as specified.
- Firebase identity linked to RC after sign-in.
- iOS builds with RC configured.
- No `react-native-iap` in the dependency tree after cutover.
- Architecture ready for a later `IPaywallPresenter` / RC UI paywall without rewriting entitlement gates.
