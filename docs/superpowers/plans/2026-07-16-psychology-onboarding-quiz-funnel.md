# Psychology Onboarding Quiz Funnel — Implementation Plan

> **For agentic workers:** Spec: `docs/superpowers/specs/2026-07-16-psychology-onboarding-quiz-funnel-design.md`

**Goal:** Replace the 3-step carousel with brand → quiz → mid life-aha → loader → results → soft paywall.

**Architecture:** Pure quiz mapping in `core/`; answers + funnel step in onboarding repository; `OnboardingScreen` becomes the funnel orchestrator; Identity / LifeWeeks / Paywall stay stack screens.

**Tech Stack:** React Native, MMKV, existing AuthNavigator + Play Billing paywall

## Global Constraints

- Maybe later = free Day/Year only (no preview start)
- Surfaces → hooks → use cases → repos (no core business logic in surfaces beyond display)
- Storage keys in `persistence/schema.ts`

---

### Task 1: Core quiz + types + unit tests
### Task 2: Persist answers/step (repo, use cases, di, hook)
### Task 3: Funnel UI orchestrator + step components
### Task 4: Wire Identity → LifeWeeks → back to quiz → Paywall
### Task 5: Paywall copy (“Maybe later” + keep-map framing)
### Task 6: Verify tests / typecheck
