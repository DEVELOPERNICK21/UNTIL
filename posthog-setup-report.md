# PostHog post-wizard report

The wizard completed a deep review and targeted extension of the UNTIL app's PostHog integration. The core infrastructure — SDK, `PostHogProvider`, PostHog client, user identification, screen-view tracking, and person-property syncing — was already in place. The wizard added five new high-value events that were missing from the existing coverage, extended the `AnalyticsEventName` union type, configured environment variables, created a local analytics override file, and built a PostHog dashboard with five insights.

## Events added

| Event | Description | File |
|---|---|---|
| `onboarding_paywall_skipped` | User taps "Continue with free Day & Year" to skip the onboarding paywall after seeing their life stats. Key conversion-funnel drop-off signal. | `src/surfaces/auth/OnboardingPaywallScreen.tsx` |
| `task_added` | User adds a new daily task. Measures active daily engagement with the tasks feature. | `src/hooks/useDailyTasks.ts` |
| `settings_birth_date_saved` | User saves their birth date (and expected lifespan) in Settings. This unlocks the Life progress feature — a critical funnel step. Includes `is_first_time` property. | `src/surfaces/app/SettingsScreen.tsx` |
| `home_life_locked_tapped` | User taps "Unlock Premium" from the locked Life block on the Home screen. Signals upgrade intent from users who have not yet set a birth date. | `src/surfaces/app/HomeScreen.tsx` |
| `goal_created` | User creates a new monthly goal. Measures engagement with the goals feature. Includes `has_target_description` property. | `src/surfaces/app/MonthlyGoalsScreen.tsx` |

## Configuration

- **`.env`** — Created with `UNTIL_POSTHOG_API_KEY` and `UNTIL_POSTHOG_HOST` (the variable names the project already reads via `process.env` in `src/config/analytics.ts`).
- **`src/config/analytics.local.ts`** — Created as the project's designated local override file (gitignored). References `process.env` so values flow from build-time environment injection. Fill in your PostHog project token here, or set `UNTIL_POSTHOG_API_KEY` in the shell before building.

## Next steps

We've built a dashboard and five insights to keep an eye on user behaviour:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/472860/dashboard/1719450)
- [Onboarding funnel (wizard)](https://us.posthog.com/project/472860/insights/DOlKoX62) — 5-step activation funnel from first onboarding screen to completion
- [Premium purchase funnel (wizard)](https://us.posthog.com/project/472860/insights/q0UsHfxI) — Paywall view → purchase started → purchase completed
- [Daily active users (wizard)](https://us.posthog.com/project/472860/insights/icArVQf1) — Unique users opening the app each day
- [Feature engagement (wizard)](https://us.posthog.com/project/472860/insights/GddQ9yM5) — Weekly task completion, share taps, and goal creation
- [Onboarding paywall — skip vs convert (wizard)](https://us.posthog.com/project/472860/insights/TS1gR81j) — Churn signal: skipped paywall vs completed purchase

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the PostHog env var names (`UNTIL_POSTHOG_API_KEY`, `UNTIL_POSTHOG_HOST`) to `.env.example` (or your project's equivalent) so collaborators know what to set.
- [ ] Wire up build-time env var injection (e.g. `babel-plugin-transform-inline-environment-variables` or `react-native-config`) so `UNTIL_POSTHOG_API_KEY` from `.env` is actually embedded in the JS bundle — or fill in `src/config/analytics.local.ts` directly for local dev.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh app launch can leave returning sessions on anonymous distinct IDs if the device ID changes.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-native/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
