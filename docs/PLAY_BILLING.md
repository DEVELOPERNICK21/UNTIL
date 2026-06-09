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
4. **Do not add a Play “free trial” offer** unless you also update app copy and offer selection — UNTIL’s 5-day offer is an **in-app preview** (no Google charge). The paywall must not promise a billing trial that the Google payment sheet does not show.
5. **Activate** the base plan (status **Active**).

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

## Google Play Subscriptions policy (trial clarity)

Reviewers compare **in-app subscription copy** with the **Google Play payment sheet**.

| What users see | Requirement |
|----------------|-------------|
| In-app yearly button | Must not say “Start free trial” if Play charges **today** at the yearly price. |
| Google payment sheet | Must list trial length, price after trial, and cancellation — **only if** you configure a Play free trial / intro offer. |
| In-app preview | UNTIL’s 5-day preview is **not** a Play subscription trial; label it “free app preview” and state that subscribing bills through Google Play immediately. |

If you later add a **Play free trial** in Play Console on `yearly_subscription`, you must:

1. Create an **offer** with free trial on the yearly base plan and activate it.
2. Update `PlayBillingRepository` to select that offer token (not only the base plan).
3. Restore paywall copy to describe the **Play** trial terms (must match the payment sheet exactly).

Until then, keep paywall copy in `src/config/monetization.ts` aligned with immediate yearly billing.

---

## Trial preview API (anti-reset)

Deploy `POST /api/trial-preview` on the website (Vercel) before or with the app build that syncs preview start.

| Env | Purpose |
|-----|---------|
| `UNTIL_TRIAL_API_SECRET` or `UNTIL_VERIFY_API_SECRET` | Bearer auth from app |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV (or Upstash REST vars) |
| `UNTIL_TRIAL_PREVIEW_DAYS` | Default `5` (match `MONETIZATION_TRIAL_DAYS`) |
| `UNTIL_TRIAL_SALT` | Optional hash salt for stored device keys |

App env (optional overrides):

- `UNTIL_TRIAL_PREVIEW_URL` — defaults to production website `/api/trial-preview`
- `UNTIL_TRIAL_API_SECRET` — same Bearer as server

---

## Ship

Include billing changes in your release AAB, upload to Internal testing first, then Production when purchases work.
