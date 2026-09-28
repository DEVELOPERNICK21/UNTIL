# Monetization setup guide

Companion to `MONETIZATION_STRATEGY.md` and `PLAY_BILLING.md`.

## RevenueCat

Store purchases (offerings, buy, restore, entitlement sync) go through RevenueCat. Custom paywall UI remains for **Settings → Premium**.

**First-offer screens** (onboarding, deferred modal, trial ending) use RevenueCat Paywalls UI (`react-native-purchases-ui`). If the RC paywall is missing or fails, the app falls back to the custom paywall / Premium screen.

| Item | Value |
|------|-------|
| Entitlement | `premium` |
| Offering | `default` (current offering) |
| Product IDs | `weekly_subscription`, `yearly_subscription`, `monthly_subscription`, `lifetime_unlock`, optional `yearly_subscription_student` |
| First-offer paywall | Dashboard paywall attached to `default` (publish in RC before release) |
| Main paywall | Custom `PremiumPaywallBody` · 3 cards (yearly · monthly · weekly); lifetime secondary; student behind verify |

Public SDK keys (never secret keys):

| Build | iOS | Android |
|-------|-----|---------|
| Release / TestFlight / store | `appl_…` | `goog_…` |
| Local `__DEV__` simulated IAP only | `test_…` | `test_…` |

**Never** ship a `test_` key in a release binary. RevenueCat asserts and kills the process (`checkForSimulatedStoreAPIKeyInRelease`).

```
REVENUECAT_API_KEY_IOS=
REVENUECAT_API_KEY_ANDROID=
```

Copy from `.env.example` into `.env`. Rebuild after changing keys (env is inlined at bundle time).

Dashboard: attach the Play / App Store products above to packages on offering `default`, grant entitlement `premium`, and **publish** the first-offer paywall for that offering.

## Play Console products

| Product ID | Type | Price (INR) |
|------------|------|-------------|
| `weekly_subscription` | Subscription (weekly) | ₹49 |
| `monthly_subscription` | Subscription (monthly) | ₹149 |
| `yearly_subscription` | Subscription (yearly) | ₹499 |
| `lifetime_unlock` | One-time | ₹1,999 |
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

- Paywall cards: weekly + monthly + yearly (lifetime secondary, student behind verify)
- Onboarding: life weeks → Premium offer screen
- Trial in-app modals + scheduled local notifications (days 10, 13, 14)
- Widget picker gate for month/life
- Overlay / Dynamic Island premium lock
- Life unlock ended modal
