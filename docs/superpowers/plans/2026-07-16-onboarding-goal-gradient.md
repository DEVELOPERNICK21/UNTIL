# Onboarding Goal Gradient — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-07-16-onboarding-goal-gradient-design.md`

**Goal:** Replace linear cold-start funnel progress with a goal-gradient curve (~18% head start + late acceleration) and calm stage encouragement under the existing thin progress bar.

**Architecture:** Pure progress + encouragement mapping stays in `src/core/onboarding/quizFunnel.ts`. Surfaces never import core for business logic — a thin use case + `useOnboardingFunnel` expose `progress` and `encouragement`. `FunnelProgressBar` only renders track + caption.

**Tech Stack:** React Native, existing onboarding funnel (`OnboardingScreen`, MMKV step persistence), Jest unit tests

## Global Constraints

- No visible percent badge, no milestone stepper, no emoji-heavy copy
- Brand and paywall still hide the progress bar
- Progress must be monotone non-decreasing as the user advances through `ONBOARDING_PROGRESS_STEPS`
- Surfaces → hooks → use cases → repos; no `core` imports in surfaces for business logic
- Do not change funnel step order, trial days, or paywall packages
- Encouragement copy (verbatim):
  - Early: `You're underway`
  - Mid: `Your time map is forming`
  - Late: `Almost ready`
  - Final: `Your plan is ready`

## File map

| File | Responsibility |
|------|----------------|
| `src/core/onboarding/quizFunnel.ts` | Goal-gradient `getFunnelProgress`; new `getFunnelEncouragement` |
| `src/core/onboarding/index.ts` | Re-export new helper |
| `src/domain/useCases/OnboardingFunnelNavigationUseCases.ts` | New `GetOnboardingFunnelEncouragementUseCase` |
| `src/di.ts` | Wire + export encouragement use case |
| `src/hooks/useOnboardingFunnel.ts` | Expose `encouragement` |
| `src/surfaces/onboarding/FunnelProgressBar.tsx` | Render encouragement caption under track |
| `src/surfaces/onboarding/OnboardingScreen.tsx` | Pass `encouragement` into bar |
| `__tests__/onboardingQuizFunnel.test.ts` | Assert curve + encouragement stages |

---

### Task 1: Core progress curve + encouragement (TDD)

**Files:**
- Modify: `src/core/onboarding/quizFunnel.ts`
- Modify: `src/core/onboarding/index.ts`
- Modify: `__tests__/onboardingQuizFunnel.test.ts`

**Interfaces:**
- Consumes: `OnboardingFunnelStep`, `ONBOARDING_PROGRESS_STEPS`
- Produces:
  - `getFunnelProgress(step: OnboardingFunnelStep): number`
  - `getFunnelEncouragement(step: OnboardingFunnelStep): string | null`

- [ ] **Step 1: Write the failing tests**

Replace the existing progress test and add encouragement tests in `__tests__/onboardingQuizFunnel.test.ts`:

```ts
it('applies goal-gradient progress (head start + late ramp)', () => {
  expect(getFunnelProgress('brand')).toBe(0);
  expect(getFunnelProgress('paywall')).toBe(0);
  expect(getFunnelProgress('day_demo')).toBeCloseTo(0.18, 2);
  expect(getFunnelProgress('widgets_demo')).toBeCloseTo(0.28, 2);
  expect(getFunnelProgress('q_goal')).toBeCloseTo(0.35, 2);
  expect(getFunnelProgress('q_drain')).toBeCloseTo(0.42, 2);
  expect(getFunnelProgress('interstitial')).toBeCloseTo(0.48, 2);
  expect(getFunnelProgress('identity')).toBeCloseTo(0.55, 2);
  expect(getFunnelProgress('life_weeks')).toBeCloseTo(0.68, 2);
  expect(getFunnelProgress('q_values')).toBeCloseTo(0.75, 2);
  expect(getFunnelProgress('q_cadence')).toBeCloseTo(0.82, 2);
  expect(getFunnelProgress('q_readiness')).toBeCloseTo(0.88, 2);
  expect(getFunnelProgress('loader')).toBeCloseTo(0.95, 2);
  expect(getFunnelProgress('results')).toBe(1);
});

it('progress is monotone across progress steps', () => {
  const { ONBOARDING_PROGRESS_STEPS } = require('../src/core/onboarding');
  let prev = -1;
  for (const step of ONBOARDING_PROGRESS_STEPS) {
    const p = getFunnelProgress(step);
    expect(p).toBeGreaterThan(prev);
    prev = p;
  }
});

it('maps encouragement by stage', () => {
  expect(getFunnelEncouragement('brand')).toBeNull();
  expect(getFunnelEncouragement('paywall')).toBeNull();
  expect(getFunnelEncouragement('day_demo')).toBe("You're underway");
  expect(getFunnelEncouragement('q_drain')).toBe("You're underway");
  expect(getFunnelEncouragement('interstitial')).toBe(
    'Your time map is forming'
  );
  expect(getFunnelEncouragement('life_weeks')).toBe(
    'Your time map is forming'
  );
  expect(getFunnelEncouragement('q_values')).toBe('Almost ready');
  expect(getFunnelEncouragement('q_readiness')).toBe('Almost ready');
  expect(getFunnelEncouragement('loader')).toBe('Your plan is ready');
  expect(getFunnelEncouragement('results')).toBe('Your plan is ready');
});
```

Import `getFunnelEncouragement` and `ONBOARDING_PROGRESS_STEPS` at the top of the test file (prefer static import over `require` for the monotone test).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --watchman=false __tests__/onboardingQuizFunnel.test.ts`

Expected: FAIL — progress still linear (`1/12` ≈ 0.083 for `day_demo`); `getFunnelEncouragement` not exported / undefined.

- [ ] **Step 3: Implement core helpers**

In `src/core/onboarding/quizFunnel.ts`, replace `getFunnelProgress` and add encouragement:

```ts
/** Display progress per progress-bar step — goal gradient (head start + late ramp). */
const FUNNEL_PROGRESS_BY_STEP: Record<
  (typeof ONBOARDING_PROGRESS_STEPS)[number],
  number
> = {
  day_demo: 0.18,
  widgets_demo: 0.28,
  q_goal: 0.35,
  q_drain: 0.42,
  interstitial: 0.48,
  identity: 0.55,
  life_weeks: 0.68,
  q_values: 0.75,
  q_cadence: 0.82,
  q_readiness: 0.88,
  loader: 0.95,
  results: 1,
};

export function getFunnelProgress(step: OnboardingFunnelStep): number {
  if (!(ONBOARDING_PROGRESS_STEPS as readonly string[]).includes(step)) {
    return 0;
  }
  return FUNNEL_PROGRESS_BY_STEP[step as (typeof ONBOARDING_PROGRESS_STEPS)[number]];
}

const ENCOURAGEMENT_EARLY = new Set<OnboardingFunnelStep>([
  'day_demo',
  'widgets_demo',
  'q_goal',
  'q_drain',
]);
const ENCOURAGEMENT_MID = new Set<OnboardingFunnelStep>([
  'interstitial',
  'identity',
  'life_weeks',
]);
const ENCOURAGEMENT_LATE = new Set<OnboardingFunnelStep>([
  'q_values',
  'q_cadence',
  'q_readiness',
]);
const ENCOURAGEMENT_FINAL = new Set<OnboardingFunnelStep>([
  'loader',
  'results',
]);

export function getFunnelEncouragement(
  step: OnboardingFunnelStep
): string | null {
  if (ENCOURAGEMENT_EARLY.has(step)) return "You're underway";
  if (ENCOURAGEMENT_MID.has(step)) return 'Your time map is forming';
  if (ENCOURAGEMENT_LATE.has(step)) return 'Almost ready';
  if (ENCOURAGEMENT_FINAL.has(step)) return 'Your plan is ready';
  return null;
}
```

Export from `src/core/onboarding/index.ts`:

```ts
export { getFunnelEncouragement } from './quizFunnel';
```

(Keep existing exports; add `getFunnelEncouragement` alongside `getFunnelProgress`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest --watchman=false __tests__/onboardingQuizFunnel.test.ts`

Expected: PASS (all tests in file, including existing reclaim/results/navigation tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/onboarding/quizFunnel.ts src/core/onboarding/index.ts __tests__/onboardingQuizFunnel.test.ts
git commit -m "$(cat <<'EOF'
feat(onboarding): goal-gradient progress curve and encouragement copy

EOF
)"
```

---

### Task 2: Use case + DI + hook exposure

**Files:**
- Modify: `src/domain/useCases/OnboardingFunnelNavigationUseCases.ts`
- Modify: `src/di.ts`
- Modify: `src/hooks/useOnboardingFunnel.ts`
- Modify: `src/hooks/index.ts` (only if encouragement types need export — usually not)

**Interfaces:**
- Consumes: `getFunnelEncouragement` from `../../core/onboarding`
- Produces: `GetOnboardingFunnelEncouragementUseCase.execute(): string | null`; hook field `encouragement: string | null`

- [ ] **Step 1: Add use case**

In `src/domain/useCases/OnboardingFunnelNavigationUseCases.ts`, import `getFunnelEncouragement` and add:

```ts
export class GetOnboardingFunnelEncouragementUseCase {
  constructor(private readonly repository: IOnboardingRepository) {}

  execute(): string | null {
    return getFunnelEncouragement(this.repository.getFunnelStep());
  }
}
```

Also re-export the class from the same import path used in `di.ts` today (`./domain/useCases/OnboardingFunnelNavigationUseCases`).

- [ ] **Step 2: Wire DI**

In `src/di.ts`, import `GetOnboardingFunnelEncouragementUseCase` next to the other funnel navigation use cases, then:

```ts
export const getOnboardingFunnelEncouragementUseCase =
  new GetOnboardingFunnelEncouragementUseCase(onboardingRepository);
```

Place it immediately after `getOnboardingFunnelProgressUseCase`.

- [ ] **Step 3: Expose on hook**

In `src/hooks/useOnboardingFunnel.ts`:

1. Import `getOnboardingFunnelEncouragementUseCase` from `../di`.
2. Add state:

```ts
const [encouragement, setEncouragement] = useState<string | null>(() =>
  getOnboardingFunnelEncouragementUseCase.execute()
);
```

3. In `sync()`, also:

```ts
setEncouragement(getOnboardingFunnelEncouragementUseCase.execute());
```

4. Return `encouragement` from the hook object next to `progress`.

- [ ] **Step 4: Smoke-check TypeScript on touched files**

Run: `npx tsc --noEmit 2>&1 | rg 'useOnboardingFunnel|OnboardingFunnelNavigation|di\\.ts' || true`

Expected: no new errors in those files.

- [ ] **Step 5: Commit**

```bash
git add src/domain/useCases/OnboardingFunnelNavigationUseCases.ts src/di.ts src/hooks/useOnboardingFunnel.ts
git commit -m "$(cat <<'EOF'
feat(onboarding): expose funnel encouragement via use case and hook

EOF
)"
```

---

### Task 3: Progress bar UI + wire OnboardingScreen

**Files:**
- Modify: `src/surfaces/onboarding/FunnelProgressBar.tsx`
- Modify: `src/surfaces/onboarding/OnboardingScreen.tsx`

**Interfaces:**
- Consumes: `progress: number`, `encouragement: string | null`, `visible: boolean` from hook
- Produces: thin bar + secondary caption under track when `visible && encouragement`

- [ ] **Step 1: Update `FunnelProgressBar`**

Replace `src/surfaces/onboarding/FunnelProgressBar.tsx` with:

```tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme, Spacing, Radius } from '../../theme';
import { Text } from '../../ui';
import { getFontFamilyForWeight, Weight } from '../../theme/typography';

interface FunnelProgressBarProps {
  progress: number;
  visible: boolean;
  encouragement?: string | null;
}

export function FunnelProgressBar({
  progress,
  visible,
  encouragement = null,
}: FunnelProgressBarProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!encouragement) return;
    opacity.setValue(0.35);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [encouragement, opacity]);

  if (!visible) return <View style={styles.spacer} />;

  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.wrap}>
      <View
        style={[styles.track, { backgroundColor: theme.progressTrack }]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(clamped * 100),
        }}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: theme.percent,
              width: `${clamped * 100}%` as `${number}%`,
            },
          ]}
        />
      </View>
      {encouragement ? (
        <Animated.View style={{ opacity }}>
          <Text
            variant="caption"
            style={[
              styles.encouragement,
              {
                color: theme.textSecondary,
                fontFamily: getFontFamilyForWeight(Weight.medium),
              },
            ]}
          >
            {encouragement}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: 4,
    marginBottom: Spacing[3],
  },
  wrap: {
    width: '100%',
    marginBottom: Spacing[3],
  },
  track: {
    height: 4,
    borderRadius: Radius.full ?? 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full ?? 999,
  },
  encouragement: {
    textAlign: 'center',
    marginTop: Spacing[2],
    letterSpacing: 0.2,
  },
});
```

If `Text` / typography import paths differ in this repo, match `OnboardingScreen.tsx` imports exactly (do not invent new UI primitives).

- [ ] **Step 2: Pass encouragement from `OnboardingScreen`**

In `src/surfaces/onboarding/OnboardingScreen.tsx`, destructure `encouragement` from `useOnboardingFunnel()` next to `progress`, then:

```tsx
<FunnelProgressBar
  progress={progress}
  visible={showProgress}
  encouragement={encouragement}
/>
```

- [ ] **Step 3: Manual UI check (device or simulator)**

Walk: brand (no bar) → day_demo (bar ~18%, “You’re underway”) → interstitial (“Your time map is forming”) → q_values (“Almost ready”) → results (“Your plan is ready”, bar full) → paywall (no bar).

- [ ] **Step 4: Re-run unit tests**

Run: `npx jest --watchman=false __tests__/onboardingQuizFunnel.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/surfaces/onboarding/FunnelProgressBar.tsx src/surfaces/onboarding/OnboardingScreen.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): show goal-gradient encouragement under progress bar

EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Head start ~18% + late ramp table | Task 1 |
| Encouragement stage lines (verbatim) | Task 1 + 3 |
| Brand/paywall hide bar | Unchanged visibility; Task 1 returns 0 / null |
| No % badge / no stepper | Task 3 UI |
| Core logic in `quizFunnel.ts` | Task 1 |
| Surfaces via hook/use case | Task 2–3 |
| Unit tests | Task 1 |

## Placeholder / consistency check

- Function names: `getFunnelEncouragement`, `GetOnboardingFunnelEncouragementUseCase`, hook `encouragement` — consistent across tasks
- Progress table values match the approved spec
- Copy strings match Global Constraints exactly (including `You're` apostrophe)
