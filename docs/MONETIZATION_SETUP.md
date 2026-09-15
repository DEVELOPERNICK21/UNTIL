# Monetization setup guide

Companion to `MONETIZATION_STRATEGY.md` and `PLAY_BILLING.md`.

## RevenueCat

Store purchases (offerings, buy, restore, entitlement sync) go through RevenueCat. Custom paywall UI is unchanged.

| Item | Value |
|------|-------|
| Entitlement | `premium` |
| Offering | `default` (current offering) |
| Product IDs | Unchanged: `yearly_subscription`, `monthly_subscription`, `lifetime_unlock`, optional `yearly_subscription_student` |

Public SDK keys (never secret keys). For Test Store, set both to the same `test_` key:

```
REVENUECAT_API_KEY_IOS=
REVENUECAT_API_KEY_ANDROID=
```

Copy from `.env.example` into `.env`. Rebuild after changing keys.

Dashboard: attach the Play / App Store products above to packages on offering `default`, and grant entitlement `premium`.

## Play Console products

| Product ID | Type | Price (INR) |
|------------|------|-------------|
| `yearly_subscription` | Subscription (yearly) | ₹499 |
| `monthly_subscription` | Subscription (monthly) | ₹99 |
| `lifetime_unlock` | One-time | ₹1,499 |
| `yearly_subscription_student` | Subscription (yearly) | ₹249 (optional) |

Regional pricing: set in Play Console → Product → Pricing (e.g. ₹399/year tier-2). The app shows localized prices from Play automatically.

## App install after pulling this branch

```bash
yarn install
cd ios && pod install && cd ..
```

`@notifee/react-native` powers trial reminder local notifications (days 10, 13, 14). Android `POST_NOTIFICATIONS` is already in the manifest.

## Server purchase verification (unused by the app)

The website `POST /api/verify-purchase` route and `PlayPurchaseVerificationServiceAdapter` remain on disk. The app purchase path does **not** call them. RevenueCat is the store grant path.

Keep the API only if you still need it for tooling or a later server check. Env vars `UNTIL_VERIFY_PURCHASE_URL` and `UNTIL_VERIFY_API_SECRET` are unused by the current purchase flow.

## Implemented app features

- Monthly + yearly + lifetime + student on paywall
- Onboarding: life weeks → Premium offer screen
- Trial in-app modals + scheduled local notifications (days 10, 13, 14)
- Widget picker gate for month/life
- Overlay / Dynamic Island premium lock
- Life unlock ended modal
