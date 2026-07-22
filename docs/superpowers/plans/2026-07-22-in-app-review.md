# In-App Review (Play + App Store) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-07-22-in-app-review-design.md`

**Goal:** Add native in-app review on Android and iOS (auto after countdown share flow and sustained use, plus Settings “Rate UNTIL” with store-listing fallback).

**Architecture:** Thin port (`IInAppReviewService`) + `StoreReviewAdapter` (`react-native-store-review`). Pure eligibility in `core`. Engagement MMKV holds pending + cooldown + first-open day. Use cases gate auto prompts; Settings bypasses cooldown and falls back to Play/App Store URLs. Surfaces only call hooks / DI use cases.

**Tech Stack:** React Native 0.83, `react-native-store-review`, existing MMKV engagement + `appOpenCount`, Jest

## Global Constraints

- Surfaces must not import `react-native-store-review`, adapters, or `persistence` for this feature
- No custom “enjoying UNTIL?” modal
- Auto cooldown: one auto request per 90 days
- Sustained use: `appOpenCount >= 5` and `>= 3` calendar days since first open
- Never request review while widget coach, feature coach, share prompt, or deferred paywall is visible
- Settings row label (verbatim): `Rate UNTIL`
- Android package: `app.until.time`
- iOS App Store ID may be unset; skip listing open when empty
- Human-copy rules for any visible strings (no em dashes, no coach clichés)
- Stamp auto cooldown only after a successful native `requestReview` call attempt (module present); missing module → do not stamp

## File map

| File | Responsibility |
|------|----------------|
| `src/core/engagement/inAppReviewEligibility.ts` | Pure cooldown + opens/days eligibility |
| `src/core/engagement/index.ts` | Re-exports |
| `src/domain/ports/IInAppReviewService.ts` | Port |
| `src/infrastructure/adapters/StoreReviewAdapter.ts` | Native review + store URLs |
| `src/config/storeUrls.ts` | Play URL + optional App Store ID |
| `src/persistence/schema.ts` | New engagement keys |
| `src/domain/repository/IEngagementRepository.ts` | Review pending / cooldown / first open API |
| `src/infrastructure/repositories/MmkvEngagementRepository.ts` | MMKV impl |
| `src/domain/useCases/MaybeRequestInAppReviewUseCase.ts` | Auto path |
| `src/domain/useCases/RequestInAppReviewFromSettingsUseCase.ts` | Settings path |
| `src/domain/useCases/CheckCountdownCompletionUseCase.ts` | Also schedule review pending |
| `src/domain/useCases/TrackAppOpenUseCase.ts` | Ensure first-open date |
| `src/domain/useCases/RunAppOpenSideEffectsUseCase.ts` | Sustained-use maybe-request |
| `src/di.ts` | Wire services + use cases |
| `src/hooks/useInAppReview.ts` | Settings CTA |
| `src/hooks/useEngagementModals.ts` | Post-share maybe-request |
| `src/components/engagement/AppEngagementLayer.tsx` | Call after share dismiss; pass blocking flag for opens path |
| `src/surfaces/app/SettingsScreen.tsx` | Rate row |
| `src/services/analytics.ts` | Event names |
| `__tests__/inAppReviewEligibility.test.ts` | Unit tests for pure rules |
| `__tests__/maybeRequestInAppReview.test.ts` | Use case tests with fakes |

---

### Task 1: Pure eligibility helpers (TDD)

**Files:**
- Create: `src/core/engagement/inAppReviewEligibility.ts`
- Create: `src/core/engagement/index.ts`
- Create: `__tests__/inAppReviewEligibility.test.ts`

**Interfaces:**
- Consumes: none (pure)
- Produces:
  - `AUTO_REVIEW_COOLDOWN_MS: number` (90 days)
  - `MIN_APP_OPENS_FOR_REVIEW: 5`
  - `MIN_DAYS_SINCE_FIRST_OPEN: 3`
  - `isAutoReviewCooldownElapsed(lastAutoReviewRequestAtMs: number | null, nowMs: number): boolean`
  - `isSustainedUseEligible(appOpenCount: number, firstOpenDateKey: string | null, todayDateKey: string): boolean`
  - `daysBetweenDateKeys(startKey: string, endKey: string): number` (local YYYY-MM-DD)

- [ ] **Step 1: Write the failing tests**

```ts
import {
  AUTO_REVIEW_COOLDOWN_MS,
  isAutoReviewCooldownElapsed,
  isSustainedUseEligible,
  daysBetweenDateKeys,
} from '../src/core/engagement';

describe('inAppReviewEligibility', () => {
  it('allows auto when never asked', () => {
    expect(isAutoReviewCooldownElapsed(null, 1_000_000)).toBe(true);
  });

  it('blocks auto within 90 days', () => {
    const now = 1_000_000_000_000;
    expect(
      isAutoReviewCooldownElapsed(now - AUTO_REVIEW_COOLDOWN_MS + 1, now)
    ).toBe(false);
  });

  it('allows auto after 90 days', () => {
    const now = 1_000_000_000_000;
    expect(
      isAutoReviewCooldownElapsed(now - AUTO_REVIEW_COOLDOWN_MS, now)
    ).toBe(true);
  });

  it('daysBetweenDateKeys is calendar-local', () => {
    expect(daysBetweenDateKeys('2026-07-01', '2026-07-04')).toBe(3);
    expect(daysBetweenDateKeys('2026-07-04', '2026-07-04')).toBe(0);
  });

  it('sustained use needs opens + days', () => {
    expect(isSustainedUseEligible(5, '2026-07-01', '2026-07-04')).toBe(true);
    expect(isSustainedUseEligible(4, '2026-07-01', '2026-07-10')).toBe(false);
    expect(isSustainedUseEligible(5, '2026-07-03', '2026-07-04')).toBe(false);
    expect(isSustainedUseEligible(5, null, '2026-07-04')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --watchman=false __tests__/inAppReviewEligibility.test.ts`

Expected: FAIL — module not found / exports missing.

- [ ] **Step 3: Implement helpers**

`src/core/engagement/inAppReviewEligibility.ts`:

```ts
export const AUTO_REVIEW_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
export const MIN_APP_OPENS_FOR_REVIEW = 5;
export const MIN_DAYS_SINCE_FIRST_OPEN = 3;

function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysBetweenDateKeys(startKey: string, endKey: string): number {
  const start = parseLocalDateKey(startKey);
  const end = parseLocalDateKey(endKey);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
}

export function isAutoReviewCooldownElapsed(
  lastAutoReviewRequestAtMs: number | null,
  nowMs: number
): boolean {
  if (lastAutoReviewRequestAtMs == null) return true;
  return nowMs - lastAutoReviewRequestAtMs >= AUTO_REVIEW_COOLDOWN_MS;
}

export function isSustainedUseEligible(
  appOpenCount: number,
  firstOpenDateKey: string | null,
  todayDateKey: string
): boolean {
  if (appOpenCount < MIN_APP_OPENS_FOR_REVIEW) return false;
  if (!firstOpenDateKey) return false;
  return (
    daysBetweenDateKeys(firstOpenDateKey, todayDateKey) >=
    MIN_DAYS_SINCE_FIRST_OPEN
  );
}
```

`src/core/engagement/index.ts`:

```ts
export {
  AUTO_REVIEW_COOLDOWN_MS,
  MIN_APP_OPENS_FOR_REVIEW,
  MIN_DAYS_SINCE_FIRST_OPEN,
  daysBetweenDateKeys,
  isAutoReviewCooldownElapsed,
  isSustainedUseEligible,
} from './inAppReviewEligibility';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest --watchman=false __tests__/inAppReviewEligibility.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/engagement __tests__/inAppReviewEligibility.test.ts
git commit -m "feat: add in-app review eligibility helpers"
```

---

### Task 2: Port, store URLs, and StoreReview adapter

**Files:**
- Create: `src/domain/ports/IInAppReviewService.ts`
- Create: `src/config/storeUrls.ts`
- Create: `src/infrastructure/adapters/StoreReviewAdapter.ts`
- Modify: `package.json` (dependency via npm install)

**Interfaces:**
- Consumes: none yet
- Produces:
  - `IInAppReviewService { isAvailable(): boolean; requestReview(): Promise<void>; openStoreListing(): Promise<void> }`
  - `StoreReviewAdapter implements IInAppReviewService`
  - `PLAY_STORE_LISTING_URL`, `IOS_APP_STORE_ID` (string, may be `''`)

- [ ] **Step 1: Install dependency**

Run: `npm install react-native-store-review --save`

Expected: package added; for iOS later `pod install` when building.

- [ ] **Step 2: Add port + store URL config**

`src/domain/ports/IInAppReviewService.ts`:

```ts
/**
 * Port: native in-app review + store listing fallback.
 * Implemented by StoreReviewAdapter (Play / App Store).
 */
export interface IInAppReviewService {
  /** True when the native module is linked and callable. */
  isAvailable(): boolean;
  requestReview(): Promise<void>;
  openStoreListing(): Promise<void>;
}
```

`src/config/storeUrls.ts`:

```ts
/** Play Store listing for Android fallback. */
export const PLAY_STORE_LISTING_URL =
  'https://play.google.com/store/apps/details?id=app.until.time';

/**
 * Numeric App Store ID (digits only). Empty until the app is live on App Store.
 * When empty, iOS openStoreListing is a no-op.
 */
export const IOS_APP_STORE_ID = '';
```

- [ ] **Step 3: Implement adapter**

`src/infrastructure/adapters/StoreReviewAdapter.ts`:

```ts
import { Linking, Platform } from 'react-native';
import type { IInAppReviewService } from '../../domain/ports/IInAppReviewService';
import { IOS_APP_STORE_ID, PLAY_STORE_LISTING_URL } from '../../config/storeUrls';

type StoreReviewModule = {
  requestReview: () => void | Promise<void>;
};

function loadStoreReview(): StoreReviewModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-store-review') as
      | StoreReviewModule
      | { default: StoreReviewModule };
    const api = 'requestReview' in mod ? mod : (mod as { default: StoreReviewModule }).default;
    if (!api || typeof api.requestReview !== 'function') return null;
    return api;
  } catch {
    return null;
  }
}

export class StoreReviewAdapter implements IInAppReviewService {
  private readonly native = loadStoreReview();

  isAvailable(): boolean {
    return this.native != null;
  }

  async requestReview(): Promise<void> {
    if (!this.native) {
      throw new Error('StoreReview native module unavailable');
    }
    await Promise.resolve(this.native.requestReview());
  }

  async openStoreListing(): Promise<void> {
    if (Platform.OS === 'android') {
      await Linking.openURL(PLAY_STORE_LISTING_URL);
      return;
    }
    if (Platform.OS === 'ios' && IOS_APP_STORE_ID.trim()) {
      await Linking.openURL(
        `https://apps.apple.com/app/id${IOS_APP_STORE_ID.trim()}`
      );
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/domain/ports/IInAppReviewService.ts src/config/storeUrls.ts src/infrastructure/adapters/StoreReviewAdapter.ts
git commit -m "feat: add StoreReview adapter and store URL config"
```

---

### Task 3: Engagement repository + schema keys

**Files:**
- Modify: `src/persistence/schema.ts`
- Modify: `src/domain/repository/IEngagementRepository.ts`
- Modify: `src/infrastructure/repositories/MmkvEngagementRepository.ts`
- Create: `__tests__/engagementReviewFlags.test.ts`

**Interfaces:**
- Consumes: existing `getString` / `setString` / `getNumber` / `setNumber` MMKV helpers
- Produces on `IEngagementRepository`:
  - `scheduleReviewPrompt(): void`
  - `clearReviewPending(): void`
  - `isReviewPending(): boolean`
  - `getLastAutoReviewRequestAt(): number | null`
  - `setLastAutoReviewRequestAt(ms: number): void`
  - `ensureFirstOpenDate(dateKey: string): void`
  - `getFirstOpenDate(): string | null`

- [ ] **Step 1: Write failing repo-flag tests**

Use a lightweight fake that mirrors the intended MMKV API surface, or test through a small in-memory fake of `IEngagementRepository` methods you will implement. Prefer testing the pure scheduling semantics via a test double first if MMKV is hard to isolate; otherwise instantiate `MmkvEngagementRepository` with jest mocks of persistence.

Simplest approach — test an in-memory fake matching the interface in the next task’s use-case tests, and here only add schema + interface + MMKV methods without a separate fragile MMKV test. Skip dedicated MMKV test if the project has no MMKV test harness; cover behavior in Task 4 use-case tests.

If skipping here: still add schema keys and implement methods, then commit after a TypeScript check.

- [ ] **Step 2: Add STORAGE_KEYS**

In `src/persistence/schema.ts` under engagement keys:

```ts
  REVIEW_PROMPT_PENDING: 'engagement.reviewPromptPending',
  LAST_AUTO_REVIEW_REQUEST_AT: 'engagement.lastAutoReviewRequestAt',
  FIRST_OPEN_DATE: 'engagement.firstOpenDate',
```

- [ ] **Step 3: Extend interface + MMKV impl**

Add to `IEngagementRepository`:

```ts
  scheduleReviewPrompt(): void;
  clearReviewPending(): void;
  isReviewPending(): boolean;
  getLastAutoReviewRequestAt(): number | null;
  setLastAutoReviewRequestAt(ms: number): void;
  ensureFirstOpenDate(dateKey: string): void;
  getFirstOpenDate(): string | null;
```

Implement in `MmkvEngagementRepository` (use `getString`/`setString` for pending + first open; store last request as stringified ms via `getString`/`setString` or existing number helpers if present):

```ts
  scheduleReviewPrompt(): void {
    setString(STORAGE_KEYS.REVIEW_PROMPT_PENDING, '1');
  }

  clearReviewPending(): void {
    setString(STORAGE_KEYS.REVIEW_PROMPT_PENDING, '');
  }

  isReviewPending(): boolean {
    return getString(STORAGE_KEYS.REVIEW_PROMPT_PENDING) === '1';
  }

  getLastAutoReviewRequestAt(): number | null {
    const raw = getString(STORAGE_KEYS.LAST_AUTO_REVIEW_REQUEST_AT);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  setLastAutoReviewRequestAt(ms: number): void {
    setString(STORAGE_KEYS.LAST_AUTO_REVIEW_REQUEST_AT, String(ms));
  }

  ensureFirstOpenDate(dateKey: string): void {
    if (this.getFirstOpenDate()) return;
    setString(STORAGE_KEYS.FIRST_OPEN_DATE, dateKey);
  }

  getFirstOpenDate(): string | null {
    const raw = getString(STORAGE_KEYS.FIRST_OPEN_DATE);
    return raw?.trim() ? raw : null;
  }
```

Update any test fakes that implement `IEngagementRepository` (search for `scheduleSharePrompt` in `__tests__`) with no-op stubs for the new methods so TypeScript/Jest still compile.

- [ ] **Step 4: Commit**

```bash
git add src/persistence/schema.ts src/domain/repository/IEngagementRepository.ts src/infrastructure/repositories/MmkvEngagementRepository.ts __tests__
git commit -m "feat: persist in-app review engagement flags"
```

---

### Task 4: MaybeRequest + Settings use cases (TDD)

**Files:**
- Create: `src/domain/useCases/MaybeRequestInAppReviewUseCase.ts`
- Create: `src/domain/useCases/RequestInAppReviewFromSettingsUseCase.ts`
- Create: `__tests__/maybeRequestInAppReview.test.ts`
- Modify: `src/services/analytics.ts` (event names)
- Modify: `src/di.ts`

**Interfaces:**
- Consumes: `IInAppReviewService`, `IEngagementRepository`, `ISubscriptionRepository`, eligibility helpers
- Produces:
  - `export type InAppReviewSource = 'countdown' | 'opens' | 'settings'`
  - `MaybeRequestInAppReviewUseCase.execute(input: { source: 'countdown' | 'opens'; blockingOverlayVisible: boolean; nowMs?: number; todayDateKey: string }): Promise<boolean>`
  - `RequestInAppReviewFromSettingsUseCase.execute(): Promise<void>`

- [ ] **Step 1: Add analytics event names**

In `AnalyticsEventName` union add:

```ts
  | 'review_requested'
  | 'review_store_fallback'
```

- [ ] **Step 2: Write failing use-case tests**

```ts
import { MaybeRequestInAppReviewUseCase } from '../src/domain/useCases/MaybeRequestInAppReviewUseCase';
import { RequestInAppReviewFromSettingsUseCase } from '../src/domain/useCases/RequestInAppReviewFromSettingsUseCase';
import type { IInAppReviewService } from '../src/domain/ports/IInAppReviewService';
import type { IEngagementRepository } from '../src/domain/repository/IEngagementRepository';
import type { ISubscriptionRepository } from '../src/domain/repository/ISubscriptionRepository';
import { AUTO_REVIEW_COOLDOWN_MS } from '../src/core/engagement';

function createFakes(overrides?: {
  reviewPending?: boolean;
  lastAt?: number | null;
  opens?: number;
  firstOpen?: string | null;
  available?: boolean;
  requestThrows?: boolean;
}) {
  let reviewPending = overrides?.reviewPending ?? false;
  let lastAt: number | null =
    overrides?.lastAt === undefined ? null : overrides.lastAt;
  const calls = {
    requestReview: 0,
    openStoreListing: 0,
    clearPending: 0,
    setLastAt: null as number | null,
  };

  const reviewService: IInAppReviewService = {
    isAvailable: () => overrides?.available !== false,
    requestReview: async () => {
      calls.requestReview += 1;
      if (overrides?.requestThrows) throw new Error('fail');
    },
    openStoreListing: async () => {
      calls.openStoreListing += 1;
    },
  };

  const engagement = {
    isReviewPending: () => reviewPending,
    clearReviewPending: () => {
      reviewPending = false;
      calls.clearPending += 1;
    },
    getLastAutoReviewRequestAt: () => lastAt,
    setLastAutoReviewRequestAt: (ms: number) => {
      lastAt = ms;
      calls.setLastAt = ms;
    },
    getFirstOpenDate: () => overrides?.firstOpen ?? '2026-07-01',
  } as unknown as IEngagementRepository;

  const subscription = {
    getAppOpenCount: () => overrides?.opens ?? 5,
  } as unknown as ISubscriptionRepository;

  return { reviewService, engagement, subscription, calls };
}

describe('MaybeRequestInAppReviewUseCase', () => {
  it('requests on countdown when pending and not blocked', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: false,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(true);
    expect(calls.requestReview).toBe(1);
    expect(calls.clearPending).toBe(1);
    expect(calls.setLastAt).toBe(1_700_000_000_000);
  });

  it('skips when blocking overlay visible', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: true,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(false);
    expect(calls.requestReview).toBe(0);
  });

  it('skips opens path when under thresholds', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      opens: 2,
      firstOpen: '2026-07-09',
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'opens',
      blockingOverlayVisible: false,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(false);
    expect(calls.requestReview).toBe(0);
  });

  it('does not stamp cooldown when module unavailable', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
      available: false,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: false,
      nowMs: 1_700_000_000_000,
      todayDateKey: '2026-07-10',
    });
    expect(calls.setLastAt).toBe(null);
    expect(calls.clearPending).toBe(1);
  });

  it('respects 90-day cooldown', async () => {
    const now = 1_700_000_000_000;
    const { reviewService, engagement, subscription, calls } = createFakes({
      reviewPending: true,
      lastAt: now - AUTO_REVIEW_COOLDOWN_MS + 1000,
    });
    const uc = new MaybeRequestInAppReviewUseCase(
      reviewService,
      engagement,
      subscription
    );
    const ok = await uc.execute({
      source: 'countdown',
      blockingOverlayVisible: false,
      nowMs: now,
      todayDateKey: '2026-07-10',
    });
    expect(ok).toBe(false);
    expect(calls.requestReview).toBe(0);
  });
});

describe('RequestInAppReviewFromSettingsUseCase', () => {
  it('falls back to store listing when request fails', async () => {
    const { reviewService, engagement, subscription, calls } = createFakes({
      requestThrows: true,
    });
    const uc = new RequestInAppReviewFromSettingsUseCase(reviewService);
    await uc.execute();
    expect(calls.requestReview).toBe(1);
    expect(calls.openStoreListing).toBe(1);
  });

  it('falls back when unavailable', async () => {
    const { reviewService, calls } = createFakes({ available: false });
    const uc = new RequestInAppReviewFromSettingsUseCase(reviewService);
    await uc.execute();
    expect(calls.requestReview).toBe(0);
    expect(calls.openStoreListing).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest --watchman=false __tests__/maybeRequestInAppReview.test.ts`

Expected: FAIL — use case modules missing.

- [ ] **Step 4: Implement use cases**

`MaybeRequestInAppReviewUseCase.ts`:

```ts
import {
  isAutoReviewCooldownElapsed,
  isSustainedUseEligible,
} from '../../core/engagement';
import type { IInAppReviewService } from '../ports/IInAppReviewService';
import type { IEngagementRepository } from '../repository/IEngagementRepository';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import { logAnalyticsEvent } from '../../services/analytics';

export type AutoInAppReviewSource = 'countdown' | 'opens';

export class MaybeRequestInAppReviewUseCase {
  constructor(
    private readonly reviewService: IInAppReviewService,
    private readonly engagementRepository: IEngagementRepository,
    private readonly subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(input: {
    source: AutoInAppReviewSource;
    blockingOverlayVisible: boolean;
    todayDateKey: string;
    nowMs?: number;
  }): Promise<boolean> {
    const nowMs = input.nowMs ?? Date.now();

    if (input.blockingOverlayVisible) return false;

    if (
      !isAutoReviewCooldownElapsed(
        this.engagementRepository.getLastAutoReviewRequestAt(),
        nowMs
      )
    ) {
      return false;
    }

    if (input.source === 'countdown') {
      if (!this.engagementRepository.isReviewPending()) return false;
    } else {
      if (
        !isSustainedUseEligible(
          this.subscriptionRepository.getAppOpenCount(),
          this.engagementRepository.getFirstOpenDate(),
          input.todayDateKey
        )
      ) {
        return false;
      }
    }

    // Clear pending before/after attempt so we do not loop forever.
    if (input.source === 'countdown') {
      this.engagementRepository.clearReviewPending();
    }

    if (!this.reviewService.isAvailable()) {
      return false;
    }

    try {
      await this.reviewService.requestReview();
      this.engagementRepository.setLastAutoReviewRequestAt(nowMs);
      void logAnalyticsEvent('review_requested', { source: input.source });
      return true;
    } catch {
      return false;
    }
  }
}
```

`RequestInAppReviewFromSettingsUseCase.ts`:

```ts
import type { IInAppReviewService } from '../ports/IInAppReviewService';
import { logAnalyticsEvent } from '../../services/analytics';

export class RequestInAppReviewFromSettingsUseCase {
  constructor(private readonly reviewService: IInAppReviewService) {}

  async execute(): Promise<void> {
    try {
      if (this.reviewService.isAvailable()) {
        await this.reviewService.requestReview();
        void logAnalyticsEvent('review_requested', { source: 'settings' });
        return;
      }
    } catch {
      // fall through to listing
    }
    try {
      await this.reviewService.openStoreListing();
      void logAnalyticsEvent('review_store_fallback', { source: 'settings' });
    } catch {
      // silent
    }
  }
}
```

Note: Settings path that successfully calls `requestReview` does **not** open the listing (OS may still no-op). That matches the spec’s “on failure / unavailable” fallback.

- [ ] **Step 5: Wire in `di.ts`**

```ts
import { StoreReviewAdapter } from './infrastructure/adapters/StoreReviewAdapter';
import { MaybeRequestInAppReviewUseCase } from './domain/useCases/MaybeRequestInAppReviewUseCase';
import { RequestInAppReviewFromSettingsUseCase } from './domain/useCases/RequestInAppReviewFromSettingsUseCase';

const inAppReviewService = new StoreReviewAdapter();

export const maybeRequestInAppReviewUseCase = new MaybeRequestInAppReviewUseCase(
  inAppReviewService,
  engagementRepository,
  subscriptionRepository
);

export const requestInAppReviewFromSettingsUseCase =
  new RequestInAppReviewFromSettingsUseCase(inAppReviewService);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest --watchman=false __tests__/maybeRequestInAppReview.test.ts __tests__/inAppReviewEligibility.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/domain/useCases/MaybeRequestInAppReviewUseCase.ts src/domain/useCases/RequestInAppReviewFromSettingsUseCase.ts src/services/analytics.ts src/di.ts __tests__/maybeRequestInAppReview.test.ts
git commit -m "feat: add in-app review use cases"
```

---

### Task 5: Wire countdown, first open, and sustained-use trigger

**Files:**
- Modify: `src/domain/useCases/CheckCountdownCompletionUseCase.ts`
- Modify: `src/domain/useCases/TrackAppOpenUseCase.ts`
- Modify: `src/domain/useCases/RunAppOpenSideEffectsUseCase.ts`
- Modify: `src/di.ts` (constructor args if needed)

**Interfaces:**
- Consumes: engagement `scheduleReviewPrompt`, `ensureFirstOpenDate`, `maybeRequestInAppReviewUseCase`
- Produces: countdown sets pending; opens path may fire review when eligible

- [ ] **Step 1: Schedule review on countdown completion**

In `CheckCountdownCompletionUseCase.execute`, after `scheduleSharePrompt()`:

```ts
    this.engagementRepository.scheduleSharePrompt();
    this.engagementRepository.scheduleReviewPrompt();
```

- [ ] **Step 2: Record first open date in TrackAppOpenUseCase**

Inject `IEngagementRepository` (or call ensure from `RunAppOpenSideEffectsUseCase` only — prefer one place).

In `RunAppOpenSideEffectsUseCase.execute`, after `trackAppOpenUseCase.execute(now)`:

```ts
    const dateKey = /* YYYY-MM-DD local */;
    this.engagementRepository.ensureFirstOpenDate(dateKey);
```

Use existing `getLocalDateKey` from `src/domain/notifications/retentionNotificationCopy.ts` (or duplicate a one-liner local helper in the use case file to avoid odd domain coupling — prefer importing `getLocalDateKey` if already used elsewhere from domain).

```ts
import { getLocalDateKey } from '../notifications/retentionNotificationCopy';
// ...
this.engagementRepository.ensureFirstOpenDate(getLocalDateKey(new Date(now)));
```

- [ ] **Step 3: Sustained-use maybe-request from RunAppOpenSideEffects**

Inject `MaybeRequestInAppReviewUseCase`. At end of `execute` (after countdown check), fire-and-forget:

```ts
    void this.maybeRequestInAppReviewUseCase.execute({
      source: 'opens',
      blockingOverlayVisible: false, // engagement layer also gates; opens on cold start usually has no modal yet — AppEngagementLayer will re-check when modals clear if needed
      todayDateKey: getLocalDateKey(new Date(now)),
      nowMs: now,
    });
```

Important: if feature coach / share may become visible in the same session, prefer **not** calling from `RunAppOpenSideEffects` with `blockingOverlayVisible: false` blindly. Instead:

**Preferred:** only schedule/attempt opens-path from `AppEngagementLayer.refreshEngagementModals` when `!blockingOverlayVisible`, same as countdown. Keep `RunAppOpenSideEffects` limited to `ensureFirstOpenDate` + existing work.

Update this step to:

1. `RunAppOpenSideEffects`: only `ensureFirstOpenDate`
2. `AppEngagementLayer`: when no blocking overlays, call maybe-request with `source: 'opens'` once per active session (guard with a module-level or ref `opensReviewAttemptedRef`)

Document that in Task 6.

- [ ] **Step 4: Update `di.ts` constructors** for any new deps.

- [ ] **Step 5: Commit**

```bash
git add src/domain/useCases/CheckCountdownCompletionUseCase.ts src/domain/useCases/RunAppOpenSideEffectsUseCase.ts src/di.ts
git commit -m "feat: schedule review pending on countdown and record first open"
```

---

### Task 6: Engagement layer + hook wiring

**Files:**
- Modify: `src/hooks/useEngagementModals.ts`
- Modify: `src/components/engagement/AppEngagementLayer.tsx`
- Create: `src/hooks/useInAppReview.ts`

**Interfaces:**
- Consumes: `maybeRequestInAppReviewUseCase`, `requestInAppReviewFromSettingsUseCase`, `getLocalDateKey`
- Produces: `useInAppReview().rateApp()`, dismissSharePrompt triggers countdown review

- [ ] **Step 1: Extend `useEngagementModals`**

After clearing share prompt, request review:

```ts
import {
  clearSharePromptPendingUseCase,
  // ...
  maybeRequestInAppReviewUseCase,
} from '../di';
import { getLocalDateKey } from '../domain/notifications/retentionNotificationCopy';

  const dismissSharePrompt = useCallback(() => {
    clearSharePromptPendingUseCase.execute();
    void maybeRequestInAppReviewUseCase.execute({
      source: 'countdown',
      blockingOverlayVisible: false,
      todayDateKey: getLocalDateKey(new Date()),
    });
  }, []);
```

Also export a `tryOpensReview(blockingOverlayVisible: boolean)` callback that calls maybe-request with `source: 'opens'`.

- [ ] **Step 2: Update `AppEngagementLayer`**

On share dismiss (already calls `dismissSharePrompt`), countdown path is covered.

For opens path: in `refreshEngagementModals`, after computing visibility, if none of widget/feature/share/deferred are showing, call `tryOpensReview(false)` once per mount/session via `useRef`.

When share is never shown (pending cleared / not scheduled) but `reviewPending` is set: on refresh when overlays clear, also call countdown maybe-request (use case no-ops if not pending). Safer: always when overlays clear:

```ts
void maybeRequestInAppReviewUseCase.execute({
  source: 'countdown',
  blockingOverlayVisible: false,
  todayDateKey: getLocalDateKey(new Date()),
});
void maybeRequestInAppReviewUseCase.execute({
  source: 'opens',
  blockingOverlayVisible: false,
  todayDateKey: getLocalDateKey(new Date()),
});
```

Cooldown + pending/opens gates prevent spam. Still use a ref to avoid calling on every AppState flicker more than once per active transition if desired — optional; eligibility already limits.

Also: if share prompt was never pending, countdown completion still set `reviewPending` — the refresh path above handles it when overlays are clear.

- [ ] **Step 3: Create `useInAppReview`**

```ts
import { useCallback } from 'react';
import { requestInAppReviewFromSettingsUseCase } from '../di';

export function useInAppReview() {
  const rateApp = useCallback(() => {
    void requestInAppReviewFromSettingsUseCase.execute();
  }, []);
  return { rateApp };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useEngagementModals.ts src/hooks/useInAppReview.ts src/components/engagement/AppEngagementLayer.tsx
git commit -m "feat: wire in-app review into engagement layer"
```

---

### Task 7: Settings “Rate UNTIL” row

**Files:**
- Modify: `src/surfaces/app/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `useInAppReview().rateApp`
- Produces: visible Settings row

- [ ] **Step 1: Add row under Configuration**

Import `useInAppReview`. After the Widget Design `TouchableOpacity` (before Lost-time alert limit), add:

```tsx
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: theme.glassBorder }]}
                  onPress={() => rateApp()}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowContent}>
                    <Text variant="body" style={{ color: theme.textPrimary }}>
                      Rate UNTIL
                    </Text>
                    <Text
                      variant="caption"
                      style={[
                        styles.rowSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Leave a Play Store or App Store review
                    </Text>
                  </View>
                  <Text
                    style={[styles.chevron, { color: theme.textSecondary }]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
```

In the component body: `const { rateApp } = useInAppReview();`

Copy note: subtitle is concrete; adjust if deslop flags it. Avoid em dashes.

- [ ] **Step 2: Manual smoke check**

Run: `npx tsc --noEmit` (or project’s usual typecheck) and open Settings on a device/emulator; tap Rate UNTIL (dialog may no-op off Play; listing should open on Android when native unavailable / after failure path).

- [ ] **Step 3: Commit**

```bash
git add src/surfaces/app/SettingsScreen.tsx
git commit -m "feat: add Rate UNTIL settings row"
```

---

### Task 8: Spec status + QA notes

**Files:**
- Modify: `docs/superpowers/specs/2026-07-22-in-app-review-design.md` (Status → Implemented when done)
- Optional: one-line note in `docs/PLAY_STORE_ASO.md` only if already documenting store ops — skip if unrelated dirty edits exist

- [ ] **Step 1: Run full related tests**

Run: `npx jest --watchman=false __tests__/inAppReviewEligibility.test.ts __tests__/maybeRequestInAppReview.test.ts`

Expected: PASS

- [ ] **Step 2: Mark spec Implemented**

Set `**Status:** Implemented` in the design spec.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-22-in-app-review-design.md
git commit -m "docs: mark in-app review spec implemented"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Native Play + App Store API | 2 |
| Auto after countdown (after share / when clear) | 5, 6 |
| Auto after opens + 3 days | 1, 3, 5, 6 |
| Settings Rate UNTIL + fallback | 4, 7 |
| 90-day auto cooldown | 1, 4 |
| No stacking with engagement modals | 4, 6 |
| Analytics events | 4 |
| Layer boundaries | 2–7 |
| Unit tests eligibility | 1, 4 |
| iOS empty App Store ID no-op | 2 |

## Self-review notes

- No TBD placeholders left for implementers; `IOS_APP_STORE_ID = ''` is an explicit empty constant to fill later.
- Task 5 preferred path avoids blind opens-path calls during modal-visible frames; Task 6 owns gating.
- Settings successful `requestReview` does not also open listing (avoids double UI).
