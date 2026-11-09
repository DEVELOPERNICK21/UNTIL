# 06 · Retention strategy

Date 2026-11-04. Tags: `[CODE]` `[DATA]` `[BENCH]` `[ASSUME]` `[MISSING]` ([legend](README.md#how-claims-are-labelled)). Proposals only; nothing has been built or changed.

## 1. The problem in numbers

D1 11.6%, D2 7.6%, D7 3.5%, D14 1.1% `[DATA]`; typical lifestyle/productivity medians are about 24% / 10% / 5% (D1 / D7 / D30) `[BENCH: MWM, US Q3 2025; a different source puts the all-category average near 28 / 18 / 8]`. Roughly 57 app removes per 100 first opens `[DATA]`. These cohorts were mostly on the crashing 1.3 build, so some of the loss is crashes, not product. Re-measure after the stability fix before concluding that the product itself does not retain.

## 2. What drives a return visit in *this* product

A time-awareness app has an unusual retention shape: **the product is meant to be glanced at, not opened.** A widget that shows the day without opening the app is the best outcome, and it is invisible to app-open retention. That produces three consequences:

1. **The widget is the retention engine.** Measure "has a widget" as the activation event ([04](04-analytics-tracking-plan.md)), and compare D7 for owners and non-owners. Widget presence cannot be seen on iOS and has not been logged on Android yet `[CODE]`.
2. **App-open retention understates real use.** Do not judge the product on D7 alone; also track widget-owner share and 28-day active (app open or widget interaction).
3. **A "streak of opening the app" conflicts with the pitch** ("check without opening the app"). The presence streak exists `[CODE]` (`features/presence`) with an evening reminder at 21:00; treat it as a nicety, not the engine.

## 3. What is already built `[CODE]`

| Mechanism | Detail | Where |
|-----------|--------|-------|
| Daily progress reminder | Mon–Fri 08:00, Sunday 09:00, Saturday off; a calm line per weekday ("29% of this week is behind you"); skipped on days you already opened after 07:00; scheduled 7 days ahead, refreshed on each open. **Off by default** (`DEFAULT_ENABLED = false`). **Time is not user-configurable** | `retentionNotifications.ts`, `retentionNotificationCopy.ts` |
| Opt-in prompts | Quiz answer "check-ins" enables it; value-first sheet from the 5th open, max 2 asks, 5 days apart; widgets-only users are never asked | `useOnboardingFunnel.ts`, `reminderOptIn.ts` |
| Win-back | From 3 days away the line changes ("A week of your life went by. Your year is X% gone."); stops after 14 days | `retentionNotificationCopy.ts:101-103` |
| Day-2 nudge | One-off "Add the Day widget" push | `engagementNotifications.ts` |
| Weekly / daily reflection | Home "time coach" card with tone options; weekly message adds the quiz priority | `features/reflections` |
| Task and deadline reminders | 23:00 "1 hour left" for open tasks, deadline pushes | `taskDeadlineCopy.ts` |
| Presence streak and badges | 18 badges, daily quests, streak chip | `features/badges`, `features/presence` |
| Share prompts, feature tour | `SharePromptModal`, `FeatureDiscoveryModal`, `WidgetCoachModal` | `features/engagement` |

The foundation is stronger than the numbers suggest. What is missing is *calendar-driven reasons to come back* and measurement.

## 4. Verdict on each idea in the brief

| Idea | Verdict | Why |
|------|---------|-----|
| **Daily time-progress reminder** | Keep; improve | It is the right default for the product. Make the **hour configurable** (it is fixed at 08:00; people wake, work and commute differently), offer it **at the widget moment** (after the first widget, not at the 5th open), and test weekend behaviour (Saturday off assumes a Monday-to-Friday week). |
| **Weekly progress summary** | Build, small | A Sunday "week in a card": days gone, days left in the year, tasks done, one reflection line, shareable. The Sunday reminder and the weekly reflection already exist; this is a landing screen for them, not a new feature. |
| **Monthly reflection** | Build, smaller | On the first of the month: "October is gone. 31 days." One shareable card and one optional question. Skip journaling; competitors with AI journals (Time Left Widgets) are a different product `[BENCH]`. |
| **Year progress milestones** | **Build first; highest return** | Calendar-driven, honest, and each one is a natural share moment: 25 / 50 / 75% of the year, 100 / 30 / 7 days left, New Year's Day, the user's birthday, round weeks lived (1,000th, 1,500th), the start of each month. One extra notification a week at most. |
| **Personal time goals** | Do not add a new system | Countdowns to the user's own dates are the stickiest feature in this category ("N days until my wedding / exam / trip / baby"). UNTIL already has countdowns, counters and monthly goals `[CODE]`. Add milestone pushes for countdowns (30 / 7 / 1 day). Do not build another goal engine. |
| **Streaks** | Keep, do not expand | Presence streak is in place with a kind tone. A loss-aversion streak (freezes, rescue offers, streak-linked upsell) is manipulative and conflicts with the product's calm promise. Measure retention for streak holders; do not assume causation. |
| **Widget personalization** | Nudge | Customisation creates ownership. One nudge on day 3: "Make your widget yours" with accents, presets, size. Premium accents already exist `[CODE]`. |
| **Motivational insights** | Already exist; do not add | Ember tips, reflections, personalised lines from the quiz. More copy is not the constraint. |
| **Custom time-based notifications** | Yes, the reminder hour and the milestone set | Keep it a short list of choices, not a notification builder. |

## 5. The seasonal fact that dominates the next 60 days

Year-progress and life-in-weeks apps get their yearly peak around **New Year**: resolutions, "how much of 2026 is gone" posts, new phones, fresh widget setups. Today is 2026-11-04, which leaves about **8 weeks** to 1 January 2027 `[ASSUME: the peak is real for this category; the Play Console search-term and installs-by-day charts for last January will confirm — request C-series]`. Practical consequence: the stability fix, the localized store listing (including Hindi, and the revenue markets), the "Year in review" share card and the milestone notifications should be ready by mid-December, not after the peak. See [10](10-90-day-execution-roadmap.md).

## 6. Recurring-value features that justify keeping UNTIL installed

| Feature | Recurring value | Exists? | Priority |
|---------|-----------------|--------|----------|
| Personalised, good-looking widget on the home or lock screen | Daily impression with no effort | Yes | Keep investing in presets and accents |
| Countdowns to dates that matter, with milestone pushes | Anticipation, a reason to open | Countdowns yes; milestone pushes no | P1 |
| Year milestones and "Year in review" card | A shareable moment a few times a year | No | **P0 (before Jan 1)** |
| Sunday week card and month card | A weekly and monthly ritual | Partly (reflection card) | P1 |
| Life weeks (Life screen, widget, watch) | The emotional core | Yes (Premium on phone) | Keep |
| Birthday card ("another year, X weeks lived") | A yearly emotional beat, high share rate | No | P1 |
| Reminder hour chosen by the user | Fits the person's day | No (fixed) | P1 |
| Streak, badges, quests | Light gamification | Yes | Hold |

## 7. Retention experiments (proposed)

Full rows with hypothesis, metric, impact, effort, priority and measurement are in the [backlog](10-90-day-execution-roadmap.md#experiment-backlog). The retention ones:

| ID | Change | Primary metric | Guardrail |
|----|--------|----------------|-----------|
| R-1 | Offer the reminder at the "widget added" moment instead of open #5 | Reminder opt-in rate; D7 | Permission-denied rate |
| R-2 | User-chosen reminder hour | Notification open rate | Disable rate |
| R-3 | Year-milestone and birthday notifications (max 1 a week) | D30 among opted-in; notification opens | Reminders disabled |
| R-4 | Milestone pushes for countdowns (30 / 7 / 1 day) | Countdown-creator D30 | Uninstalls after push |
| R-5 | Day-3 "make your widget yours" nudge | Widgets customised; D7 | Dismissal rate |
| R-6 | Sunday week card from the reminder | Sunday open rate; shares | — |
| R-7 | Month card on the 1st | Month-start opens; shares | — |
| R-8 | Win-back at day 2 instead of day 3 | Reactivation within 24 h | Uninstalls |

## 8. Rules for notifications (non-negotiable)

- At most one scheduled notification per day, two on a milestone day.
- Always opt-in, asked right after the user has seen what it does; one ask, one retry five days later (already the rule).
- No guilt copy, no fake urgency, no streak-loss threat. The existing wording ("Still here when you are") is the standard to keep.
- Stop after 14 days of silence (already the rule).
- Respect the platform: on Android 13+, the permission prompt should come from a value moment, not from a background feature. Right now Android features such as the streak saver, the day-2 nudge and trial reminders can request permission on their own (`notificationPermission.ts:32`, limited to one ask every 3 days) `[CODE]`; route them through the same value-first sheet.

## 9. Measurement

- D1 / D7 / D30 and 28-day active by activation (widget owner, reminders on, language, source). [04](04-analytics-tracking-plan.md).
- Reactivation rate: win-back push sent → app open within 24 h.
- Notification opt-in rate and open rate (event `notification_opened`, to build).
- Disable rate: reminders switched off ÷ switched on (`retention_notification_disabled` exists).
- New: weekly "widget alive" share (widgets with fresh data ÷ widgets installed), the reliability side of retention ([02](02-app-performance-scorecard.md)).

Targets (starting points, `[ASSUME]` unless stated): D1 24%, D7 10%, D30 5% `[BENCH]`; reminder opt-in >25% of those asked; reminder disable rate <10% a month.
