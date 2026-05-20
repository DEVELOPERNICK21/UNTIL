# Google Play Premium (yearly + lifetime)

UNTIL Premium on Android offers two purchase options:

| Plan | Product ID | Play Console type |
|------|------------|-------------------|
| **Yearly** | `yearly_subscription` | Subscription (yearly) — **₹499** |
| **Monthly** | `monthly_subscription` | Subscription (monthly) — **₹99** |
| **Lifetime** | `lifetime_unlock` | One-time — **₹1,499** |
| **Student yearly** (optional) | `yearly_subscription_student` | Subscription (yearly) — **₹249** |

Product IDs are in `src/config/billing.ts` and **must match Play Console exactly**. Regional prices are set in Play Console; the app displays localized amounts from Google.

---

## Play Console setup

### 1. Payments profile

1. [Google Play Console](https://play.google.com/console) → your app.
2. **Monetize** → complete **Payments profile** (merchant, tax, bank).

### 2. Yearly subscription

**Monetize → Products → Subscriptions → Create subscription**

1. **Product ID:** `yearly_subscription`
2. Name/description for the store purchase UI.
3. **Base plan:** billing period **Yearly**, set price **₹499** (required — matches app fallbacks).
4. **Activate** the base plan (status **Active**).

### 3. Lifetime one-time product

**Monetize → Products → In-app products → Create product**

1. **Product ID:** `lifetime_unlock`
2. Type: **One-time** (managed product / non-consumable).
3. Set price **₹1,499** (≥3× yearly so ₹499/year stays the rational choice).
4. **Activate** the product.

You do **not** need to create `monthly_subscription` unless you already had it for early testers.

### 4. Internal testing build

1. `npm run android:release-aab`
2. **Testing → Internal testing** → upload AAB → add testers → install via opt-in link.

### 5. License testers

**Settings → License testing** → add Gmail accounts for test purchases without real charges.

### 6. Store listing

- Privacy policy URL.
- Describe Premium benefits (widgets, Life, overlay, etc.).
- Yearly: users cancel via **Google Play → Payments & subscriptions**.

---

## Test checklist

1. Install from **Internal testing** with a license tester account.
2. **Settings → Premium** → **Yearly** and **Lifetime** show Play prices (not only fallbacks ₹499 / ₹999).
3. Buy **Lifetime** (test) → Premium unlocks, no renewal.
4. Buy **Yearly** (test) → Premium unlocks; cancel in Play → after period ends, premium clears (reconcile ~12h).
5. **Restore purchases** after reinstall → Premium returns.

---

## Suggested pricing (India)

| Plan | Example | Notes |
|------|---------|--------|
| Yearly | **₹499** | Primary revenue |
| Lifetime | **₹1,499** | Decoy + high ARPU (3× yearly) |

Set final prices in Play Console.

---

## Code map

| File | Role |
|------|------|
| `src/config/billing.ts` | Product IDs + paywall list |
| `src/surfaces/app/PremiumScreen.tsx` | Paywall UI |
| `src/infrastructure/repositories/PlayBillingRepository.ts` | Billing API |
| `src/domain/useCases/ReconcilePlayEntitlementUseCase.ts` | Expired **yearly** subs only (not lifetime) |

---

## Ship

Include billing changes in your release AAB, upload to Internal testing first, then Production when purchases work.
