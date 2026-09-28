# Google Play Premium (subscriptions + lifetime)

**Superseded:** In-app purchases go through RevenueCat (`react-native-purchases`), not `react-native-iap`. Product IDs below stay the same in Play Console. See [MONETIZATION_SETUP.md](./MONETIZATION_SETUP.md) for RC keys, the `premium` entitlement, and the `default` offering.

| Plan | Product ID | Play Console type |
|------|------------|-------------------|
| **Weekly** | `weekly_subscription` | Subscription (weekly) — **₹49** |
| **Monthly** | `monthly_subscription` | Subscription (monthly) — **₹149** |
| **Yearly** | `yearly_subscription` | Subscription (yearly) — **₹499** |
| **Lifetime** | `lifetime_unlock` | One-time — **₹1,999** |
| **Student yearly** (optional) | `yearly_subscription_student` | Subscription (yearly) — **₹249** |

Product IDs are in `src/config/billing.ts` and **must match Play Console exactly**. Regional prices are set in Play Console; the app displays localized amounts from Google.

**Paywall:** 3 cards (yearly · monthly · weekly). Lifetime is a secondary CTA; student stays behind email verify.

---

## Play Console setup

### 1. Payments profile

1. [Google Play Console](https://play.google.com/console) → your app.
2. **Monetize** → complete **Payments profile** (merchant, tax, bank).

### 2. Subscriptions

**Monetize → Products → Subscriptions → Create subscription** (or edit base-plan price)

| Product ID | Base plan period | Price (INR) |
|------------|------------------|-------------|
| `weekly_subscription` | Weekly | ₹49 |
| `monthly_subscription` | Monthly | ₹149 |
| `yearly_subscription` | Yearly | ₹499 |
| `yearly_subscription_student` (optional) | Yearly | ₹249 |

For each:

1. Name/description for the store purchase UI.
2. **Do not add a Play “free trial” offer** unless you also update app copy — UNTIL’s 5-day offer is an **in-app preview** (no Google charge).
3. **Activate** the base plan (status **Active**).

### 3. Lifetime one-time product

**Monetize → Products → In-app products → Create product** (or edit price)

1. **Product ID:** `lifetime_unlock`
2. Type: **One-time** (managed product / non-consumable).
3. Set price **₹1,999** (≥3× yearly so ₹499/year stays the rational choice).
4. **Activate** the product.

### 4. Internal testing build

1. `npm run android:release-aab`
2. **Testing → Internal testing** → upload AAB → add testers → install via opt-in link.

### 5. License testers

**Settings → License testing** → add Gmail accounts for test purchases without real charges.

### 6. Store listing

- Privacy policy URL.
- Describe Premium benefits (widgets, Life, overlay, etc.).
- Subscriptions: users cancel via **Google Play → Payments & subscriptions**.

---

## Test checklist

1. Install from **Internal testing** with a license tester account.
2. **Settings → Premium** → Yearly / Monthly / Weekly show Play prices (not only fallbacks).
3. Buy **Lifetime** (test) → Premium unlocks, no renewal.
4. Buy **Yearly** (test) → Premium unlocks; cancel in Play → after period ends, premium clears (reconcile ~12h).
5. **Restore purchases** after reinstall → Premium returns.

---

## Suggested pricing (India)

| Plan | Price | Notes |
|------|-------|--------|
| Weekly | **₹49** | Low-risk try |
| Monthly | **₹149** | Flexible |
| Yearly | **₹499** | Primary / best value |
| Lifetime | **₹1,999** | Decoy + high ARPU |
| Student yearly | **₹249** | Keep accessible |

Set final prices in Play Console.

---

## Code map

| File | Role |
|------|------|
| `src/config/billing.ts` | Product IDs + paywall list |
| `src/config/revenueCat.ts` | Public SDK keys |
| `src/infrastructure/repositories/RevenueCatPurchasesRepository.ts` | Purchase / restore / offerings |
| `src/config/monetization.ts` | Fallback INR + paywall copy |
| `src/components/premium/PremiumPaywallBody.tsx` | Custom paywall UI |
