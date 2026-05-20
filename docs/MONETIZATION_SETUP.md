# Monetization setup guide

Companion to `MONETIZATION_STRATEGY.md` and `PLAY_BILLING.md`.

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

## Server purchase verification

1. Deploy website with `website/src/app/api/verify-purchase/route.ts`.
2. Set Vercel env:
   - `UNTIL_VERIFY_API_SECRET` — random string; same value in app env `UNTIL_VERIFY_API_SECRET`
   - `GOOGLE_PLAY_PACKAGE_NAME` — `app.until.time`
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` — service account JSON (Play Console → API access)
3. App calls verify on each purchase before granting Premium.

Without `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, API returns `valid: true, serverVerified: false` (client trust mode for dev).

## Optional app env

```
UNTIL_VERIFY_PURCHASE_URL=https://your-domain.com/api/verify-purchase
UNTIL_VERIFY_API_SECRET=your-secret
```

## Implemented app features

- Monthly + yearly + lifetime + student on paywall
- Onboarding: life weeks → Premium offer screen
- Trial in-app modals + scheduled local notifications (days 10, 13, 14)
- Widget picker gate for month/life
- Overlay / Dynamic Island premium lock
- Life unlock ended modal
