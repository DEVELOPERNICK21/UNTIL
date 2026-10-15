# Desktop Companion (Mac + Windows) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-10-15-desktop-companion-design.md`

**Goal:** Ship a Tauri 2 Mac menu-bar / Windows tray companion that shows day percent (or a dash), a compact Home-echo panel, and Google/Apple sign-in on the same Firebase account, with desktop counting as one of 3 devices and at most one active desktop after a confirm-to-replace prompt.

**Architecture:** Keep phone `src/di.ts` as the phone composition root. Extract Home formatters into `src/core/time/homeFormatters.ts` and widen `AccountDevice.platform` so phone and desktop share types, copy, and register-device rules. Put the companion in `desktop/` with its own `desktop/di.ts`, Firebase JS adapters, and a native extra/tray. Phone `CompleteAccountSignInUseCase` stays the phone path. Desktop sign-in is `CompleteDesktopSignInUseCase` plus a UI gate before `replaceConfirmed`.

**Tech Stack:** React Native 0.86 phone app (Jest for shared logic), Tauri 2 + Vite + React for `desktop/`, Firebase JS SDK (`firebase` auth + firestore) on desktop, existing `core/time` + `getProgressColor`, Rust tray/window shell.

## Global Constraints

- Human-copy: no em dashes in user-facing sentences. Empty UI placeholders may use `—`. No coach clichés (`journey`, `gently`, `future self`, …).
- `MAX_ACTIVE_DEVICES` stays 3. Phone-to-phone still hard-caps. Desktop does not replace a phone to make room.
- At most one active `macos`/`windows` device. Replace even under the cap, after confirm.
- Cancel replace: previous desktop stays active; this machine does not complete sign-in (no slot claimed here).
- Extra/tray always visible while the process runs. Signed out or no birth date: dash, not `0%`, not a guessed percent.
- Panel uses the same four Home formatters. No Skia, island, overlay, widgets, Notifee, RevenueCat, or desktop paywall in v1.
- Phone `di.ts` stays the phone root. Desktop UI must not import `src/di`, `src/persistence`, `src/hooks`, or `src/surfaces`.
- Fail closed on device list/write errors (`read_failed` / `write_failed`). `isConclusiveRegistration` stays false for those. Do not strip premium on a network error.
- Same 12s sign-in budget spirit as phone (`COMPLETE_SIGN_IN_BUDGET_MS = 12_000`). Session can exist while the slot is unclaimed.
- Larger window is v1.1 and is out of this plan.
- Do not commit secrets. Firebase web config is public SDK keys, not service-account JSON.

## File map

| File | Responsibility |
|------|----------------|
| `src/core/time/homeFormatters.ts` | `formatDayPassedLeftWithSeconds`, `formatMonthPassedLeft`, `formatYearPassedLeft`, `formatLifePassedLeft`, `extraDayPercentText` |
| `src/core/time/index.ts` | Re-export formatters |
| `src/surfaces/app/HomeScreen.tsx` | Import formatters; delete local copies |
| `.eslintrc.js` | ADR-7 allow `core/time/homeFormatters` and `core/account/accountCopy` |
| `src/types/auth.ts` | `DevicePlatform`, widen `AccountDevice.platform`, `RegisterDeviceResult` union |
| `src/types/index.ts` | Re-export `DevicePlatform` |
| `src/core/account/accountCopy.ts` | Device list label, replace dialog body, `PREMIUM_DEVICES_BENEFIT`, `DEVICE_LIMIT_BANNER_COPY` |
| `src/core/account/deviceLimit.ts` | `isDesktopPlatform`, `planDesktopRegister` |
| `src/domain/useCases/RegisterDeviceUseCase.ts` | Desktop path + `replaceConfirmed` |
| `src/domain/useCases/CompleteDesktopSignInUseCase.ts` | Desktop session finish: register → entitlement read |
| `src/surfaces/app/AccountScreen.tsx` | Copy + `formatAccountDeviceLabel` |
| `src/surfaces/auth/AccountPromptScreen.tsx` | `PREMIUM_DEVICES_BENEFIT` |
| `src/di.ts` | `accountPlatform` return type only (`ios` \| `android` still) |
| `desktop/` | Tauri 2 app: panel UI, extra/tray, local disk, Firebase JS |
| `desktop/di.ts` | Desktop composition root |
| `__tests__/homeFormatters.test.ts` | Formatter + extra dash |
| `__tests__/accountCopy.test.ts` | Labels, replace copy, no “3 phones” |
| `__tests__/deviceLimit.test.ts` | `planDesktopRegister` cases |
| `__tests__/registerDevice.test.ts` | Desktop replace / cancel / 4th phone |
| `__tests__/completeDesktopSignIn.test.ts` | Desktop sign-in results |
| `docs/FOLDER_STRUCTURE.md` | Add `desktop/` |

---

### Task 1: Extract Home formatters

**Files:**
- Create: `src/core/time/homeFormatters.ts`
- Create: `__tests__/homeFormatters.test.ts`
- Modify: `src/core/time/index.ts`
- Modify: `src/surfaces/app/HomeScreen.tsx` (delete local formatters at lines 62–139; import from `../../core/time/homeFormatters`)
- Modify: `.eslintrc.js` (allow `!**/core/time/homeFormatters`)
- Modify: `.cursor/rules/architecture.mdc` (surfaces may import `core/time/homeFormatters` for display)
- Modify: `docs/DECISIONS.md` (ADR-7 / ADR-10 exception list)
- Modify: `docs/ARCHITECTURE.md` (list `homeFormatters.ts` under `core/time/`)

**Interfaces:**
- Consumes: none
- Produces:
  - `formatDayPassedLeftWithSeconds(date: Date): { passedStr: string; leftStr: string; passedPct: number; leftPct: number; progress: number }`
  - `formatMonthPassedLeft(remainingDaysMonth: number, date?: Date): { passedDays: number; leftDays: number; passedPct: number; leftPct: number }`
  - `formatYearPassedLeft(remainingDaysYear: number, date?: Date): { passedDays: number; leftDays: number; passedPct: number; leftPct: number }`
  - `formatLifePassedLeft(lifeProgress: number, remainingDaysLife: number | undefined, deathAge: number): { passedDays: number; leftDays: number; passedPct: number; leftPct: number; totalLifeDays: number }`
  - `extraDayPercentText(input: { signedIn: boolean; hasBirthDate: boolean; now: Date }): string` — `'34%'` or `'—'`
- Day strings stay `Xh Ym Zs`. Month/year `date` defaults to `new Date()` so current Home call sites stay one-argument.

- [ ] **Step 1: Write the failing test**

Create `__tests__/homeFormatters.test.ts`:

```ts
import {
  extraDayPercentText,
  formatDayPassedLeftWithSeconds,
  formatLifePassedLeft,
  formatMonthPassedLeft,
  formatYearPassedLeft,
} from '../src/core/time/homeFormatters';

const NOW = new Date(2026, 2, 15, 8, 12, 4); // 15 Mar 2026, 08:12:04 local

describe('homeFormatters', () => {
  it('formats day passed / left with seconds', () => {
    const day = formatDayPassedLeftWithSeconds(NOW);
    expect(day.passedStr).toBe('8h 12m 4s');
    expect(day.leftStr).toBe('15h 47m 55s');
    expect(day.passedPct).toBe(34);
    expect(day.leftPct).toBe(66);
    expect(day.progress).toBeCloseTo(29524000 / 86399999, 10);
  });

  it('formats month from remaining days using the given date', () => {
    expect(formatMonthPassedLeft(16, NOW)).toEqual({
      passedDays: 15,
      leftDays: 16,
      passedPct: 48,
      leftPct: 52,
    });
  });

  it('formats year from remaining days using the given date', () => {
    expect(formatYearPassedLeft(291, NOW)).toEqual({
      passedDays: 74,
      leftDays: 291,
      passedPct: 20,
      leftPct: 80,
    });
  });

  it('formats life from progress, remaining days, and death age', () => {
    expect(formatLifePassedLeft(0.42, 15000, 80)).toEqual({
      passedDays: 14220,
      leftDays: 15000,
      passedPct: 42,
      leftPct: 58,
      totalLifeDays: 29220,
    });
  });

  it('shows 0–100 in the extra when signed in with a birth date', () => {
    expect(
      extraDayPercentText({ signedIn: true, hasBirthDate: true, now: NOW }),
    ).toBe('34%');
  });

  it('shows a dash in the extra when signed out', () => {
    expect(
      extraDayPercentText({ signedIn: false, hasBirthDate: true, now: NOW }),
    ).toBe('—');
  });

  it('shows a dash in the extra when there is no birth date', () => {
    expect(
      extraDayPercentText({ signedIn: true, hasBirthDate: false, now: NOW }),
    ).toBe('—');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test __tests__/homeFormatters.test.ts -v`

Expected: FAIL (module missing)

- [ ] **Step 3: Implement formatters and re-export**

Create `src/core/time/homeFormatters.ts`:

```ts
export function formatDayPassedLeftWithSeconds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  const passedMs = date.getTime() - start.getTime();
  const remainingMs = Math.max(0, end.getTime() - date.getTime());
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const passedS = Math.floor(passedMs / 1000);
  const remainingS = Math.floor(remainingMs / 1000);
  const passedH = Math.floor(passedS / 3600);
  const passedM = Math.floor((passedS % 3600) / 60);
  const passedSec = passedS % 60;
  const leftH = Math.floor(remainingS / 3600);
  const leftM = Math.floor((remainingS % 3600) / 60);
  const leftSec = remainingS % 60;
  const passedStr = `${passedH}h ${passedM}m ${passedSec}s`;
  const leftStr = `${leftH}h ${leftM}m ${leftSec}s`;
  const progress = Math.min(1, Math.max(0, passedMs / totalMs));
  const passedPct = Math.round(progress * 100);
  const leftPct = 100 - passedPct;
  return { passedStr, leftStr, passedPct, leftPct, progress };
}

export function formatMonthPassedLeft(
  remainingDaysMonth: number,
  date: Date = new Date(),
) {
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const passedDays = daysInMonth - remainingDaysMonth;
  const passedPct = Math.round((passedDays / daysInMonth) * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remainingDaysMonth,
    passedPct,
    leftPct,
  };
}

export function formatYearPassedLeft(
  remainingDaysYear: number,
  date: Date = new Date(),
) {
  const y = date.getFullYear();
  const daysInYear =
    (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
  const passedDays = daysInYear - remainingDaysYear;
  const passedPct = Math.round((passedDays / daysInYear) * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remainingDaysYear,
    passedPct,
    leftPct,
  };
}

export function formatLifePassedLeft(
  lifeProgress: number,
  remainingDaysLife: number | undefined,
  deathAge: number,
) {
  const totalLifeDays = Math.round(deathAge * 365.25);
  const remaining = remainingDaysLife ?? 0;
  const passedDays = totalLifeDays - remaining;
  const passedPct = Math.round(lifeProgress * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remaining,
    passedPct,
    leftPct,
    totalLifeDays,
  };
}

export function extraDayPercentText(input: {
  signedIn: boolean;
  hasBirthDate: boolean;
  now: Date;
}): string {
  if (!input.signedIn || !input.hasBirthDate) return '—';
  return `${formatDayPassedLeftWithSeconds(input.now).passedPct}%`;
}
```

Add to `src/core/time/index.ts`:

```ts
export * from './homeFormatters';
```

In `HomeScreen.tsx`, delete `getDaysInMonth`, `getDaysInYear`, and the four local formatters. Add:

```ts
import {
  formatDayPassedLeftWithSeconds,
  formatLifePassedLeft,
  formatMonthPassedLeft,
  formatYearPassedLeft,
} from '../../core/time/homeFormatters';
```

Leave the call sites at `formatDayPassedLeftWithSeconds(liveNow)`, `formatMonthPassedLeft(remainingDaysMonth)`, `formatYearPassedLeft(remainingDaysYear)`, and `formatLifePassedLeft(...)` unchanged.

In `.eslintrc.js`, change the CORE forbid list to:

```js
const CORE = forbid(
  [
    ...CORE_DIRS.map(dir => `**/core/${dir}/*`),
    '!**/core/time/clock',
    '!**/core/time/homeFormatters',
    '!**/core/account/accountCopy',
  ],
  CORE_MESSAGE,
);
```

(`accountCopy` is used in Task 2; adding the exception now avoids a second eslint edit.)

Update ADR-7 wording in `docs/DECISIONS.md` and the surfaces import line in `.cursor/rules/architecture.mdc` so both name `core/time/clock` and `core/time/homeFormatters` as display-formatting exceptions. Add `homeFormatters.ts` under `core/time/` in `docs/ARCHITECTURE.md`.

- [ ] **Step 4: Run tests and lint to verify they pass**

Run:

```
yarn test __tests__/homeFormatters.test.ts -v
yarn lint src/surfaces/app/HomeScreen.tsx src/core/time/homeFormatters.ts
```

Expected: PASS. HomeScreen lint must not error on the `homeFormatters` import.

- [ ] **Step 5: Commit**

```bash
git add src/core/time/homeFormatters.ts src/core/time/index.ts src/surfaces/app/HomeScreen.tsx __tests__/homeFormatters.test.ts .eslintrc.js .cursor/rules/architecture.mdc docs/DECISIONS.md docs/ARCHITECTURE.md
git commit -m "$(cat <<'EOF'
Extract Home time formatters so desktop can share them.

EOF
)"
```

---

### Task 2: Widen device platform and phone copy

**Files:**
- Create: `src/core/account/accountCopy.ts`
- Create: `__tests__/accountCopy.test.ts`
- Modify: `src/types/auth.ts`
- Modify: `src/types/index.ts`
- Modify: `src/surfaces/app/AccountScreen.tsx`
- Modify: `src/surfaces/auth/AccountPromptScreen.tsx`
- Modify: `src/domain/useCases/RegisterDeviceUseCase.ts` (constructor `getPlatform` type only)
- Modify: `src/di.ts` (`accountPlatform` return type `DevicePlatform`, body still ios/android)

**Interfaces:**
- Consumes: `AccountDevice` from `src/types/auth.ts`
- Produces:
  - `export type DevicePlatform = 'ios' | 'android' | 'macos' | 'windows'`
  - `AccountDevice.platform: DevicePlatform`
  - `PREMIUM_DEVICES_BENEFIT = 'Premium on up to 3 devices'`
  - `DEVICE_LIMIT_BANNER_COPY = 'This account is already used on 3 devices. Remove one to unlock premium here.'`
  - `formatAccountDeviceLabel(device: Pick<AccountDevice, 'id' | 'platform' | 'label'>): string`
  - `replaceDesktopBody(existing: Pick<AccountDevice, 'label' | 'platform'>): string`
- `RegisterDeviceUseCase` constructor `getPlatform: () => DevicePlatform`. Phone wiring still returns `'ios'` or `'android'`. No desktop register behavior yet.

- [ ] **Step 1: Write the failing test**

Create `__tests__/accountCopy.test.ts`:

```ts
import {
  DEVICE_LIMIT_BANNER_COPY,
  PREMIUM_DEVICES_BENEFIT,
  formatAccountDeviceLabel,
  replaceDesktopBody,
} from '../src/core/account/accountCopy';

describe('accountCopy', () => {
  it('says devices, not phones, in the sign-in benefit', () => {
    expect(PREMIUM_DEVICES_BENEFIT).toBe('Premium on up to 3 devices');
    expect(PREMIUM_DEVICES_BENEFIT).not.toMatch(/phones/);
  });

  it('keeps the existing device-cap banner', () => {
    expect(DEVICE_LIMIT_BANNER_COPY).toBe(
      'This account is already used on 3 devices. Remove one to unlock premium here.',
    );
  });

  it('labels Mac and Windows instead of swallowing them as Android', () => {
    expect(
      formatAccountDeviceLabel({
        id: 'aaaa1111',
        platform: 'macos',
        label: null,
      }),
    ).toBe('Mac');
    expect(
      formatAccountDeviceLabel({
        id: 'bbbb2222',
        platform: 'windows',
        label: null,
      }),
    ).toBe('Windows');
    expect(
      formatAccountDeviceLabel({
        id: 'mac-1',
        platform: 'macos',
        label: 'Nick’s MacBook',
      }),
    ).toBe('Nick’s MacBook');
  });

  it('keeps phone fallbacks with the last 4 of the id', () => {
    expect(
      formatAccountDeviceLabel({
        id: 'abcdxyz9',
        platform: 'ios',
        label: null,
      }),
    ).toBe('iPhone · XYZ9');
  });

  it('builds the replace dialog body from label or platform', () => {
    expect(
      replaceDesktopBody({ label: 'Nick’s MacBook', platform: 'macos' }),
    ).toBe(
      'UNTIL is already signed in on Nick’s MacBook. Signing in here turns that one off.',
    );
    expect(replaceDesktopBody({ label: null, platform: 'macos' })).toBe(
      'UNTIL is already signed in on Mac. Signing in here turns that one off.',
    );
    expect(replaceDesktopBody({ label: null, platform: 'windows' })).toBe(
      'UNTIL is already signed in on Windows. Signing in here turns that one off.',
    );
    expect(replaceDesktopBody({ label: null, platform: 'ios' })).toBe(
      'UNTIL is already signed in on another computer. Signing in here turns that one off.',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test __tests__/accountCopy.test.ts -v`

Expected: FAIL (module missing)

- [ ] **Step 3: Implement types and copy helpers, then wire screens**

`src/types/auth.ts` — replace the platform field and export the alias:

```ts
export type DevicePlatform = 'ios' | 'android' | 'macos' | 'windows';

export interface AccountDevice {
  id: string;
  platform: DevicePlatform;
  label: string | null;
  lastSeenAt: number;
  createdAt: number;
  active: boolean;
}
```

`src/types/index.ts` — add `DevicePlatform` to the `./auth` type export list.

`src/core/account/accountCopy.ts`:

```ts
import type { AccountDevice, DevicePlatform } from '../../types';

export const PREMIUM_DEVICES_BENEFIT = 'Premium on up to 3 devices';

export const DEVICE_LIMIT_BANNER_COPY =
  'This account is already used on 3 devices. Remove one to unlock premium here.';

export function formatAccountDeviceLabel(
  device: Pick<AccountDevice, 'id' | 'platform' | 'label'>,
): string {
  if (device.label) return device.label;
  switch (device.platform) {
    case 'ios':
      return `iPhone · ${device.id.slice(-4).toUpperCase()}`;
    case 'android':
      return `Android phone · ${device.id.slice(-4).toUpperCase()}`;
    case 'macos':
      return 'Mac';
    case 'windows':
      return 'Windows';
  }
}

export function replaceDesktopBody(
  existing: Pick<AccountDevice, 'label' | 'platform'>,
): string {
  const name = existing.label?.trim()
    ? existing.label.trim()
    : existing.platform === 'macos'
      ? 'Mac'
      : existing.platform === 'windows'
        ? 'Windows'
        : 'another computer';
  return `UNTIL is already signed in on ${name}. Signing in here turns that one off.`;
}

export function replaceDesktopFallback(platform: DevicePlatform): string {
  if (platform === 'macos') return 'Mac';
  if (platform === 'windows') return 'Windows';
  return 'another computer';
}
```

In `AccountScreen.tsx`:
- Import `DEVICE_LIMIT_BANNER_COPY`, `PREMIUM_DEVICES_BENEFIT`, `formatAccountDeviceLabel` from `../../core/account/accountCopy`.
- Remove the local `DEVICE_LIMIT_BANNER_COPY` constant.
- Change `SIGN_IN_BENEFITS` so the second line is `PREMIUM_DEVICES_BENEFIT`.
- Replace local `deviceLabel` with `formatAccountDeviceLabel`.
- Keep the heading `Up to 3 devices per account.`

In `AccountPromptScreen.tsx`, change `BENEFITS` so the second line is `PREMIUM_DEVICES_BENEFIT` (import it). Leave `'DOB and life settings'` as the first line.

`RegisterDeviceUseCase.ts` constructor:

```ts
private readonly getPlatform: () => DevicePlatform,
```

Import `DevicePlatform` from `../../types`. `src/di.ts`:

```ts
import type { DevicePlatform } from './types';

const accountPlatform = (): DevicePlatform =>
  Platform.OS === 'ios' ? 'ios' : 'android';
```

Do not change `BindEntitlementToAccountUseCase.getPlatform` (`'ios' | 'android'`). Desktop does not bind purchases.

- [ ] **Step 4: Run tests and lint**

Run:

```
yarn test __tests__/accountCopy.test.ts __tests__/registerDevice.test.ts -v
yarn lint src/surfaces/app/AccountScreen.tsx src/surfaces/auth/AccountPromptScreen.tsx src/core/account/accountCopy.ts src/types/auth.ts
```

Expected: PASS. Existing register tests still pass because `'ios'` / `'android'` remain valid `DevicePlatform` values.

- [ ] **Step 5: Commit**

```bash
git add src/types/auth.ts src/types/index.ts src/core/account/accountCopy.ts src/surfaces/app/AccountScreen.tsx src/surfaces/auth/AccountPromptScreen.tsx src/domain/useCases/RegisterDeviceUseCase.ts src/di.ts __tests__/accountCopy.test.ts
git commit -m "$(cat <<'EOF'
Treat Mac and Windows as devices in account copy and types.

EOF
)"
```

---

### Task 3: Desktop register path (confirm, then replace)

**Files:**
- Modify: `src/core/account/deviceLimit.ts`
- Modify: `src/types/auth.ts` (`RegisterDeviceResult` union)
- Modify: `src/domain/useCases/RegisterDeviceUseCase.ts`
- Modify: `__tests__/deviceLimit.test.ts`
- Modify: `__tests__/registerDevice.test.ts`
- Create: `src/domain/useCases/CompleteDesktopSignInUseCase.ts`
- Create: `__tests__/completeDesktopSignIn.test.ts`

**Interfaces:**
- Consumes: `canRegisterDevice`, `AccountDevice`, `IAccountCloudStore.setDeviceActive`
- Produces:
  - `isDesktopPlatform(platform: DevicePlatform): boolean`
  - `planDesktopRegister(devices: AccountDevice[], deviceId: string): DesktopRegisterPlan`
  - `DesktopRegisterPlan = { kind: 'register' } | { kind: 'needs_replace'; existing: AccountDevice } | { kind: 'limit_reached' }`
  - `RegisterDeviceOptions = { replaceConfirmed?: boolean }`
  - `RegisterDeviceUseCase.execute(uid: string, now?: number, options?: RegisterDeviceOptions): Promise<RegisterDeviceResult>`
  - `RegisterDeviceResult`:
    - `{ registered: true; deviceId: string }`
    - `{ registered: false; deviceId: string; reason: RegisterDeviceFailureReason }`
    - `{ registered: false; deviceId: string; needsReplace: true; existing: AccountDevice }`
  - `CompleteDesktopSignInUseCase.execute(user, { replaceConfirmed?, now? }): Promise<DesktopSignInResult>`
  - `DesktopSignInResult = { status: 'registered'; user; entitlement } | { status: 'needs_replace'; user; existing } | { status: 'limit_reached'; user } | { status: 'incomplete'; user }`
- Phone `execute(uid, now)` with ios/android platform must keep current behavior. Do not change `CompleteAccountSignInUseCase`.
- Confirm is a UI gate. The use case must not deactivate until `replaceConfirmed: true`.

Plan order (unique desktop, cap still 3):

1. Same id already **active**: `{ kind: 'register' }` (refresh, no prompt).
2. Another **active** macos/windows with a different id: `{ kind: 'needs_replace', existing }` even if this id exists inactive, even under the cap.
3. Else `canRegisterDevice`: register or `limit_reached`. Three phones and no desktop → `limit_reached`. Do not replace a phone.

- [ ] **Step 1: Write failing `planDesktopRegister` tests**

Append to `__tests__/deviceLimit.test.ts`:

```ts
import type { AccountDevice } from '../src/types';
import {
  isDesktopPlatform,
  planDesktopRegister,
} from '../src/core/account/deviceLimit';

function device(
  id: string,
  active: boolean,
  platform: AccountDevice['platform'] = 'android',
): AccountDevice {
  return {
    id,
    platform,
    label: null,
    lastSeenAt: 1,
    createdAt: 1,
    active,
  };
}

describe('planDesktopRegister', () => {
  it('registers the same already-active desktop with no replace', () => {
    const devices = [
      device('phone', true, 'ios'),
      device('mac-1', true, 'macos'),
    ];
    expect(planDesktopRegister(devices, 'mac-1')).toEqual({ kind: 'register' });
  });

  it('asks to replace an active Mac when signing in on a new Windows machine', () => {
    const mac = device('mac-1', true, 'macos');
    mac.label = 'Nick’s MacBook';
    const devices = [device('phone', true, 'ios'), mac];
    expect(planDesktopRegister(devices, 'win-1')).toEqual({
      kind: 'needs_replace',
      existing: mac,
    });
  });

  it('asks to replace even when this machine’s old id is inactive', () => {
    const win = device('win-1', true, 'windows');
    const devices = [
      device('mac-1', false, 'macos'),
      win,
    ];
    expect(planDesktopRegister(devices, 'mac-1')).toEqual({
      kind: 'needs_replace',
      existing: win,
    });
  });

  it('blocks a new desktop when three phones are active', () => {
    const devices = [
      device('a', true, 'ios'),
      device('b', true, 'android'),
      device('c', true, 'ios'),
    ];
    expect(planDesktopRegister(devices, 'mac-1')).toEqual({
      kind: 'limit_reached',
    });
  });

  it('registers a first desktop when under the cap', () => {
    expect(
      planDesktopRegister([device('phone', true, 'ios')], 'mac-1'),
    ).toEqual({ kind: 'register' });
  });
});

describe('isDesktopPlatform', () => {
  it('treats macos and windows as desktop', () => {
    expect(isDesktopPlatform('macos')).toBe(true);
    expect(isDesktopPlatform('windows')).toBe(true);
    expect(isDesktopPlatform('ios')).toBe(false);
    expect(isDesktopPlatform('android')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `yarn test __tests__/deviceLimit.test.ts -v`

Expected: FAIL (`planDesktopRegister` / `isDesktopPlatform` not exported)

- [ ] **Step 3: Implement `planDesktopRegister`**

Add to `src/core/account/deviceLimit.ts` (keep existing `canRegisterDevice` unchanged):

```ts
import type { AccountDevice, DevicePlatform, RegisterDeviceResult } from '../../types';

export function isDesktopPlatform(platform: DevicePlatform): boolean {
  return platform === 'macos' || platform === 'windows';
}

export type DesktopRegisterPlan =
  | { kind: 'register' }
  | { kind: 'needs_replace'; existing: AccountDevice }
  | { kind: 'limit_reached' };

export function planDesktopRegister(
  devices: AccountDevice[],
  deviceId: string,
): DesktopRegisterPlan {
  const existingSelf = devices.find(d => d.id === deviceId);
  if (existingSelf?.active) return { kind: 'register' };

  const otherDesktop = devices.find(
    d => d.active && isDesktopPlatform(d.platform) && d.id !== deviceId,
  );
  if (otherDesktop) {
    return { kind: 'needs_replace', existing: otherDesktop };
  }

  const decision = canRegisterDevice(devices, deviceId);
  if (!decision.ok) return { kind: 'limit_reached' };
  return { kind: 'register' };
}

export function isConclusiveRegistration(result: RegisterDeviceResult): boolean {
  if ('needsReplace' in result && result.needsReplace) return false;
  return result.registered || result.reason === 'limit_reached';
}
```

Replace `RegisterDeviceResult` in `src/types/auth.ts` with:

```ts
export type RegisterDeviceResult =
  | { registered: true; deviceId: string }
  | { registered: false; deviceId: string; reason: RegisterDeviceFailureReason }
  | {
      registered: false;
      deviceId: string;
      needsReplace: true;
      existing: AccountDevice;
    };
```

- [ ] **Step 4: Run deviceLimit tests — expect PASS**

Run: `yarn test __tests__/deviceLimit.test.ts -v`

Expected: PASS. If `__tests__/registerDevice.test.ts` or `__tests__/signInDevicePolicy.test.ts` fail on the union type, fix those tests to use `registered: true` without extra keys (they already do).

- [ ] **Step 5: Write failing RegisterDeviceUseCase desktop tests**

Append to `__tests__/registerDevice.test.ts` (extend `makeCloud` so it records `setDeviceActive`):

Change `makeCloud` to:

```ts
function makeCloud(devices: AccountDevice[]) {
  const upserted: AccountDevice[] = [];
  const activations: Array<{ deviceId: string; active: boolean }> = [];
  const cloud: IAccountCloudStore = {
    getProfile: async () => null,
    upsertProfile: async () => {},
    listDevices: async () => devices,
    upsertDevice: async (_uid: string, device: AccountDevice) => {
      upserted.push(device);
    },
    setDeviceActive: async (_uid, deviceId, active) => {
      activations.push({ deviceId, active });
    },
    getEntitlement: async () => null,
    setEntitlement: async () => {},
    deleteUserData: async () => {},
  };
  return { cloud, upserted, activations };
}
```

Add:

```ts
function makeDesktop(
  id: string,
  active: boolean,
  platform: 'macos' | 'windows' = 'macos',
): AccountDevice {
  return {
    id,
    platform,
    label: platform === 'macos' ? 'Nick’s MacBook' : 'Office PC',
    lastSeenAt: 1_000,
    createdAt: 1_000,
    active,
  };
}

describe('RegisterDeviceUseCase desktop path', () => {
  const desktopIds: IDeviceIdProvider = {
    getDeviceId: async () => 'win-1',
  };

  it('does not deactivate until replace is confirmed', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDevice('phone', true),
      makeDesktop('mac-1', true, 'macos'),
    ]);
    const useCase = new RegisterDeviceUseCase(
      cloud,
      desktopIds,
      () => 'windows',
    );
    const result = await useCase.execute('uid-1', NOW);

    expect(result).toEqual({
      registered: false,
      deviceId: 'win-1',
      needsReplace: true,
      existing: expect.objectContaining({ id: 'mac-1', platform: 'macos' }),
    });
    expect(upserted).toHaveLength(0);
    expect(activations).toHaveLength(0);
    expect(isConclusiveRegistration(result)).toBe(false);
  });

  it('deactivates the previous desktop then registers after confirm', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDevice('phone', true),
      makeDesktop('mac-1', true, 'macos'),
    ]);
    const useCase = new RegisterDeviceUseCase(
      cloud,
      desktopIds,
      () => 'windows',
    );
    const result = await useCase.execute('uid-1', NOW, {
      replaceConfirmed: true,
    });

    expect(result).toEqual({ registered: true, deviceId: 'win-1' });
    expect(activations).toEqual([{ deviceId: 'mac-1', active: false }]);
    expect(upserted[0]).toEqual(
      expect.objectContaining({
        id: 'win-1',
        platform: 'windows',
        active: true,
      }),
    );
  });

  it('leaves the previous desktop in place when confirm is omitted (cancel)', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDesktop('mac-1', true, 'macos'),
    ]);
    const useCase = new RegisterDeviceUseCase(
      cloud,
      desktopIds,
      () => 'windows',
    );
    await useCase.execute('uid-1', NOW);
    expect(activations).toHaveLength(0);
    expect(upserted).toHaveLength(0);
  });

  it('does not replace a phone when three phones are active', async () => {
    const { cloud, upserted, activations } = makeCloud([
      makeDevice('a', true),
      makeDevice('b', true),
      makeDevice('c', true),
    ]);
    const useCase = new RegisterDeviceUseCase(
      cloud,
      desktopIds,
      () => 'macos',
    );
    const result = await useCase.execute('uid-1', NOW);
    expect(result).toEqual({
      registered: false,
      deviceId: 'win-1',
      reason: 'limit_reached',
    });
    expect(isConclusiveRegistration(result)).toBe(true);
    expect(activations).toHaveLength(0);
    expect(upserted).toHaveLength(0);
  });

  it('keeps a fourth phone blocked on the phone path', async () => {
    const { cloud } = makeCloud([
      makeDevice('a', true),
      makeDevice('b', true),
      makeDevice('c', true),
    ]);
    const useCase = new RegisterDeviceUseCase(
      cloud,
      deviceIdProvider,
      () => 'ios',
    );
    const result = await useCase.execute('uid-1', NOW);
    expect(result.reason).toBe('limit_reached');
  });
});
```

- [ ] **Step 6: Run register tests — expect FAIL on desktop cases**

Run: `yarn test __tests__/registerDevice.test.ts -v`

Expected: FAIL (execute does not accept options / never returns `needsReplace`)

- [ ] **Step 7: Implement desktop path in `RegisterDeviceUseCase`**

```ts
import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../ports/IDeviceIdProvider';
import type {
  AccountDevice,
  DevicePlatform,
  RegisterDeviceResult,
} from '../../types';
import {
  canRegisterDevice,
  isDesktopPlatform,
  planDesktopRegister,
} from '../../core/account/deviceLimit';

export type RegisterDeviceOptions = {
  replaceConfirmed?: boolean;
};

export class RegisterDeviceUseCase {
  constructor(
    private readonly cloud: IAccountCloudStore,
    private readonly deviceIdProvider: IDeviceIdProvider,
    private readonly getPlatform: () => DevicePlatform,
    private readonly getDeviceLabel?: () => string | null,
    private readonly onError?: (error: unknown, context: string) => void,
  ) {}

  async execute(
    uid: string,
    now: number = Date.now(),
    options: RegisterDeviceOptions = {},
  ): Promise<RegisterDeviceResult> {
    const deviceId = await this.deviceIdProvider.getDeviceId();
    const platform = this.getPlatform();

    let devices: AccountDevice[];
    try {
      devices = await this.cloud.listDevices(uid);
    } catch (e) {
      this.onError?.(e, 'RegisterDeviceUseCase.listDevices');
      return { registered: false, deviceId, reason: 'read_failed' };
    }

    if (isDesktopPlatform(platform)) {
      const plan = planDesktopRegister(devices, deviceId);
      if (plan.kind === 'needs_replace' && !options.replaceConfirmed) {
        return {
          registered: false,
          deviceId,
          needsReplace: true,
          existing: plan.existing,
        };
      }
      if (plan.kind === 'needs_replace' && options.replaceConfirmed) {
        try {
          await this.cloud.setDeviceActive(uid, plan.existing.id, false);
        } catch (e) {
          this.onError?.(e, 'RegisterDeviceUseCase.replaceDesktop');
          return { registered: false, deviceId, reason: 'write_failed' };
        }
      }
      if (plan.kind === 'limit_reached') {
        return { registered: false, deviceId, reason: 'limit_reached' };
      }
    } else {
      const decision = canRegisterDevice(devices, deviceId);
      if (!decision.ok) {
        return { registered: false, deviceId, reason: decision.reason };
      }
    }

    const existing = devices.find(d => d.id === deviceId);
    const device: AccountDevice = {
      id: deviceId,
      platform,
      label: this.getDeviceLabel?.() ?? existing?.label ?? null,
      lastSeenAt: now,
      createdAt: existing?.createdAt ?? now,
      active: true,
    };

    try {
      await this.cloud.upsertDevice(uid, device);
    } catch (e) {
      this.onError?.(e, 'RegisterDeviceUseCase.upsertDevice');
      return { registered: false, deviceId, reason: 'write_failed' };
    }

    return { registered: true, deviceId };
  }
}
```

Update the file header comment from “this phone” to “this device”.

- [ ] **Step 8: Write failing CompleteDesktopSignIn tests**

Create `src/domain/useCases/CompleteDesktopSignInUseCase.ts` only after the test exists. Create `__tests__/completeDesktopSignIn.test.ts`:

```ts
import { CompleteDesktopSignInUseCase } from '../src/domain/useCases/CompleteDesktopSignInUseCase';
import { RegisterDeviceUseCase } from '../src/domain/useCases/RegisterDeviceUseCase';
import type { IAccountCloudStore } from '../src/domain/ports/IAccountCloudStore';
import type { IDeviceIdProvider } from '../src/domain/ports/IDeviceIdProvider';
import type { AccountDevice, AuthUser, CloudEntitlement } from '../src/types';

const USER: AuthUser = {
  uid: 'uid-1',
  email: 'a@b.com',
  displayName: null,
  providers: ['google'],
};

const ENTITLEMENT: CloudEntitlement = {
  active: true,
  source: 'app_store',
  purchaseType: 'yearly',
  lastValidatedAt: 1,
};

function makeDevice(
  id: string,
  active: boolean,
  platform: AccountDevice['platform'],
): AccountDevice {
  return {
    id,
    platform,
    label: null,
    lastSeenAt: 1,
    createdAt: 1,
    active,
  };
}

function makeCloud(devices: AccountDevice[], entitlement: CloudEntitlement | null = ENTITLEMENT) {
  const cloud: IAccountCloudStore = {
    getProfile: async () => null,
    upsertProfile: async () => {},
    listDevices: async () => devices,
    upsertDevice: async () => {},
    setDeviceActive: async () => {},
    getEntitlement: async () => entitlement,
    setEntitlement: async () => {},
    deleteUserData: async () => {},
  };
  return cloud;
}

const deviceIdProvider: IDeviceIdProvider = {
  getDeviceId: async () => 'win-1',
};

function makeUseCase(cloud: IAccountCloudStore) {
  const registerDevice = new RegisterDeviceUseCase(
    cloud,
    deviceIdProvider,
    () => 'windows',
  );
  return new CompleteDesktopSignInUseCase(cloud, registerDevice);
}

describe('CompleteDesktopSignInUseCase', () => {
  it('returns needs_replace without claiming this machine', async () => {
    const cloud = makeCloud([makeDevice('mac-1', true, 'macos')]);
    const result = await makeUseCase(cloud).execute(USER);
    expect(result).toEqual({
      status: 'needs_replace',
      user: USER,
      existing: expect.objectContaining({ id: 'mac-1' }),
    });
  });

  it('registers and reads entitlement after confirm', async () => {
    const cloud = makeCloud([makeDevice('mac-1', true, 'macos')]);
    const result = await makeUseCase(cloud).execute(USER, {
      replaceConfirmed: true,
    });
    expect(result).toEqual({
      status: 'registered',
      user: USER,
      entitlement: ENTITLEMENT,
    });
  });

  it('returns limit_reached for three phones', async () => {
    const cloud = makeCloud([
      makeDevice('a', true, 'ios'),
      makeDevice('b', true, 'android'),
      makeDevice('c', true, 'ios'),
    ]);
    const result = await makeUseCase(cloud).execute(USER);
    expect(result.status).toBe('limit_reached');
  });

  it('returns incomplete when the device list cannot be read', async () => {
    const cloud = makeCloud([]);
    cloud.listDevices = async () => {
      throw new Error('offline');
    };
    const result = await makeUseCase(cloud).execute(USER);
    expect(result.status).toBe('incomplete');
  });
});
```

- [ ] **Step 9: Run — expect FAIL**

Run: `yarn test __tests__/completeDesktopSignIn.test.ts -v`

Expected: FAIL (module missing)

- [ ] **Step 10: Implement `CompleteDesktopSignInUseCase`**

```ts
import type { IAccountCloudStore } from '../ports/IAccountCloudStore';
import type {
  AccountDevice,
  AuthUser,
  CloudEntitlement,
  RegisterDeviceResult,
} from '../../types';
import type { RegisterDeviceUseCase } from './RegisterDeviceUseCase';
import { withTimeout } from '../../core/account/withTimeout';

export const COMPLETE_DESKTOP_SIGN_IN_BUDGET_MS = 12_000;

export type DesktopSignInResult =
  | { status: 'registered'; user: AuthUser; entitlement: CloudEntitlement | null }
  | { status: 'needs_replace'; user: AuthUser; existing: AccountDevice }
  | { status: 'limit_reached'; user: AuthUser }
  | { status: 'incomplete'; user: AuthUser };

export class CompleteDesktopSignInUseCase {
  constructor(
    private readonly cloud: IAccountCloudStore,
    private readonly registerDevice: RegisterDeviceUseCase,
    private readonly onError?: (error: unknown, context: string) => void,
  ) {}

  async execute(
    user: AuthUser,
    options: { replaceConfirmed?: boolean; now?: number } = {},
  ): Promise<DesktopSignInResult> {
    try {
      return await withTimeout(
        this.finish(user, options),
        COMPLETE_DESKTOP_SIGN_IN_BUDGET_MS,
        'completeDesktopSignIn',
      );
    } catch (e) {
      this.onError?.(e, 'CompleteDesktopSignInUseCase.budget');
      return { status: 'incomplete', user };
    }
  }

  private async finish(
    user: AuthUser,
    options: { replaceConfirmed?: boolean; now?: number },
  ): Promise<DesktopSignInResult> {
    let registration: RegisterDeviceResult;
    try {
      registration = await this.registerDevice.execute(
        user.uid,
        options.now ?? Date.now(),
        { replaceConfirmed: options.replaceConfirmed },
      );
    } catch (e) {
      this.onError?.(e, 'CompleteDesktopSignInUseCase.registerDevice');
      return { status: 'incomplete', user };
    }

    if ('needsReplace' in registration && registration.needsReplace) {
      return { status: 'needs_replace', user, existing: registration.existing };
    }
    if (!registration.registered && registration.reason === 'limit_reached') {
      return { status: 'limit_reached', user };
    }
    if (!registration.registered) {
      return { status: 'incomplete', user };
    }

    let entitlement: CloudEntitlement | null = null;
    try {
      entitlement = await this.cloud.getEntitlement(user.uid);
    } catch (e) {
      this.onError?.(e, 'CompleteDesktopSignInUseCase.getEntitlement');
    }
    return { status: 'registered', user, entitlement };
  }
}
```

Do not instantiate this class in phone `src/di.ts`. Desktop `desktop/di.ts` (Task 6) will.

- [ ] **Step 11: Run the new tests**

Run:

```
yarn test __tests__/deviceLimit.test.ts __tests__/registerDevice.test.ts __tests__/completeDesktopSignIn.test.ts __tests__/signInDevicePolicy.test.ts -v
```

Expected: PASS. Phone sign-in policy tests unchanged.

- [ ] **Step 12: Commit**

```bash
git add src/core/account/deviceLimit.ts src/types/auth.ts src/domain/useCases/RegisterDeviceUseCase.ts src/domain/useCases/CompleteDesktopSignInUseCase.ts __tests__/deviceLimit.test.ts __tests__/registerDevice.test.ts __tests__/completeDesktopSignIn.test.ts
git commit -m "$(cat <<'EOF'
Ask before replacing the previous desktop device slot.

EOF
)"
```

---

### Task 4: Scaffold the Tauri companion shell

**Files:**
- Create: `desktop/package.json`
- Create: `desktop/vite.config.ts`
- Create: `desktop/tsconfig.json`
- Create: `desktop/tsconfig.node.json`
- Create: `desktop/index.html`
- Create: `desktop/src/main.tsx`
- Create: `desktop/src/App.tsx`
- Create: `desktop/src/panel.css`
- Create: `desktop/src-tauri/Cargo.toml`
- Create: `desktop/src-tauri/build.rs`
- Create: `desktop/src-tauri/tauri.conf.json`
- Create: `desktop/src-tauri/capabilities/default.json`
- Create: `desktop/src-tauri/src/main.rs`
- Create: `desktop/src-tauri/src/lib.rs`
- Create: `desktop/README.md`
- Modify: `.gitignore` (`desktop/node_modules`, `desktop/dist`, `desktop/src-tauri/target`)
- Modify: `.eslintrc.js` (forbid `desktop/**` from importing `src/di`, `src/persistence`, `src/hooks`, `src/surfaces`)
- Modify: `docs/FOLDER_STRUCTURE.md` (add `desktop/` at repo root)

**Interfaces:**
- Consumes: none from Tasks 1–3 yet (shell only)
- Produces:
  - Tauri window label `'panel'`, initially hidden, 380×520, not resizable
  - Tray id `'until-extra'`, initial title/tooltip `'—'`
  - Left-click extra/tray toggles panel visibility
  - `set_extra(text: string, png: number[] | null)` command
- Prerequisite: Rust via rustup (`rustc --version` works). Node 20+.

- [ ] **Step 1: Add gitignore and eslint guard (no companion process yet)**

Append to `.gitignore`:

```
# Desktop companion (Tauri)
desktop/node_modules
desktop/dist
desktop/src-tauri/target
```

Add an eslint override after the existing `overrides` entries:

```js
layer(
  ['desktop/**/*.ts', 'desktop/**/*.tsx'],
  [
    forbid(['**/di', '../src/di', '../../src/di'], 'Desktop must use desktop/di.ts, not phone di.'),
    forbid(
      ['**/persistence', '**/persistence/*'],
      'Desktop does not use MMKV / phone persistence.',
    ),
    forbid(['**/hooks', '**/hooks/*'], 'Desktop does not import phone hooks.'),
    forbid(
      ['**/surfaces/**'],
      'Desktop does not import phone screens.',
    ),
  ],
),
```

Add `desktop/` to the root layout in `docs/FOLDER_STRUCTURE.md`:

```
├── desktop/               # Tauri 2 Mac extra + Windows tray companion
│   ├── src/               # React panel UI
│   ├── src-tauri/         # extra, tray, window
│   └── di.ts              # desktop composition root
```

- [ ] **Step 2: Write `desktop/package.json` and Vite/TS config**

`desktop/package.json`:

```json
{
  "name": "until-desktop",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.8.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.8.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.3",
    "vite": "^7.1.0"
  }
}
```

`desktop/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@until/core': path.resolve(__dirname, '../src/core'),
      '@until/theme/progressColor': path.resolve(
        __dirname,
        '../src/theme/progressColor.ts',
      ),
      '@until/types': path.resolve(__dirname, '../src/types'),
      '@until/domain': path.resolve(__dirname, '../src/domain'),
    },
  },
  server: { port: 1420, strictPort: true },
  clearScreen: false,
});
```

`desktop/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@until/core/*": ["../src/core/*"],
      "@until/theme/progressColor": ["../src/theme/progressColor.ts"],
      "@until/types": ["../src/types/index.ts"],
      "@until/domain/*": ["../src/domain/*"]
    }
  },
  "include": ["src", "di.ts", "vite.config.ts"]
}
```

`desktop/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UNTIL</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`desktop/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './panel.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`desktop/src/App.tsx` (shell copy only; numbers come in Task 5):

```tsx
export function App() {
  return (
    <main className="panel">
      <h1>UNTIL</h1>
      <p className="signed-out">Sign in on this computer to show your day.</p>
    </main>
  );
}
```

`desktop/src/panel.css`:

```css
:root {
  color: #ededed;
  background: #0e0e10;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
html, body, #root { margin: 0; height: 100%; }
.panel { padding: 16px 18px; }
h1 { font-size: 13px; letter-spacing: 0.12em; font-weight: 600; margin: 0 0 16px; }
.signed-out { font-size: 13px; color: #9a9a9a; }
```

- [ ] **Step 3: Write the Tauri extra/tray shell**

`desktop/src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build()
}
```

`desktop/src-tauri/Cargo.toml`:

```toml
[package]
name = "until-desktop"
version = "0.1.0"
description = "UNTIL desktop companion"
authors = ["UNTIL"]
edition = "2021"

[lib]
name = "until_desktop_lib"
crate-type = ["lib", "cdylib", "staticlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["tray-icon", "image-png"] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

`desktop/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "UNTIL",
  "version": "0.1.0",
  "identifier": "app.until.time.desktop",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "label": "panel",
        "title": "UNTIL",
        "width": 380,
        "height": 520,
        "visible": false,
        "resizable": false,
        "skipTaskbar": true,
        "decorations": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

If the default icon set is missing, generate placeholders with `npx @tauri-apps/cli icon` from a 1024 PNG, or copy any 32×32 PNG into `desktop/src-tauri/icons/` and point `icon` at the files that exist. Do not block the task on brand polish.

`desktop/src-tauri/capabilities/default.json`:

```json
{
  "identifier": "default",
  "windows": ["panel"],
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-focus",
    "core:tray:default"
  ]
}
```

`desktop/src-tauri/src/lib.rs`:

```rust
use tauri::{
    image::Image,
    menu::MenuBuilder,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime,
};

fn toggle_panel<R: Runtime>(app: &AppHandle<R>) {
    if let Some(panel) = app.get_webview_window("panel") {
        if panel.is_visible().unwrap_or(false) {
            let _ = panel.hide();
        } else {
            let _ = panel.show();
            let _ = panel.set_focus();
        }
    }
}

#[tauri::command]
fn set_extra(app: AppHandle, text: String, png: Option<Vec<u8>>) -> Result<(), String> {
    let Some(tray) = app.tray_by_id("until-extra") else {
        return Err("missing tray".into());
    };
    tray.set_title(Some(&text)).map_err(|e| e.to_string())?;
    tray.set_tooltip(Some(&text)).map_err(|e| e.to_string())?;
    if let Some(bytes) = png {
        let icon = Image::from_bytes(&bytes).map_err(|e| e.to_string())?;
        tray.set_icon(Some(icon)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let _menu = MenuBuilder::new(app).build()?;
            TrayIconBuilder::with_id("until-extra")
                .title("—")
                .tooltip("—")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_panel(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_extra])
        .run(tauri::generate_context!())
        .expect("error while running UNTIL desktop");
}
```

`desktop/src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    until_desktop_lib::run();
}
```

`desktop/README.md`:

```md
# UNTIL desktop

Mac menu bar extra and Windows tray companion.

```bash
cd desktop
npm install
npm run tauri dev
```

Extra shows a dash until you sign in with a birth date. Click the extra to open the panel.
```

- [ ] **Step 4: Install and typecheck the frontend**

Run:

```
cd desktop && npm install && npx tsc --noEmit
```

Expected: PASS (no TS errors). `App.tsx` does not import phone `di` or `persistence`.

- [ ] **Step 5: Verify extra/tray + panel toggle locally**

Run: `cd desktop && npm run tauri dev`

Expected:
- Mac: menu-bar extra shows `—`. Click opens the UNTIL panel. Click again hides it.
- Windows: tray icon + tooltip `—`. Click opens the same panel.
- Panel heading is `UNTIL`. No fake percent.

If Rust is missing: install via `https://rustup.rs` and retry. Do not skip this step.

- [ ] **Step 6: Commit**

```bash
git add desktop .gitignore .eslintrc.js docs/FOLDER_STRUCTURE.md
git commit -m "$(cat <<'EOF'
Scaffold the Mac extra and Windows tray companion.

EOF
)"
```

---

### Task 5: Extra and panel tick from local disk

**Files:**
- Create: `desktop/src/localState.ts`
- Create: `desktop/src/panelModel.ts`
- Create: `desktop/src/extraTick.ts`
- Create: `desktop/src/trayIcon.ts`
- Modify: `desktop/src/App.tsx`
- Modify: `desktop/src/panel.css`
- Create: `__tests__/panelModel.test.ts`

**Interfaces:**
- Consumes: `formatDayPassedLeftWithSeconds`, `formatMonthPassedLeft`, `formatYearPassedLeft`, `formatLifePassedLeft`, `extraDayPercentText` from Task 1; `getMonthProgress` / `getYearProgress` / `getLifeProgress` from `src/core/time`; `getProgressColor(progress: number): string` from `src/theme/progressColor.ts`
- Produces:
  - `DesktopLocalState = { uid: string | null; email: string | null; birthDate: string | null; deathAge: number | null; deviceRegistered: boolean; entitlementActive: boolean }`
  - `loadLocalState(): Promise<DesktopLocalState>` / `saveLocalState(state: DesktopLocalState): Promise<void>` using `localStorage` key `until.desktop.localState` (enough for v1; Tauri `appDataDir` can replace this later without changing the type)
  - `buildPanelModel(state, now: Date): PanelModel`
  - `pushExtra(state, now: Date): Promise<void>` — `invoke('set_extra', { text, png })`
- Signed out default state: all nulls / false. Extra dash. Panel shows sign-in placeholder rows only after Task 6; for this task show Day/Month/Year/Life from the clock when `birthDate` is set, else Day still ticks in the panel as empty/`—` for Life.
- Color the extra with `getProgressColor(day.progress)` when showing a percent. No bar in the extra.

Panel signed-in layout (plain copy):

```
UNTIL
Day     8h 12m 4s passed    15h 47m 55s left
Month   … passed            … left
Year    … passed            … left
Life    … passed            … left
```

- [ ] **Step 1: Write the failing panel model test**

Create `__tests__/panelModel.test.ts`. Jest runs from the phone root, so put the pure builder in a file phone Jest can import: `src/core/time/panelModel.ts` (shared, no React). Desktop `desktop/src/panelModel.ts` re-exports it.

```ts
import { buildPanelModel } from '../src/core/time/panelModel';

const NOW = new Date(2026, 2, 15, 8, 12, 4);

describe('buildPanelModel', () => {
  it('matches Home day strings for a fixture clock', () => {
    const model = buildPanelModel(
      {
        uid: 'u1',
        email: 'a@b.com',
        birthDate: '1990-01-15',
        deathAge: 80,
        deviceRegistered: true,
        entitlementActive: true,
      },
      NOW,
    );
    expect(model.extraText).toBe('34%');
    expect(model.day.passedStr).toBe('8h 12m 4s');
    expect(model.day.leftStr).toBe('15h 47m 55s');
    expect(model.month.leftDays).toBe(16);
    expect(model.year.leftDays).toBe(291);
    expect(model.life).not.toBeNull();
  });

  it('dashes the extra when signed out', () => {
    const model = buildPanelModel(
      {
        uid: null,
        email: null,
        birthDate: null,
        deathAge: null,
        deviceRegistered: false,
        entitlementActive: false,
      },
      NOW,
    );
    expect(model.extraText).toBe('—');
    expect(model.life).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `yarn test __tests__/panelModel.test.ts -v`

Expected: FAIL (module missing)

- [ ] **Step 3: Implement `buildPanelModel`**

Create `src/core/time/panelModel.ts`:

```ts
import { getLifeProgress } from './life';
import { getMonthProgress } from './month';
import { getYearProgress } from './year';
import {
  extraDayPercentText,
  formatDayPassedLeftWithSeconds,
  formatLifePassedLeft,
  formatMonthPassedLeft,
  formatYearPassedLeft,
} from './homeFormatters';

export type DesktopLocalState = {
  uid: string | null;
  email: string | null;
  birthDate: string | null;
  deathAge: number | null;
  deviceRegistered: boolean;
  entitlementActive: boolean;
};

export function buildPanelModel(state: DesktopLocalState, now: Date) {
  const signedIn = Boolean(state.uid);
  const hasBirthDate = Boolean(state.birthDate);
  const extraText = extraDayPercentText({ signedIn, hasBirthDate, now });
  const day = formatDayPassedLeftWithSeconds(now);
  const month = formatMonthPassedLeft(getMonthProgress(now).remainingDays, now);
  const year = formatYearPassedLeft(getYearProgress(now).remainingDays, now);
  const deathAge = state.deathAge ?? 80;
  const lifeProgress = state.birthDate
    ? getLifeProgress(state.birthDate, deathAge, now)
    : null;
  const life =
    lifeProgress != null
      ? formatLifePassedLeft(
          lifeProgress.progress,
          Math.round(lifeProgress.yearsRemaining * 365.25),
          deathAge,
        )
      : null;
  return {
    extraText,
    extraProgress: signedIn && hasBirthDate ? day.progress : null,
    day,
    month,
    year,
    life,
    signedIn,
    email: state.email,
  };
}
```

Re-export `DesktopLocalState` and `buildPanelModel` from `src/core/time/index.ts`.

Create `desktop/src/panelModel.ts`:

```ts
export {
  buildPanelModel,
  type DesktopLocalState,
} from '@until/core/time/panelModel';
```

Create `desktop/src/localState.ts`:

```ts
import type { DesktopLocalState } from './panelModel';

const KEY = 'until.desktop.localState';

export const EMPTY_LOCAL_STATE: DesktopLocalState = {
  uid: null,
  email: null,
  birthDate: null,
  deathAge: null,
  deviceRegistered: false,
  entitlementActive: false,
};

export function loadLocalState(): DesktopLocalState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_LOCAL_STATE;
    const parsed = JSON.parse(raw) as DesktopLocalState;
    return { ...EMPTY_LOCAL_STATE, ...parsed };
  } catch {
    return EMPTY_LOCAL_STATE;
  }
}

export function saveLocalState(state: DesktopLocalState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}
```

Create `desktop/src/trayIcon.ts` (32×32 PNG, percent or dash, fill = extra color):

```ts
export function extraPng(text: string, color: string | null): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 32, 32);
  ctx.fillStyle = color ?? '#9A9A9A';
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0E0E10';
  ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.replace('%', ''), 16, 17);
  const dataUrl = canvas.toDataURL('image/png');
  const binary = atob(dataUrl.split(',')[1]);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}
```

Prefer generating the PNG from `canvas.toDataURL` in one pass (draw, then encode). Collapse `encodePng` if the first canvas already holds the glyph.

Create `desktop/src/extraTick.ts`:

```ts
import { invoke } from '@tauri-apps/api/core';
import { getProgressColor } from '@until/theme/progressColor';
import { buildPanelModel, type DesktopLocalState } from './panelModel';
import { extraPng } from './trayIcon';

export async function pushExtra(state: DesktopLocalState, now: Date = new Date()) {
  const model = buildPanelModel(state, now);
  const color =
    model.extraProgress == null ? null : getProgressColor(model.extraProgress);
  const png = Array.from(extraPng(model.extraText, color));
  await invoke('set_extra', { text: model.extraText, png });
}
```

- [ ] **Step 4: Run panel model tests**

Run: `yarn test __tests__/panelModel.test.ts -v`

Expected: PASS. If `year.leftDays` is 290 or 291 depending on DST/day-of-year math, assert against `getYearProgress(NOW).remainingDays` instead of a raw `291` so the panel matches Home’s remaining-days source.

- [ ] **Step 5: Wire the panel UI to the tick**

`desktop/src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { buildPanelModel } from './panelModel';
import { loadLocalState } from './localState';
import { pushExtra } from './extraTick';
import { getProgressColor } from '@until/theme/progressColor';

export function App() {
  const [now, setNow] = useState(() => new Date());
  const state = loadLocalState();
  const model = buildPanelModel(state, now);

  useEffect(() => {
    const id = setInterval(() => {
      const next = new Date();
      setNow(next);
      void pushExtra(loadLocalState(), next);
    }, 1000);
    void pushExtra(state, now);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="panel">
      <h1>UNTIL</h1>
      <Row
        title="Day"
        passed={`${model.day.passedStr} passed`}
        left={`${model.day.leftStr} left`}
        color={getProgressColor(model.day.progress)}
      />
      <Row
        title="Month"
        passed={`${model.month.passedDays}d passed`}
        left={`${model.month.leftDays}d left`}
      />
      <Row
        title="Year"
        passed={`${model.year.passedDays}d passed`}
        left={`${model.year.leftDays}d left`}
      />
      <Row
        title="Life"
        passed={model.life ? `${model.life.passedDays}d passed` : '—'}
        left={model.life ? `${model.life.leftDays}d left` : '—'}
      />
    </main>
  );
}

function Row({
  title,
  passed,
  left,
  color,
}: {
  title: string;
  passed: string;
  left: string;
  color?: string;
}) {
  return (
    <div className="row">
      <span className="row-title" style={color ? { color } : undefined}>
        {title}
      </span>
      <span>{passed}</span>
      <span className="left">{left}</span>
    </div>
  );
}
```

Day percent in the extra uses `getProgressColor`. Life uses `—` when there is no birth date (placeholder, allowed).

- [ ] **Step 6: Manual check**

Run: `cd desktop && npm run tauri dev`

Expected: extra stays `—` (empty local state). Panel Day ticks every second. Month/Year show passed/left days. Life is `—`. No `0%` in the extra.

To verify a percent without auth, temporarily `saveLocalState({ uid: 'x', email: 'a@b.com', birthDate: '1990-01-15', deathAge: 80, deviceRegistered: true, entitlementActive: false })` in the console, then confirm extra shows `N%` in `getProgressColor` and is not `0%` at 8am. Remove that console hack before committing.

- [ ] **Step 7: Commit**

```bash
git add src/core/time/panelModel.ts src/core/time/index.ts __tests__/panelModel.test.ts desktop/src
git commit -m "$(cat <<'EOF'
Tick extra and panel from shared Home formatters.

EOF
)"
```

---

### Task 6: Firebase JS sign-in, replace dialog, desktop register

**Files:**
- Create: `desktop/src/firebaseConfig.ts`
- Create: `desktop/src/adapters/FirebaseJsAuthAdapter.ts`
- Create: `desktop/src/adapters/FirestoreJsAccountCloudStore.ts`
- Create: `desktop/src/adapters/TauriDeviceIdProvider.ts`
- Create: `desktop/di.ts`
- Create: `desktop/src/ReplaceDialog.tsx`
- Create: `desktop/src/BirthDateForm.tsx`
- Modify: `desktop/src/App.tsx`
- Modify: `desktop/package.json` (add `firebase`)
- Modify: `desktop/src-tauri/tauri.conf.json` + capabilities if the OAuth popup needs `allow-navigate` / opener

**Interfaces:**
- Consumes: `CompleteDesktopSignInUseCase`, `RegisterDeviceUseCase`, `IAccountCloudStore`, `replaceDesktopBody`, `DEVICE_LIMIT_BANNER_COPY`, `IDeviceIdProvider`
- Produces:
  - `desktop/di.ts` wires Firestore JS + Firebase Auth JS + `RegisterDeviceUseCase(() => macos | windows)` + `CompleteDesktopSignInUseCase`. Never import `src/di.ts`.
  - Stable `deviceId`: UUID in `localStorage` key `until.desktop.deviceId` (same lifetime as local state; reinstall may mint a new id and may prompt replace).
  - `getDesktopPlatform(): 'macos' | 'windows'` from `navigator.userAgent` (`Mac` → `macos`, else `windows`).
  - Sign-in: Google + Apple via Firebase JS popup. Same `users/{uid}` as the phone.
  - Flow: provider → if profile has no `birthDate`, collect YYYY-MM-DD → `upsertProfile` → `completeDesktopSignIn.execute` → if `needs_replace`, show dialog Continue/Cancel → Continue calls `execute({ replaceConfirmed: true })` → persist `DesktopLocalState`. Cancel: do not register; extra stays dash unless a prior local profile exists.
  - Limit: show `DEVICE_LIMIT_BANNER_COPY`. No paywall.
  - Sign-out: Firebase signOut + `saveLocalState(EMPTY_LOCAL_STATE)` unless you need last profile for offline tick; spec: signed out extra is a dash. Clear uid so extra dashes. Keep last birthDate on disk only while `uid` is set.

Replace dialog copy (no em dashes):

```
UNTIL is already signed in on [label]. Signing in here turns that one off.
```

Buttons: `Continue` · `Cancel`

- [ ] **Step 1: Add Firebase web config (no auth UI yet)**

In Firebase console for project `until-b7624`, add a **Web** app named `UNTIL desktop`. Put the web config in `desktop/src/firebaseConfig.ts`:

```ts
export const firebaseWebConfig = {
  apiKey: '...',
  authDomain: 'until-b7624.firebaseapp.com',
  projectId: 'until-b7624',
  storageBucket: 'until-b7624.firebasestorage.app',
  messagingSenderId: '150745476537',
  appId: '...', // web app id, not the iOS GOOGLE_APP_ID
};
```

Do not reuse the iOS `GOOGLE_APP_ID`. Do not commit a service account.

Enable Google and Apple in Firebase Auth for this web app. Apple needs a Services ID + return URL on `authDomain`. Google needs a Web client ID (the existing `CLIENT_ID` in `ios/GoogleService-Info.plist` is a starting point; add `http://localhost` / Tauri origins as authorized).

`cd desktop && npm install firebase@11`

- [ ] **Step 2: Implement desktop adapters and `desktop/di.ts`**

`desktop/src/adapters/TauriDeviceIdProvider.ts`:

```ts
import type { IDeviceIdProvider } from '@until/domain/ports/IDeviceIdProvider';

const KEY = 'until.desktop.deviceId';

export class TauriDeviceIdProvider implements IDeviceIdProvider {
  async getDeviceId(): Promise<string> {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  }
}
```

`desktop/src/adapters/FirebaseJsAuthAdapter.ts`:

```ts
import {
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import type { AuthUser } from '@until/types';
import { firebaseWebConfig } from '../firebaseConfig';

function app() {
  return getApps()[0] ?? initializeApp(firebaseWebConfig);
}

function toUser(user: User): AuthUser {
  const providers = user.providerData.map(p =>
    p.providerId === 'apple.com' ? 'apple' : p.providerId === 'password' ? 'password' : 'google',
  );
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    providers,
  };
}

export class FirebaseJsAuthAdapter {
  private readonly auth = getAuth(app());

  async signInWithGoogle(): Promise<AuthUser> {
    const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
    return toUser(cred.user);
  }

  async signInWithApple(): Promise<AuthUser> {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const cred = await signInWithPopup(this.auth, provider);
    return toUser(cred.user);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): AuthUser | null {
    return this.auth.currentUser ? toUser(this.auth.currentUser) : null;
  }

  subscribe(cb: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, user => cb(user ? toUser(user) : null));
  }
}
```

`desktop/src/adapters/FirestoreJsAccountCloudStore.ts` — implement `IAccountCloudStore` with modular `firebase/firestore` against `users/{uid}`, `users/{uid}/devices/{deviceId}`, `users/{uid}/entitlement/current`. `listDevices` / `upsertDevice` / `setDeviceActive` must **throw** on failure (same as phone). `getProfile` / `getEntitlement` may return `null` on miss. Use a 8s timeout via `withTimeout` from `@until/core/account/withTimeout`.

`desktop/di.ts`:

```ts
import { RegisterDeviceUseCase } from '@until/domain/useCases/RegisterDeviceUseCase';
import { CompleteDesktopSignInUseCase } from '@until/domain/useCases/CompleteDesktopSignInUseCase';
import { FirebaseJsAuthAdapter } from './src/adapters/FirebaseJsAuthAdapter';
import { FirestoreJsAccountCloudStore } from './src/adapters/FirestoreJsAccountCloudStore';
import { TauriDeviceIdProvider } from './src/adapters/TauriDeviceIdProvider';

export function getDesktopPlatform(): 'macos' | 'windows' {
  return /Mac/i.test(navigator.userAgent) ? 'macos' : 'windows';
}

export const desktopAuth = new FirebaseJsAuthAdapter();
export const desktopCloud = new FirestoreJsAccountCloudStore();
export const desktopDeviceId = new TauriDeviceIdProvider();

export const desktopRegisterDevice = new RegisterDeviceUseCase(
  desktopCloud,
  desktopDeviceId,
  getDesktopPlatform,
  () => (getDesktopPlatform() === 'macos' ? 'Mac' : 'Windows'),
);

export const completeDesktopSignIn = new CompleteDesktopSignInUseCase(
  desktopCloud,
  desktopRegisterDevice,
);
```

- [ ] **Step 3: Replace dialog and birth-date form (copy from Task 2)**

`desktop/src/ReplaceDialog.tsx`:

```tsx
import { replaceDesktopBody } from '@until/core/account/accountCopy';
import type { AccountDevice } from '@until/types';

export function ReplaceDialog({
  existing,
  onContinue,
  onCancel,
}: {
  existing: AccountDevice;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="dialog" role="alertdialog">
      <p>{replaceDesktopBody(existing)}</p>
      <div className="dialog-actions">
        <button type="button" onClick={onContinue}>
          Continue
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
```

`desktop/src/BirthDateForm.tsx`: collect a `YYYY-MM-DD` value, submit button `Continue`. No extra coaching copy.

- [ ] **Step 4: Wire sign-in in `App.tsx`**

Keep the tick from Task 5. Add signed-out buttons:

```
[ Sign in with Google ]
[ Sign in with Apple ]
```

Handler (pseudocode you must implement in App, not leave as comments):

1. `user = await desktopAuth.signInWithGoogle()` (or Apple)
2. `profile = await desktopCloud.getProfile(user.uid)`
3. If `profile?.birthDate` missing, set UI to birth-date form; on submit `await desktopCloud.upsertProfile(user.uid, { birthDate, deathAge: 80, updatedAt: Date.now(), minimumAgeConfirmed: true, minimumAgeConfirmedAt: Date.now() })`
4. `result = await completeDesktopSignIn.execute(user)`
5. `needs_replace` → render `ReplaceDialog`. Continue: `completeDesktopSignIn.execute(user, { replaceConfirmed: true })`. Cancel: `await desktopAuth.signOut()` if this machine had no prior `loadLocalState().uid`; do not call register again
6. `limit_reached` → show `DEVICE_LIMIT_BANNER_COPY`
7. `registered` → `saveLocalState({ uid, email, birthDate, deathAge, deviceRegistered: true, entitlementActive: result.entitlement?.active ?? false })`
8. `incomplete` → keep extra on dash (or prior local profile); do not claim success

Signed-in panel: show `email` and a `Sign out` button. No store IAP UI.

Offline: extra/panel keep ticking from `loadLocalState()`. Sign-in buttons may fail; show `Could not reach the account. Try again when you are online.` Do not invent a percent.

- [ ] **Step 5: Manual auth check**

Run: `cd desktop && npm run tauri dev`

Expected:
- Google sign-in against the same account as the phone.
- First desktop under the cap: extra switches from `—` to `N%` after birth date exists.
- Second desktop: dialog uses the agreed sentence. Cancel: extra on the new machine stays `—`; phone Account still lists the old Mac/Windows as active.
- Continue: old desktop `active: false` in Firestore; this machine listed as `macos` or `windows`.
- Three phones: banner copy, no replace dialog.

- [ ] **Step 6: Commit**

```bash
git add desktop
git commit -m "$(cat <<'EOF'
Sign in on desktop with replace-previous-desktop confirm.

EOF
)"
```

---

### Task 7: Entitlement read (no purchase)

**Files:**
- Modify: `desktop/src/App.tsx` (show a one-line signed-in note, not a paywall)
- Modify: `desktop/di.ts` only if entitlement is not already returned from Task 6
- Modify: `__tests__/completeDesktopSignIn.test.ts` if needed (already reads entitlement)

**Interfaces:**
- Consumes: `IAccountCloudStore.getEntitlement`, `DesktopSignInResult.entitlement`
- Produces: `DesktopLocalState.entitlementActive: boolean`. Numbers still show when `entitlementActive` is false. No RevenueCat. No restore. No buy.

Copy when signed in and not entitled (plain, not a paywall):

```
Premium is managed on your phone.
```

When entitled, omit that line. Do not hide Day/Month/Year/Life.

- [ ] **Step 1: Write a failing assertion on local state mapping**

Add to `__tests__/panelModel.test.ts`:

```ts
it('still builds numbers when entitlement is inactive', () => {
  const model = buildPanelModel(
    {
      uid: 'u1',
      email: 'a@b.com',
      birthDate: '1990-01-15',
      deathAge: 80,
      deviceRegistered: true,
      entitlementActive: false,
    },
    NOW,
  );
  expect(model.extraText).toBe('34%');
  expect(model.day.passedStr).toBe('8h 12m 4s');
});
```

- [ ] **Step 2: Run — expect PASS if Task 5 already ignores entitlement**

Run: `yarn test __tests__/panelModel.test.ts -v`

Expected: PASS. If it failed because you gated extra on premium, remove that gate.

- [ ] **Step 3: Show the phone-managed line in the panel when `!entitlementActive && signedIn`**

In `App.tsx`, under the Life row:

```tsx
{model.signedIn && !loadLocalState().entitlementActive ? (
  <p className="note">Premium is managed on your phone.</p>
) : null}
```

Refresh entitlement on each sign-in success and once when the panel opens if `uid` is set (`desktopCloud.getEntitlement(uid)` inside try/catch; on failure leave the previous flag, do not strip).

- [ ] **Step 4: Manual check**

Signed-in non-premium account: numbers + extra percent still show, plus the phone-managed line. Premium account: no that line. Killing network after a successful register: extra keeps ticking.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/App.tsx __tests__/panelModel.test.ts
git commit -m "$(cat <<'EOF'
Read desktop premium from the account, without selling it there.

EOF
)"
```

---

### Task 8: Layer lint, docs, shipping checklist

**Files:**
- Modify: `.eslintrc.js` (confirm desktop override from Task 4)
- Modify: `docs/FOLDER_STRUCTURE.md` (already updated; verify)
- Modify: `docs/superpowers/specs/2026-10-15-desktop-companion-design.md` (Status: Approved)
- Create: `desktop/SHIP.md` (notarization / Authenticode checklist, not product UI)

**Interfaces:** none. This task is the rollout gate from the spec (items 1–6), not extra/panel UX.

- [ ] **Step 1: Run the full shared test suite plus lint**

Run:

```
yarn test __tests__/homeFormatters.test.ts __tests__/accountCopy.test.ts __tests__/deviceLimit.test.ts __tests__/registerDevice.test.ts __tests__/completeDesktopSignIn.test.ts __tests__/panelModel.test.ts __tests__/signInDevicePolicy.test.ts
yarn lint
yarn lint:cycles
```

Expected: PASS. `yarn lint` must fail if `desktop/src` imports `src/di` or `src/persistence`.

- [ ] **Step 2: Write `desktop/SHIP.md`**

```md
# Shipping UNTIL desktop

Not product UI. Required to hand someone a build outside `tauri dev`.

## Mac

1. Apple Developer ID Application certificate.
2. `cd desktop && npm run tauri build -- --target aarch64-apple-darwin` (and x64 if you ship Intel).
3. Notarize the `.app` / `.dmg` (`xcrun notarytool`). Staple.
4. Gatekeeper: open on a Mac that never ran `tauri dev`. Extra should show.

## Windows

1. Authenticode certificate.
2. `cd desktop && npm run tauri build -- --target x86_64-pc-windows-msvc`
3. Sign the `.exe` / `.msi`.
4. SmartScreen may warn until reputation builds.

## Out of v1 product

Launch at login, auto-update, larger window.
```

Set spec status to `Approved`.

- [ ] **Step 3: Commit**

```bash
git add desktop/SHIP.md docs/superpowers/specs/2026-10-15-desktop-companion-design.md docs/FOLDER_STRUCTURE.md
git commit -m "$(cat <<'EOF'
Document desktop shipping and lock the companion spec.

EOF
)"
```

---

## Self-review

**Spec coverage**

| Spec requirement | Task |
|---|---|
| Extract Home formatters, re-export, Home + panel share them | 1, 5 |
| Extra 0–100 / dash, `getProgressColor`, no bar | 1 (`extraDayPercentText`), 5 |
| Panel Day (seconds), Month, Year, Life | 5 |
| Google + Apple, same Firebase uid, birth date once | 6 |
| Premium buy/restore stay on phone; numbers still show | 7 |
| Desktop counts as a slot; at most one active desktop | 3, 6 |
| Replace even under cap; confirm; Cancel does not steal | 3, 6 |
| 3 phones block a new desktop; do not replace a phone | 3 |
| Phone Account lists Mac/Windows; copy “3 devices” | 2 |
| `desktop/` Tauri 2, `desktop/di.ts`, phone `di.ts` untouched as root | 4, 6 |
| Fail closed / incomplete; no strip premium on network error | 3, 6 |
| 12s budget | 3 (`COMPLETE_DESKTOP_SIGN_IN_BUDGET_MS`) |
| v1.1 window, Skia, island, overlay, widgets, IAP, Notifee out | omitted |
| Launch-at-login / auto-update not required | 8 (`SHIP.md` lists them as out) |
| Signed builds | 8 |

**Placeholder scan:** none of TBD / “handle edge cases” / “similar to Task N”. Firebase web `appId` is filled from console in Task 6 Step 1 because it does not exist in the iOS plist.

**Type consistency:** `DevicePlatform`, `RegisterDeviceResult` union, `needsReplace: true`, `planDesktopRegister`, `RegisterDeviceOptions.replaceConfirmed`, `DesktopSignInResult.status`, `DesktopLocalState`, `COMPLETE_DESKTOP_SIGN_IN_BUDGET_MS = 12_000` are named the same in Tasks 2–7.
