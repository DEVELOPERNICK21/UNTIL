/**
 * Storage keys, types, and defaults
 * Use same keys in Swift/Kotlin widget code for shared MMKV access
 */

export const STORAGE_KEYS = {
  // User
  USER_BIRTH_DATE: 'user.birthDate',
  USER_DEATH_AGE: 'user.deathAge',

  // Settings
  SETTINGS_THEME: 'settings.theme',

  // Premium / Subscription (one device, web purchase)
  PREMIUM_IS_ACTIVE: 'premium.isActive',
  /** Paid OR active in-app preview — synced to native for widget/overlay gating. */
  PREMIUM_EFFECTIVE_ACCESS: 'premium.effectiveAccess',
  SUBSCRIPTION_LICENSE_KEY: 'subscription.licenseKey',
  SUBSCRIPTION_DEVICE_ID: 'subscription.deviceId',
  SUBSCRIPTION_LAST_VERIFIED: 'subscription.lastVerified',

  // Freemium trial + engagement (SSOT)
  TRIAL_START_DATE: 'trial.startDate',
  ENGAGEMENT_APP_OPEN_COUNT: 'engagement.appOpenCount',
  ENGAGEMENT_LIFE_SCREEN_VIEWED: 'engagement.lifeScreenViewed',
  ENGAGEMENT_LIFE_UNLOCK_UNTIL: 'engagement.lifeUnlockUntil',
  /** Last time user dismissed an interstitial paywall (48h cooldown). */
  PAYWALL_DISMISSED_AT: 'engagement.paywallDismissedAt',
  /** Soft student verification — school email that unlocked student SKU CTA. */
  STUDENT_VERIFIED_EMAIL: 'student.verifiedEmail',
  STUDENT_VERIFIED_AT: 'student.verifiedAt',

  // Play purchase metadata (SSOT)
  PURCHASE_TYPE: 'purchase.type',
  PURCHASE_DATE: 'purchase.date',
  PURCHASE_TOKEN: 'purchase.token',

  // Activity (Layer 3)
  ACTIVITY_BLOCKS_PREFIX: 'activity.blocks.',
  ACTIVITY_CURRENT_CATEGORY: 'activity.currentCategory',

  // Intervention limits (Layer 5)
  ACTIVITY_DAILY_LIMIT_NOTHING: 'activity.dailyLimitNothing',

  // Migration
  MIGRATION_VERSION: 'migration.version',

  // Widget
  WIDGET_CACHE: 'widget.cache',
  WIDGET_CONFIG: 'widget.config',
  /** Hex accent color for native widgets (e.g. #E87C20). Synced from in-app customization. */
  WIDGET_ACCENT_COLOR: 'widget.accentColor',

  // Custom counters (for counter widget)
  CUSTOM_COUNTERS: 'custom.counters',

  // Countdowns (for countdown widget)
  COUNTDOWNS: 'countdowns',

  // Daily tasks (task list + widget payload)
  DAILY_TASKS: 'daily.tasks',
  DAILY_TASKS_WIDGET: 'daily.tasks.widget',
  TASK_CARRYOVER_DISMISSED_DATE: 'tasks.carryoverDismissedDate',

  // Hour calculation (stopwatch) widget — single timer, tap to start/stop
  HOUR_CALCULATION_WIDGET: 'hour.calculation.widget',

  // Live Activity / Dynamic Island — which widget type to show
  LIVE_ACTIVITY_WIDGET_TYPE: 'liveActivity.widgetType',
  // The user pressed Start and has not pressed Stop. Lets the app bring the island back
  // when iOS ends it after about 8 hours.
  LIVE_ACTIVITY_ENABLED: 'liveActivity.enabled',
  LIVE_ACTIVITY_STARTED_AT: 'liveActivity.startedAt',

  // Android floating overlay — which widget type to show
  OVERLAY_WIDGET_TYPE: 'overlay.widgetType',
  OVERLAY_ENABLED: 'overlay.enabled',

  // Monthly goals and repeat-daily rules
  MONTHLY_GOALS: 'monthly.goals',
  GOAL_REPEAT_DAILY: 'goal.repeat.daily',

  // Onboarding (auth flow)
  ONBOARDING_COMPLETED: 'onboarding.completed',
  ONBOARDING_COMPLETED_AT: 'onboarding.completedAt',
  ONBOARDING_FUNNEL_STEP: 'onboarding.funnelStep',
  ONBOARDING_QUIZ_ANSWERS: 'onboarding.quizAnswers',
  WIDGET_COACH_PENDING: 'engagement.widgetCoachPending',
  DEFERRED_PAYWALL_SHOWN: 'engagement.deferredPaywallShown',
  DAY2_NOTIFICATION_SCHEDULED: 'engagement.day2NotificationScheduled',

  // Offline smart reflections / Time Coach
  DAILY_REFLECTION_DATE: 'reflection.daily.date',
  DAILY_REFLECTION_PAYLOAD: 'reflection.daily.payload',
  DAILY_REFLECTION_DISMISSED_DATE: 'reflection.daily.dismissedDate',
  REFLECTION_TONE: 'reflection.tone',

  // Retention notifications (local, rotating schedule)
  RETENTION_NOTIFICATIONS_ENABLED: 'retention.notifications.enabled',
  RETENTION_NOTIFICATIONS_SCHEDULED_AT: 'retention.notifications.scheduledAt',
  RETENTION_NOTIFICATIONS_LAST_APP_OPEN_DATE:
    'retention.notifications.lastAppOpenDate',
  RETENTION_NOTIFICATIONS_LAST_APP_OPEN_HOUR:
    'retention.notifications.lastAppOpenHour',
  RETENTION_NOTIFICATIONS_LAST_SENT_DATE:
    'retention.notifications.lastSentDate',
  RETENTION_NOTIFICATIONS_IDS: 'retention.notifications.ids',
  RETENTION_NOTIFICATIONS_PERMISSION_REQUESTED:
    'retention.notifications.permissionRequested',
  /** How often the daily check-in reminder was offered (engagement/data/MmkvReminderOptInStore). */
  REMINDER_OPT_IN_ASKS: 'retention.optIn.asks',
  REMINDER_OPT_IN_LAST_ASK_AT: 'retention.optIn.lastAskAt',

  // Home. Owner: home/services/swipeHint.
  HOME_SWIPE_HINT_SHOWN: 'home.swipeHintShown',

  // Task and deadline notifications. Owner: engagement/services/taskDeadlineNotifications.
  TASK_DEADLINE_NOTIFICATIONS_ENABLED: 'taskDeadline.notifications.enabled',
  TASK_DEADLINE_NOTIFICATIONS_IDS: 'taskDeadline.notifications.ids',
  TASK_DEADLINE_COMPLETION_NOTIFIED_DATE:
    'taskDeadline.notifications.completionNotifiedDate',

  // App update checks
  UPDATE_LAST_CHECK_AT: 'update.lastCheckAt',
  /** When the system notification prompt was last shown (shared/platform/notificationPermission). */
  NOTIFICATION_PERMISSION_LAST_ASK_AT: 'notifications.permissionLastAskAt',
  /** Latest build the person last said "Not now" to, how many times, and when (app-update/services/updateService). */
  UPDATE_SNOOZED_BUILD: 'update.snoozedBuild',
  UPDATE_SNOOZE_COUNT: 'update.snoozeCount',
  UPDATE_SNOOZE_AT: 'update.snoozeAt',

  // Play subscription reconcile (expired/canceled)
  PLAY_ENTITLEMENT_RECONCILE_AT: 'billing.reconcileAt',

  // Trial reminders (last preview days)
  TRIAL_REMINDERS_SCHEDULED: 'trial.remindersScheduled',
  TRIAL_REMINDERS_INAPP_SHOWN: 'trial.remindersInAppShown',

  // Purchase analytics (pending paywall context for async listener)
  PENDING_PURCHASE_CONTEXT: 'billing.pendingPurchaseContext',

  // Privacy choices (owner: services/analyticsConsent.ts)
  PRIVACY_ANALYTICS_CONSENT: 'privacy.analyticsConsent',
  PRIVACY_SESSION_RECORDING_CONSENT: 'privacy.sessionRecordingConsent',
  /** Set once a birth date under 13 is seen; never cleared by the app. */
  PRIVACY_UNDER_MINIMUM_AGE: 'privacy.underMinimumAge',

  // Countdown completion + share prompt
  COUNTDOWN_COMPLETED_FIRED: 'engagement.countdownCompletedFired',
  SHARE_PROMPT_PENDING: 'engagement.sharePromptPending',

  // In-app review (Play / App Store)
  REVIEW_PROMPT_PENDING: 'engagement.reviewPromptPending',
  LAST_AUTO_REVIEW_REQUEST_AT: 'engagement.lastAutoReviewRequestAt',
  FIRST_OPEN_DATE: 'engagement.firstOpenDate',

  // Feature discovery coach (after 3rd app open)
  FEATURE_COACH_PENDING: 'engagement.featureCoachPending',
  FEATURE_COACH_SHOWN: 'engagement.featureCoachShown',

  // Presence streak (daily “noticed” habit — Duolingo-style spine, soft tone)
  PRESENCE_STREAK_COUNT: 'engagement.presenceStreakCount',
  PRESENCE_STREAK_LONGEST: 'engagement.presenceStreakLongest',
  PRESENCE_STREAK_LAST_DATE: 'engagement.presenceStreakLastDate',
  PRESENCE_STREAK_FREEZE: 'engagement.presenceStreakFreeze',
  PRESENCE_STREAK_SAVER_ID: 'engagement.presenceStreakSaverId',

  // Badges (earned ids, celebrations already shown). Owner: MmkvBadgeRepository.
  BADGES_STATE: 'gamification.badgesState',

  // Ember companion tip memory (first-auto + rotation)
  EMBER_TIP_INTRO_SEEN: 'engagement.emberTipIntroSeen',
  EMBER_TIP_CURSOR: 'engagement.emberTipCursor',

  // Account / auth session (local mirror of Firebase session)
  AUTH_UID: 'auth.uid',
  AUTH_EMAIL: 'auth.email',
  AUTH_DEVICE_PREMIUM_ALLOWED: 'auth.devicePremiumAllowed',
} as const;

export const DEFAULTS = {
  USER_DEATH_AGE: 80,
  SETTINGS_THEME: 'system' as const,
  PREMIUM_IS_ACTIVE: false,
  ENGAGEMENT_APP_OPEN_COUNT: 0,
  ACTIVITY_DAILY_LIMIT_NOTHING: 2, // hours
  MIGRATION_VERSION: 0,
  AUTH_DEVICE_PREMIUM_ALLOWED: true,
};

export type StoredTheme = 'light' | 'dark' | 'system';
