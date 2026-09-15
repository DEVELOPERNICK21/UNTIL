# RevenueCat Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-09-15-revenuecat-integration-design.md`

**Goal:** Replace `react-native-iap` Play Billing with RevenueCat for offerings, purchase, restore, and store entitlement sync, while keeping custom paywalls, license-key OR premium, and Firebase UID identity.

**Architecture:** New `IPurchasesRepository` port + `RevenueCatPurchasesRepository` adapter. Use cases own purchase/restore/sync/identify. `SyncCustomerInfoUseCase` writes RC `premium` → MMKV without clearing license-backed premium. Surfaces keep using hooks; no direct `react-native-purchases` imports outside infrastructure/`di`.

**Tech Stack:** React Native 0.86 (bare), `react-native-purchases`, existing MMKV subscription SSOT, Firebase Auth, Jest for pure helpers/use cases, RevenueCat MCP for dashboard bootstrap.

## Global Constraints

- Layer rules: surfaces → hooks/di/ui/theme/types; infrastructure owns `react-native-purchases`
- Entitlement id: `premium`
- Product IDs (must match stores): `monthly_subscription`, `yearly_subscription`, `lifetime_unlock`, `yearly_subscription_student`
- Package ids: `$rc_monthly`, `$rc_annual`, `$rc_lifetime`, custom `student_yearly`
- Offering lookup key: `default`
- Android package: `app.until.time`; iOS bundle: `com.develoeprnick.UNTIL`
- Public SDK keys only via env (`REVENUECAT_API_KEY_IOS`, `REVENUECAT_API_KEY_ANDROID`); never secret keys in client
- Premium = RC `premium` active **OR** valid license (sync must OR with license)
- Human-copy rules for any user-facing strings touched
- Out of scope: remote RC Paywalls UI, deleting website verify-purchase API, App Store Connect product creation

## File map

| File | Responsibility |
|------|----------------|
| `src/types/purchases.ts` | Domain DTOs: offerings, packages, customer info (no RC SDK types) |
| `src/types/index.ts` | Re-export purchases types |
| `src/config/revenueCat.ts` | Platform public API key + entitlement id constants |
| `src/config/billing.ts` | Keep product ID constants for mapping |
| `src/domain/billing/mapProductId.ts` | Product id → `PurchaseType` (unchanged logic) |
| `src/domain/billing/mapCustomerInfo.ts` | Pure: CustomerInfoDTO → sync plan (premium, purchase fields, license OR) |
| `src/domain/repository/IPurchasesRepository.ts` | Port: configure, offerings, purchase, restore, customerInfo, listener, logIn/logOut |
| `src/domain/repository/IPaywallPresenter.ts` | Optional seam (no-op) for later RC UI |
| `src/domain/useCases/SyncCustomerInfoUseCase.ts` | Apply sync plan to `ISubscriptionRepository` |
| `src/domain/useCases/GetOfferingsUseCase.ts` | Fetch current offering packages |
| `src/domain/useCases/PurchasePackageUseCase.ts` | Purchase by product id / package id → sync |
| `src/domain/useCases/RestorePurchasesUseCase.ts` | Rewrite to RC restore → sync |
| `src/domain/useCases/IdentifyPurchasesUserUseCase.ts` | `logIn(uid)` → sync |
| `src/domain/useCases/ResetPurchasesUserUseCase.ts` | `logOut()` → sync (license-safe) |
| `src/domain/useCases/ConfigurePurchasesUseCase.ts` | One-shot configure + debug log level |
| `src/domain/useCases/VerifySubscriptionUseCase.ts` | Fix: do not wipe store fields / RC premium when license missing or invalid |
| `src/domain/useCases/CompleteAccountSignInUseCase.ts` | Call identify after session uid set |
| `src/domain/useCases/SignOutUseCase.ts` | Call reset purchases user |
| `src/infrastructure/repositories/RevenueCatPurchasesRepository.ts` | SDK adapter |
| `src/infrastructure/repositories/NoOpPaywallPresenter.ts` | No-op presenter |
| `src/di.ts` | Wire RC; remove Play Billing wiring |
| `src/app.tsx` | Configure + initial sync + listener; remove Play reconcile |
| `src/hooks/usePurchase.ts` | Offerings-based API for paywall |
| `src/hooks/useAuthBootstrap.ts` (or auth path) | Ensure cold-start identify if signed in |
| `src/components/premium/PremiumPaywallBody.tsx` | Load offerings on both platforms; await purchase success |
| `.env.example` | Document RC key env vars |
| `docs/PLAY_BILLING.md` / `docs/MONETIZATION_SETUP.md` | Point to RevenueCat |
| `__tests__/mapCustomerInfo.test.ts` | Pure sync mapping |
| `__tests__/verifySubscriptionLicenseOrStore.test.ts` | License OR store behavior |
| Delete | `IPlayBillingRepository`, `PlayBillingRepository`, `NoOpPlayBillingRepository`, `ApplyStorePurchaseUseCase` (or gut), `ReconcilePlayEntitlementUseCase`, `playEntitlementReconcile.ts`, Play verify usage from purchase path |

---

### Task 1: RevenueCat dashboard bootstrap (UNTIL project)

**Files:**
- No app code (dashboard via RevenueCat MCP)
- After keys exist: note them for Task 5 `.env` (do not commit keys)

**Interfaces:**
- Produces: project id, test_store app id, public SDK key(s), entitlement `premium`, offering `default` with packages

- [ ] **Step 1: Create project**

Call MCP `create-project` with `body: { name: "UNTIL" }`. Store `project_id`.

- [ ] **Step 2: List apps and locate Test Store**

Call `list-apps` with `project_id`. Note the `test_store` app id (always present).

- [ ] **Step 3: Create entitlement**

Call `create-entitlement` with lookup_key / identifier `premium` and display name `Premium`.

- [ ] **Step 4: Create Test Store products + prices**

For each product on the **test_store** app via `create-product` (+ `create-product-prices` for test store):

| store_identifier | type | approx price |
|------------------|------|--------------|
| `monthly_subscription` | subscription | 100 INR / month |
| `yearly_subscription` | subscription | 500 INR / year |
| `lifetime_unlock` | one-time | 1500 INR |
| `yearly_subscription_student` | subscription | 500 INR / year |

Use MCP schemas exactly (field names from tool descriptors). If Play/App Store apps are not credentialed yet, Test Store is enough for SDK testing.

- [ ] **Step 5: Attach products to entitlement**

Call `attach-products-to-entitlement` for `premium` with all four product ids.

- [ ] **Step 6: Create offering + packages**

1. `create-offering` lookup_key `default` (make current if API supports).
2. `create-packages` for `$rc_monthly`, `$rc_annual`, `$rc_lifetime`, `student_yearly`.
3. `attach-products-to-package` mapping each package → matching product.

- [ ] **Step 7: Fetch public API keys**

Call `list-app-public-api-keys` for the test_store app (and for play_store / app_store if you create those apps). Save keys locally for `.env` — do not commit.

Optional same task: `create-app` type `play_store` with package `app.until.time` and type `app_store` with bundle `com.develoeprnick.UNTIL` if the user confirms store apps exist; otherwise skip and stay on Test Store.

- [ ] **Step 8: Commit**

No code commit required if dashboard-only. If you add a short note file under `docs/` with project id (no keys), commit that; otherwise skip.

---

### Task 2: Pure CustomerInfo → MMKV sync mapping (TDD)

**Files:**
- Create: `src/types/purchases.ts`
- Modify: `src/types/index.ts` (re-export)
- Create: `src/domain/billing/mapCustomerInfo.ts`
- Create: `__tests__/mapCustomerInfo.test.ts`

**Interfaces:**
- Produces:
```typescript
// src/types/purchases.ts
export type PurchasesPackageDTO = {
  identifier: string; // e.g. $rc_annual
  productId: string;
  title: string;
  description: string;
  priceString: string;
};

export type PurchasesOfferingDTO = {
  identifier: string;
  packages: PurchasesPackageDTO[];
};

export type ActiveEntitlementDTO = {
  identifier: string;
  productIdentifier: string;
  latestPurchaseDateMs: number | null;
  expirationDateMs: number | null;
  willRenew: boolean;
};

export type CustomerInfoDTO = {
  activeEntitlements: ActiveEntitlementDTO[];
  allPurchasedProductIds: string[];
};

export type CustomerInfoSyncPlan = {
  setIsPremium: boolean;
  purchaseType: 'monthly' | 'yearly' | 'lifetime' | null;
  purchaseDateMs: number | null;
  clearStorePurchaseFields: boolean;
};
```

```typescript
// src/domain/billing/mapCustomerInfo.ts
export const PREMIUM_ENTITLEMENT_ID = 'premium';

export function mapCustomerInfoToSyncPlan(
  info: CustomerInfoDTO,
  opts: { hasLicenseKey: boolean }
): CustomerInfoSyncPlan;
```

- Consumes: `productIdToPurchaseType` from `src/domain/billing/mapProductId.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/mapCustomerInfo.test.ts
import { mapCustomerInfoToSyncPlan } from '../src/domain/billing/mapCustomerInfo';

describe('mapCustomerInfoToSyncPlan', () => {
  it('grants premium when premium entitlement active', () => {
    const plan = mapCustomerInfoToSyncPlan(
      {
        activeEntitlements: [
          {
            identifier: 'premium',
            productIdentifier: 'yearly_subscription',
            latestPurchaseDateMs: 1_000,
            expirationDateMs: null,
            willRenew: true,
          },
        ],
        allPurchasedProductIds: ['yearly_subscription'],
      },
      { hasLicenseKey: false }
    );
    expect(plan.setIsPremium).toBe(true);
    expect(plan.purchaseType).toBe('yearly');
    expect(plan.purchaseDateMs).toBe(1_000);
    expect(plan.clearStorePurchaseFields).toBe(false);
  });

  it('maps lifetime product', () => {
    const plan = mapCustomerInfoToSyncPlan(
      {
        activeEntitlements: [
          {
            identifier: 'premium',
            productIdentifier: 'lifetime_unlock',
            latestPurchaseDateMs: 2_000,
            expirationDateMs: null,
            willRenew: false,
          },
        ],
        allPurchasedProductIds: ['lifetime_unlock'],
      },
      { hasLicenseKey: false }
    );
    expect(plan.purchaseType).toBe('lifetime');
  });

  it('clears store fields and premium when no entitlement and no license', () => {
    const plan = mapCustomerInfoToSyncPlan(
      { activeEntitlements: [], allPurchasedProductIds: [] },
      { hasLicenseKey: false }
    );
    expect(plan.setIsPremium).toBe(false);
    expect(plan.purchaseType).toBe(null);
    expect(plan.clearStorePurchaseFields).toBe(true);
  });

  it('clears store fields but keeps premium true when license present', () => {
    const plan = mapCustomerInfoToSyncPlan(
      { activeEntitlements: [], allPurchasedProductIds: [] },
      { hasLicenseKey: true }
    );
    expect(plan.setIsPremium).toBe(true);
    expect(plan.clearStorePurchaseFields).toBe(true);
    expect(plan.purchaseType).toBe(null);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `yarn test __tests__/mapCustomerInfo.test.ts -v`  
Expected: FAIL (module not found / function undefined)

- [ ] **Step 3: Implement types + mapper**

Implement `mapCustomerInfoToSyncPlan`:
- Find entitlement where `identifier === 'premium'`
- If found: `setIsPremium: true`, map product via `productIdToPurchaseType`, `purchaseDateMs` from `latestPurchaseDateMs`, `clearStorePurchaseFields: false`
- If not found and `hasLicenseKey`: `setIsPremium: true`, `purchaseType: null`, `clearStorePurchaseFields: true`
- If not found and no license: `setIsPremium: false`, `purchaseType: null`, `clearStorePurchaseFields: true`

Re-export types from `src/types/index.ts`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `yarn test __tests__/mapCustomerInfo.test.ts -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/purchases.ts src/types/index.ts src/domain/billing/mapCustomerInfo.ts __tests__/mapCustomerInfo.test.ts
git commit -m "$(cat <<'EOF'
feat(billing): add RevenueCat customer info sync mapping

Pure mapper keeps license-backed premium when store entitlement is absent.
EOF
)"
```

---

### Task 3: Purchases port + SyncCustomerInfoUseCase

**Files:**
- Create: `src/domain/repository/IPurchasesRepository.ts`
- Create: `src/domain/repository/IPaywallPresenter.ts`
- Create: `src/domain/useCases/SyncCustomerInfoUseCase.ts`
- Modify: `src/domain/repository/index.ts` (export new ports)
- Create: `__tests__/syncCustomerInfoUseCase.test.ts`

**Interfaces:**
- Produces:
```typescript
export interface IPurchasesRepository {
  configure(apiKey: string): void;
  setDebugLogs(enabled: boolean): void;
  getOfferings(): Promise<PurchasesOfferingDTO | null>;
  purchaseProductId(productId: string): Promise<CustomerInfoDTO>;
  restorePurchases(): Promise<CustomerInfoDTO>;
  getCustomerInfo(): Promise<CustomerInfoDTO>;
  addCustomerInfoListener(listener: (info: CustomerInfoDTO) => void): () => void;
  logIn(appUserId: string): Promise<CustomerInfoDTO>;
  logOut(): Promise<CustomerInfoDTO>;
}

export interface IPaywallPresenter {
  /** Reserved for react-native-purchases-ui; no-op in this plan. */
  presentIfNeeded(): Promise<'purchased' | 'restored' | 'cancelled' | 'not_presented'>;
}

export class SyncCustomerInfoUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly onApplied?: () => void
  ) {}
  execute(info: CustomerInfoDTO): void;
}
```

- [ ] **Step 1: Write failing SyncCustomerInfo test with fake subscription repo**

```typescript
// __tests__/syncCustomerInfoUseCase.test.ts
import { SyncCustomerInfoUseCase } from '../src/domain/useCases/SyncCustomerInfoUseCase';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';
import type { PurchaseType, SubscriptionState } from '../src/types';

function fakeSub(seed: Partial<{
  isPremium: boolean;
  licenseKey: string | null;
  purchaseType: PurchaseType | null;
}> = {}): ISubscriptionRepository & { state: any } {
  const state = {
    isPremium: seed.isPremium ?? false,
    licenseKey: seed.licenseKey ?? null,
    purchaseType: seed.purchaseType ?? null,
    purchaseDate: null as number | null,
    purchaseToken: null as string | null,
  };
  return {
    state,
    getIsPremium: () => state.isPremium,
    setIsPremium: v => { state.isPremium = v; },
    getLicenseKey: () => state.licenseKey,
    setLicenseKey: k => { state.licenseKey = k; },
    getDeviceId: () => null,
    setDeviceId: () => {},
    getLastVerifiedAt: () => null,
    setLastVerifiedAt: () => {},
    getPurchaseType: () => state.purchaseType,
    setPurchaseType: v => { state.purchaseType = v; },
    getPurchaseDate: () => state.purchaseDate,
    setPurchaseDate: v => { state.purchaseDate = v; },
    getPurchaseToken: () => state.purchaseToken,
    setPurchaseToken: v => { state.purchaseToken = v; },
    getTrialStartDate: () => null,
    setTrialStartDate: () => {},
    getAppOpenCount: () => 0,
    setAppOpenCount: () => {},
    incrementAppOpenCount: () => 0,
    getLifeScreenViewed: () => false,
    setLifeScreenViewed: () => {},
    getLifeUnlockUntil: () => null,
    setLifeUnlockUntil: () => {},
    getState: () => ({}) as SubscriptionState,
    subscribe: () => () => {},
  };
}

describe('SyncCustomerInfoUseCase', () => {
  it('sets premium from entitlement', () => {
    const sub = fakeSub();
    const uc = new SyncCustomerInfoUseCase(sub);
    uc.execute({
      activeEntitlements: [{
        identifier: 'premium',
        productIdentifier: 'monthly_subscription',
        latestPurchaseDateMs: 50,
        expirationDateMs: null,
        willRenew: true,
      }],
      allPurchasedProductIds: ['monthly_subscription'],
    });
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe('monthly');
  });

  it('does not clear premium when license exists and RC empty', () => {
    const sub = fakeSub({ isPremium: true, licenseKey: 'KEY' });
    const uc = new SyncCustomerInfoUseCase(sub);
    uc.execute({ activeEntitlements: [], allPurchasedProductIds: [] });
    expect(sub.getIsPremium()).toBe(true);
    expect(sub.getPurchaseType()).toBe(null);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `yarn test __tests__/syncCustomerInfoUseCase.test.ts -v`

- [ ] **Step 3: Implement port interfaces + SyncCustomerInfoUseCase**

```typescript
execute(info: CustomerInfoDTO): void {
  const plan = mapCustomerInfoToSyncPlan(info, {
    hasLicenseKey: Boolean(this.subscriptionRepository.getLicenseKey()?.trim()),
  });
  this.subscriptionRepository.setIsPremium(plan.setIsPremium);
  if (plan.clearStorePurchaseFields) {
    this.subscriptionRepository.setPurchaseType(null);
    this.subscriptionRepository.setPurchaseDate(null);
    this.subscriptionRepository.setPurchaseToken(null);
  } else {
    this.subscriptionRepository.setPurchaseType(plan.purchaseType);
    if (plan.purchaseDateMs != null) {
      this.subscriptionRepository.setPurchaseDate(plan.purchaseDateMs);
    }
  }
  this.onApplied?.();
}
```

Add empty `IPaywallPresenter` interface file.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/repository/IPurchasesRepository.ts src/domain/repository/IPaywallPresenter.ts src/domain/repository/index.ts src/domain/useCases/SyncCustomerInfoUseCase.ts __tests__/syncCustomerInfoUseCase.test.ts
git commit -m "$(cat <<'EOF'
feat(billing): add purchases port and CustomerInfo sync use case
EOF
)"
```

---

### Task 4: Fix VerifySubscriptionUseCase for license OR store

**Files:**
- Modify: `src/domain/useCases/VerifySubscriptionUseCase.ts`
- Create: `__tests__/verifySubscriptionLicenseOrStore.test.ts`

**Interfaces:**
- Consumes: existing `ISubscriptionRepository`
- Behavior change:
  - No license + `purchaseType != null` → `{ valid: true }` (unchanged)
  - No license + `isPremium` from prior RC sync with purchaseType → keep
  - No license + no purchaseType → do **not** force `isPremium` false if we are about to sync RC; safe rule: only clear premium when `purchaseType == null` **and** no license (same as today) — RC sync owns store premium. Keep this, but **never** clear `purchaseType` / token when revoking a bad **license**.

- [ ] **Step 1: Write failing tests with fake repos**

Cover:
1. Invalid license revoke clears license fields but **keeps** `purchaseType` / `isPremium` if store purchase present.
2. No license + purchaseType → valid true, does not clear premium.

- [ ] **Step 2: Run — expect FAIL** (current `revokePremium` clears store fields)

- [ ] **Step 3: Implement**

Split revoke:
```typescript
private revokeLicenseOnly(): void {
  this.subscriptionRepository.setLicenseKey(null);
  this.subscriptionRepository.setDeviceId(null);
  this.subscriptionRepository.setLastVerifiedAt(0);
  const hasStore = this.subscriptionRepository.getPurchaseType() != null;
  if (!hasStore) {
    this.subscriptionRepository.setIsPremium(false);
  }
}
```

Use `revokeLicenseOnly` on failed license verify (not network-grace). Keep network grace path unchanged.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/useCases/VerifySubscriptionUseCase.ts __tests__/verifySubscriptionLicenseOrStore.test.ts
git commit -m "$(cat <<'EOF'
fix(billing): keep store premium when license verify fails
EOF
)"
```

---

### Task 5: Config + RevenueCat adapter + configure use case

**Files:**
- Create: `src/config/revenueCat.ts`
- Create: `src/infrastructure/repositories/RevenueCatPurchasesRepository.ts`
- Create: `src/infrastructure/repositories/NoOpPaywallPresenter.ts`
- Create: `src/domain/useCases/ConfigurePurchasesUseCase.ts`
- Modify: `.env.example`
- Modify: `package.json` (add dependency)

**Interfaces:**
- Consumes: `IPurchasesRepository`
- Produces: working adapter mapping SDK ↔ DTOs

- [ ] **Step 1: Install SDK**

```bash
yarn add react-native-purchases
cd ios && pod install && cd ..
```

- [ ] **Step 2: Add config**

```typescript
// src/config/revenueCat.ts
import { Platform } from 'react-native';

export const REVENUECAT_ENTITLEMENT_PREMIUM = 'premium';

export function getRevenueCatApiKey(): string {
  const key =
    Platform.OS === 'ios'
      ? process.env.REVENUECAT_API_KEY_IOS
      : process.env.REVENUECAT_API_KEY_ANDROID;
  return (key ?? '').trim();
}
```

Update `.env.example`:
```
REVENUECAT_API_KEY_IOS=
REVENUECAT_API_KEY_ANDROID=
```

- [ ] **Step 3: Implement RevenueCatPurchasesRepository**

Map:
- `Purchases.configure({ apiKey })`
- `Purchases.setLogLevel(LOG_LEVEL.DEBUG)` when enabled
- `getOfferings()` → current offering packages (`availablePackages`) → `PurchasesOfferingDTO`
- `purchaseProductId`: find package whose `product.identifier === productId` across current offering (and fallback search), then `Purchases.purchasePackage(pkg)` → map `CustomerInfo`
- `restorePurchases` → `Purchases.restorePurchases()`
- `getCustomerInfo` → `Purchases.getCustomerInfo()`
- Listener: `Purchases.addCustomerInfoUpdateListener`
- `logIn` / `logOut`

CustomerInfo mapping helper (private in adapter):
```typescript
function toDTO(info: CustomerInfo): CustomerInfoDTO {
  const active = Object.entries(info.entitlements.active).map(([id, e]) => ({
    identifier: id,
    productIdentifier: e.productIdentifier,
    latestPurchaseDateMs: e.latestPurchaseDate
      ? Date.parse(e.latestPurchaseDate)
      : null,
    expirationDateMs: e.expirationDate ? Date.parse(e.expirationDate) : null,
    willRenew: e.willRenew,
  }));
  return {
    activeEntitlements: active,
    allPurchasedProductIds: info.allPurchasedProductIdentifiers ?? [],
  };
}
```

Handle user cancel: rethrow a typed domain error or let use case inspect `PurchasesError` `userCancelled`.

- [ ] **Step 4: ConfigurePurchasesUseCase**

```typescript
export class ConfigurePurchasesUseCase {
  constructor(private readonly purchases: IPurchasesRepository) {}
  execute(): { configured: boolean } {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) return { configured: false };
    this.purchases.setDebugLogs(__DEV__);
    this.purchases.configure(apiKey);
    return { configured: true };
  }
}
```

- [ ] **Step 5: NoOpPaywallPresenter**

```typescript
export class NoOpPaywallPresenter implements IPaywallPresenter {
  async presentIfNeeded() {
    return 'not_presented' as const;
  }
}
```

- [ ] **Step 6: Typecheck**

Run: `yarn tsc --noEmit` (or project’s usual check). Fix adapter typing issues.

- [ ] **Step 7: Commit**

```bash
git add package.json yarn.lock ios/Podfile.lock src/config/revenueCat.ts src/infrastructure/repositories/RevenueCatPurchasesRepository.ts src/infrastructure/repositories/NoOpPaywallPresenter.ts src/domain/useCases/ConfigurePurchasesUseCase.ts .env.example
git commit -m "$(cat <<'EOF'
feat(billing): add RevenueCat purchases adapter and config
EOF
)"
```

---

### Task 6: Purchase / restore / offerings / identify use cases + di wiring

**Files:**
- Create: `src/domain/useCases/GetOfferingsUseCase.ts`
- Create: `src/domain/useCases/PurchasePackageUseCase.ts`
- Create: `src/domain/useCases/IdentifyPurchasesUserUseCase.ts`
- Create: `src/domain/useCases/ResetPurchasesUserUseCase.ts`
- Modify: `src/domain/useCases/RestorePurchasesUseCase.ts` (replace Play implementation)
- Modify: `src/di.ts` (wire new stack; leave Play removal to Task 7/10 if still referenced)

**Interfaces:**
```typescript
GetOfferingsUseCase.execute(): Promise<PurchasesOfferingDTO | null>

PurchasePackageUseCase.execute(productId: string): Promise<
  | { status: 'purchased' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }
>

RestorePurchasesUseCase.execute(): Promise<{ restored: boolean }>

IdentifyPurchasesUserUseCase.execute(uid: string): Promise<void>
ResetPurchasesUserUseCase.execute(): Promise<void>
```

Each of purchase / restore / identify / reset ends by calling `syncCustomerInfoUseCase.execute(info)` then optional `onApplied` (e.g. `syncPremiumStatus`).

- [ ] **Step 1: Implement GetOfferingsUseCase**

- [ ] **Step 2: Implement PurchasePackageUseCase**

Detect user cancel from RC error (`userCancelled` / code) → `{ status: 'cancelled' }`. On success sync + `{ status: 'purchased' }`.

- [ ] **Step 3: Rewrite RestorePurchasesUseCase**

```typescript
async execute(): Promise<{ restored: boolean }> {
  const info = await this.purchases.restorePurchases();
  this.sync.execute(info);
  const has = info.activeEntitlements.some(e => e.identifier === 'premium');
  return { restored: has };
}
```

- [ ] **Step 4: Identify + Reset use cases**

Identify: `logIn(uid)` → sync.  
Reset: `logOut()` → sync (mapper keeps license premium).

- [ ] **Step 5: Wire in di.ts**

Instantiate `RevenueCatPurchasesRepository`, `syncCustomerInfoUseCase` (callback → `syncPremiumStatus`), configure/get/purchase/restore/identify/reset use cases, `paywallPresenter = new NoOpPaywallPresenter()`.

Export:
- `configurePurchasesUseCase`
- `getOfferingsUseCase`
- `purchasePackageUseCase`
- `restorePurchasesUseCase` (updated)
- `identifyPurchasesUserUseCase`
- `resetPurchasesUserUseCase`
- `purchasesRepository` (only if hooks need — prefer use cases)
- `ensurePurchasesConfigured()` helper that calls configure once (module flag)

- [ ] **Step 6: Commit**

```bash
git add src/domain/useCases src/di.ts
git commit -m "$(cat <<'EOF'
feat(billing): wire RevenueCat purchase restore and identity use cases
EOF
)"
```

---

### Task 7: App bootstrap — configure, sync, listener; drop Play session

**Files:**
- Modify: `src/app.tsx`
- Modify: `src/di.ts` (remove `ensurePlayBillingSession` usage if still present)
- Modify: `src/hooks/useAuthBootstrap.ts` (if cold-start uid available — identify here or in app effect)

**Interfaces:**
- Consumes: configure / getCustomerInfo / listener / identify / sync

- [ ] **Step 1: Add purchases bootstrap in app.tsx**

On mount (alongside existing verify subscription):
1. `configurePurchasesUseCase.execute()`
2. If auth session has uid → `identifyPurchasesUserUseCase.execute(uid)` else `getCustomerInfo` → sync
3. Register CustomerInfo listener → sync → `syncPremiumStatus`
4. Remove `ensurePlayBillingSession` and `reconcilePlayEntitlementIfNeeded` calls

- [ ] **Step 2: Foreground refresh**

In existing AppState `active` handler, call `getCustomerInfo` → sync (debounce already present). Remove Play reconcile on active.

- [ ] **Step 3: Manual smoke (dev)**

Run Android or iOS with Test Store keys in `.env`. Confirm native log contains Purchases configured. Confirm no redbox.

- [ ] **Step 4: Commit**

```bash
git add src/app.tsx src/di.ts src/hooks/useAuthBootstrap.ts
git commit -m "$(cat <<'EOF'
feat(billing): configure RevenueCat on app launch and sync entitlements
EOF
)"
```

---

### Task 8: Auth identity — logIn / logOut

**Files:**
- Modify: `src/domain/useCases/CompleteAccountSignInUseCase.ts`
- Modify: `src/domain/useCases/SignOutUseCase.ts`
- Modify: `src/di.ts` (inject identify/reset)

**Interfaces:**
- Consumes: `IdentifyPurchasesUserUseCase`, `ResetPurchasesUserUseCase`

- [ ] **Step 1: CompleteAccountSignInUseCase**

After `authSession.setUid(user.uid)` (before or inside `finishSync`), call:
```typescript
await this.identifyPurchasesUser.execute(user.uid);
```
Wrap in try/catch with existing `onError` so RC failure does not block sign-in.

- [ ] **Step 2: SignOutUseCase**

In `execute()`, after `authService.signOut()`, await `resetPurchasesUser.execute()`, then `clearLocalSession()`.

- [ ] **Step 3: Commit**

```bash
git add src/domain/useCases/CompleteAccountSignInUseCase.ts src/domain/useCases/SignOutUseCase.ts src/di.ts
git commit -m "$(cat <<'EOF'
feat(billing): identify RevenueCat user on Firebase sign-in and reset on sign-out
EOF
)"
```

---

### Task 9: Paywall hook + UI — offerings instead of Play products

**Files:**
- Modify: `src/hooks/usePurchase.ts`
- Modify: `src/components/premium/PremiumPaywallBody.tsx`
- Modify: `src/components/premium/TrialEndingModal.tsx` (if it assumes Android-only products)
- Modify analytics `payment_provider` where purchase completes (`premium_purchase_completed` / failed)

**Interfaces:**
- Hook API (keep familiar shape for paywall):
```typescript
export type BillingProductRow = {
  productId: string;
  title: string;
  description?: string;
  price: string;
  currency?: string;
};

// getProducts() loads offerings and maps packages → BillingProductRow[] by productId
// requestPurchase(productId) → purchasePackageUseCase
// restorePurchases() → restorePurchasesUseCase
```

- [ ] **Step 1: Rewrite usePurchase**

- Remove `ensurePlayBillingSession` / `playBillingRepository`
- `getProducts`: `getOfferingsUseCase.execute()` → map packages to rows; `setProducts`
- `requestPurchase`: `purchasePackageUseCase.execute(productId)` — throw/return so UI can branch cancel vs error
- Prefer returning status to UI rather than silent listener

- [ ] **Step 2: Update PremiumPaywallBody**

- Load products on **both** iOS and Android (remove `Platform.OS === 'android'` gate for fetch)
- On CTA: await `requestPurchase`; on `purchased` call `onPurchaseSuccess` + analytics with `payment_provider: 'revenuecat'`; on `cancelled` no error toast; on `error` short message
- Remove dependency on `setPurchaseSuccessListener` for success path (or keep as secondary if still used elsewhere — prefer direct await)
- Empty offerings: keep fallback prices; disable purchase button until products loaded (or allow tap that retries offerings)

- [ ] **Step 3: TrialEndingModal**

Ensure it still loads products via `getProducts` without Android-only assumption.

- [ ] **Step 4: Run unit tests**

Run: `yarn test __tests__/mapCustomerInfo.test.ts __tests__/syncCustomerInfoUseCase.test.ts __tests__/verifySubscriptionLicenseOrStore.test.ts __tests__/monetizationPricing.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePurchase.ts src/components/premium/PremiumPaywallBody.tsx src/components/premium/TrialEndingModal.tsx src/di.ts src/services/purchaseAnalyticsContext.ts
git commit -m "$(cat <<'EOF'
feat(paywall): drive custom paywall from RevenueCat offerings
EOF
)"
```

---

### Task 10: Remove Play Billing stack + docs

**Files:**
- Delete: `src/domain/repository/IPlayBillingRepository.ts`
- Delete: `src/infrastructure/repositories/PlayBillingRepository.ts`
- Delete: `src/infrastructure/repositories/NoOpPlayBillingRepository.ts`
- Delete: `src/domain/useCases/ReconcilePlayEntitlementUseCase.ts`
- Delete: `src/services/playEntitlementReconcile.ts`
- Modify or delete: `src/domain/useCases/ApplyStorePurchaseUseCase.ts` (remove if unused)
- Modify: `src/di.ts` (remove all Play wiring, purchase listeners, verify adapter from purchase path)
- Modify: `package.json` — remove `react-native-iap`
- Modify: `docs/PLAY_BILLING.md` — top note: superseded by RevenueCat; keep product ID table
- Modify: `docs/MONETIZATION_SETUP.md` — RC keys + offerings setup
- Modify: `docs/SUBSCRIPTION.md` if it still says Play-only grant
- Grep and clear remaining `react-native-iap` / `IPlayBilling` / `ensurePlayBilling` references

- [ ] **Step 1: Grep for leftovers**

```bash
rg -n "react-native-iap|IPlayBilling|PlayBilling|ensurePlayBilling|ReconcilePlay|ApplyStorePurchase|playEntitlement" src docs
```

- [ ] **Step 2: Delete / unwire / yarn remove**

```bash
yarn remove react-native-iap
cd ios && pod install && cd ..
```

Keep `PlayPurchaseVerificationServiceAdapter` and website API files on disk (out of scope to delete) but ensure app purchase path does not call them.

- [ ] **Step 3: Update docs**

Short “RevenueCat” section in `MONETIZATION_SETUP.md`: env keys, entitlement `premium`, offering `default`, product ids unchanged.

- [ ] **Step 4: Typecheck + tests**

```bash
yarn test
yarn tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(billing): remove react-native-iap and Play Billing path
EOF
)"
```

---

### Task 11: Manual verification checklist

**Files:** none (manual)

- [ ] **Step 1: Configure** — `.env` has Test Store or platform public keys; rebuild native app

- [ ] **Step 2: Logs** — confirm Purchases configured banner in Xcode/logcat

- [ ] **Step 3: Offerings** — open paywall; prices from RC (not only fallback)

- [ ] **Step 4: Purchase** — sandbox/Test Store purchase → premium gates unlock (Life, premium widgets)

- [ ] **Step 5: Relaunch** — still premium

- [ ] **Step 6: Restore** — clear local premium fields or reinstall; restore returns premium

- [ ] **Step 7: Auth** — sign in → RC logIn (debug logs); sign out → still license-safe; store anonymous behavior OK

- [ ] **Step 8: License OR** — with license and no RC entitlement, premium stays true after sync

- [ ] **Step 9: iOS** — app launches with RC configured even if App Store products missing (empty offerings OK, no crash)

- [ ] **Step 10: Commit docs only if checklist notes were added**; otherwise done

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Replace Play with RC | 5–10 |
| Custom paywall + RC offerings | 9 |
| Optional RC Paywalls later (`IPaywallPresenter`) | 3, 5 |
| Android + iOS keys; Android purchases first | 1, 5, 7, 11 |
| License OR premium | 2, 3, 4 |
| Firebase UID logIn | 6, 8 |
| New UNTIL RC project + premium + products | 1 |
| Sync CustomerInfo → MMKV | 2, 3, 7 |
| Remove react-native-iap | 10 |
| Error handling cancel/network/empty | 6, 9 |
| Analytics payment_provider | 9 |
| Out of scope remote paywall / delete verify API | honored |

No TBD placeholders. Types `CustomerInfoDTO` / `IPurchasesRepository` / use case names are consistent across tasks.
