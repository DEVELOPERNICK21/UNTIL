# Psychology onboarding quiz funnel

**Date:** 2026-07-16  
**Status:** Approved design  
**Branch:** `feat/psychology-onboarding-quiz-funnel`  
**Approach:** Lean quiz (Approach 1) — brand beat → 5 questions → mid life-aha → loader → personalized results → soft friction paywall

## Goal

Replace the live 3-step carousel onboarding with a psychology-based quiz funnel so users (1) name a time problem, (2) feel a mid-funnel life-weeks insight, (3) receive a personalized “time map,” and (4) hit a paywall framed as keeping that map — then either subscribe or continue on free Day/Year only.

## Non-goals (V1)

- A/B variants or remote config of questions
- Email / account capture
- Hard paywall (must pay to exit)
- Auto-starting the 5-day Premium preview from “Maybe later”
- Rewriting Home or widgets from quiz answers (answers are stored for later use)
- Copying Noom-length (10–15 min / 100+ screens)
- iOS StoreKit (existing Android Play Billing path only)

## Decisions

| Topic | Choice |
|-------|--------|
| Open | One brand/emotion beat, then quiz |
| Length | ~10–12 screens, 5 questions, ~2–3 min |
| Mid-funnel aha | Birth date + life-weeks (reuse existing screens) |
| Paywall | Soft with friction — primary subscribe; secondary “Maybe later” |
| Maybe later | Free Day/Year only — **do not** start 5-day preview |
| Progress | Progress bar on quiz/identity/life/loader/results; not on brand beat or paywall |
| Question UX | Single-select auto-advance |
| Resume | Persist step + answers; resume mid-funnel after kill |

## Funnel sequence

| # | Step id | Screen | Psychology job |
|---|---------|--------|----------------|
| 0 | `brand` | Brand beat | Emotion before ask |
| 1 | `q_goal` | Q1 Goal | Easy micro-commitment |
| 2 | `q_drain` | Q2 Time drain | Problem naming |
| 3 | `interstitial` | Reframe (not a question) | Plant stat before values |
| 4 | `identity` | Birth date + lifespan | Data for personal aha |
| 5 | `life_weeks` | Life weeks grid | Mid-funnel aha |
| 6 | `q_values` | Q3 Values | Deeper ask after insight |
| 7 | `q_cadence` | Q4 Cadence | Habit / product fit |
| 8 | `q_readiness` | Q5 Readiness | Consistency / intent |
| 9 | `loader` | “Building your time map…” | Pivot: answering → built-for-me |
| 10 | `results` | Time map reveal | Ownership via personalization |
| 11 | `paywall` | Soft friction paywall | Continuation, not a new ask |

**Replaces:** live path in `OnboardingScreen` (3-step carousel → Home).  
**Reuses:** `IdentitySetupScreen`, `LifeWeeksPreviewScreen`, `OnboardingPaywallScreen` + `PremiumPaywallBody`.

### Draft copy

**0 — Brand**  
- Title: “Your time is limited.”  
- Sub: “UNTIL makes that visible — so you spend it on purpose.”  
- CTA: Continue  

**1 — Goal** — “What do you want more of?”  
Options: `people` · `focus` · `health` · `calm` · `other`  
Labels: Time with people · Focus / deep work · Health & energy · Calm / less doomscroll · Something else  

**2 — Drain** — “Where does most of your time leak?”  
Options: `social` · `work` · `busywork` · `priorities` · `unsure`  

**3 — Interstitial**  
“Most people underestimate lost hours. Small daily leaks add up to ~15–25 hrs/week.”  
CTA: Continue  

**4–5** — Existing Identity + Life weeks UX (wire into funnel).  

**6 — Values** — “If you reclaimed 10 hrs/week, what comes first?”  
Options align with Q1 + `rest` (Protect rest).  

**7 — Cadence** — “How do you want UNTIL to show up?”  
Options: `checkins` · `widgets` · `both` · `unsure`  

**8 — Readiness** — “Ready to watch your time deliberately?”  
Options: `ready` · `gentle` · `exploring`  

**9 — Loader**  
Title: “Building your time map…”  
Fake steps referencing their goal/drain (2–3s total).  

**10 — Results**  
Title: “Your time map is ready”  
Sub: “Based on your 5 answers”  
Three cards (see personalization). Back + Continue → paywall.  

**11 — Paywall**  
Emotional keep-map framing (existing monetization copy, tightened to reference time map / life %).  
Primary: subscribe (yearly primary).  
Secondary: **Maybe later** → complete onboarding, free tier only.

## Data model

New type `OnboardingQuizAnswers` (in `types/`):

```ts
type OnboardingGoal = 'people' | 'focus' | 'health' | 'calm' | 'other';
type OnboardingDrain = 'social' | 'work' | 'busywork' | 'priorities' | 'unsure';
type OnboardingValues = OnboardingGoal | 'rest';
type OnboardingCadence = 'checkins' | 'widgets' | 'both' | 'unsure';
type OnboardingReadiness = 'ready' | 'gentle' | 'exploring';

interface OnboardingQuizAnswers {
  goal: OnboardingGoal;
  timeDrain: OnboardingDrain;
  valuesPriority: OnboardingValues;
  cadence: OnboardingCadence;
  readiness: OnboardingReadiness;
}
```

Profile remains SSOT via `TimeRepository` / `UserProfile` (`birthDate`, `deathAge`).

Persist separately:

- `onboarding.quizAnswers` (JSON)
- `onboarding.funnelStep` (step id or index) for resume
- Existing `onboarding.completed` / `onboarding.completedAt`

### Personalization (results cards)

**Card 1 — reclaim hours** (lookup from `timeDrain`):

| Drain | Hours |
|-------|------:|
| social | 21 |
| work | 18 |
| busywork | 15 |
| priorities | 12 |
| unsure | 14 |

Copy: `~{N} hrs/week could shift to what matters`

**Card 2 — plan around priority** from `valuesPriority` (fallback `goal`):  
e.g. people → “Plan built around time with people”

**Card 3 — cadence** from `cadence`:  
- checkins / both → “Daily awareness check-ins enabled”  
- widgets → “Home screen widgets prioritized”  
- unsure → “Gentle start — widgets when you’re ready”

## Architecture

### Layering (follow repo architecture rules)

| Piece | Layer |
|-------|--------|
| Step config, reclaim lookup, results mapping | `core/` (pure) |
| Persist quiz answers + funnel step | repository + use cases via `di` |
| Orchestration / progress / navigation | hooks + surfaces |
| Screens | `surfaces/onboarding/` (+ reuse `surfaces/auth/` for identity/life/paywall) |

Surfaces must not import `core` for business logic beyond display helpers already allowed; prefer hooks → use cases → repos.

### Navigation shape

Prefer a **funnel orchestrator** (single entry + step machine) that:

1. Renders brand / questions / interstitial / loader / results inline  
2. Navigates to or embeds Identity → LifeWeeks → Paywall at the right steps  
3. Owns progress % and analytics `step_view`

`AuthNavigator` entry remains one route (e.g. `Onboarding`); finishing paywall (purchase or Maybe later) calls existing `completeOnboarding` and exits to main app.

Wire previously unreachable: Identity → LifeWeeks → OnboardingPaywall into this sequence (today carousel completes straight to Home).

### Completion rules

| Exit | Behavior |
|------|----------|
| Purchase success | `completeOnboarding`; entitlements via existing IAP |
| Maybe later | `completeOnboarding`; **no** preview start; Day/Year free; Month/Life gated |
| Skip mid-funnel | Not offered (except implicit kill/resume) |

### Analytics (minimal)

- `onboarding_step_view` `{ step }`
- `onboarding_answer` `{ step, value }`
- `onboarding_life_aha` `{ life_percent }`
- `onboarding_results_view` `{ goal, drain, cadence }`
- `onboarding_paywall_view`
- `onboarding_paywall_skipped`
- `onboarding_complete` `{ exit: 'purchase' | 'maybe_later' }`

## UI patterns

- Dark theme: black/gradient, white titles, gray subtitles, blue progress + accent icon  
- Full-width option rows for questions  
- Results: stacked dark rounded cards with checkmarks (match design mock)  
- Progress bar: steps 1–10; brand = none; paywall = none/full  
- Back: questions + identity; hidden on loader, results, paywall  
- Auto-advance on single-select questions  

## Edge cases

| Case | Behavior |
|------|----------|
| Kill mid-funnel | Resume at last completed step; answers kept |
| Birth date | Required; default lifespan 80 |
| Back from life weeks | To identity; profile draft kept |
| Loader interrupted | If answers + profile exist → open results |
| IAP unavailable | Paywall visible; purchase errors; Maybe later works |
| Already completed | Funnel never shown |

## Testing

- Unit: reclaim hours lookup; results card mapping from answers  
- Manual: full path → purchase; full path → Maybe later → free Home; kill/resume; back stack; IAP failure + Maybe later  

## Success criteria

1. New users never see the old 3-step carousel as the live path  
2. Completing the funnel always ends on paywall before Home  
3. Maybe later lands on free Day/Year without starting preview  
4. Results cards visibly reflect the user’s answers  
5. Mid-funnel life-weeks aha appears before Q3–Q5  

## Implementation notes (for plan)

- Create branch work under `feat/psychology-onboarding-quiz-funnel`  
- Prefer extending `AuthNavigator` + new onboarding surfaces over bloating `OnboardingScreen` carousel  
- Keep monetization ethics from `docs/MONETIZATION_STRATEGY.md` (no fake timers; free Day/Year forever)  
- Storage keys in `persistence/schema.ts` if new MMKV keys are added  
