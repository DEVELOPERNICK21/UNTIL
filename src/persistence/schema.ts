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

  // Custom counters (for counter widget)
  CUSTOM_COUNTERS: 'custom.counters',

  // Countdowns (for countdown widget)
  COUNTDOWNS: 'countdowns',

  // Daily tasks (task list + widget payload)
  DAILY_TASKS: 'daily.tasks',
  DAILY_TASKS_WIDGET: 'daily.tasks.widget',

  // Hour calculation (stopwatch) widget — single timer, tap to start/stop
  HOUR_CALCULATION_WIDGET: 'hour.calculation.widget',

  // Live Activity / Dynamic Island — which widget type to show
  LIVE_ACTIVITY_WIDGET_TYPE: 'liveActivity.widgetType',

  // Android floating overlay — which widget type to show
  OVERLAY_WIDGET_TYPE: 'overlay.widgetType',
  OVERLAY_ENABLED: 'overlay.enabled',

  // Monthly goals and repeat-daily rules
  MONTHLY_GOALS: 'monthly.goals',
  GOAL_REPEAT_DAILY: 'goal.repeat.daily',

  // Onboarding (auth flow)
  ONBOARDING_COMPLETED: 'onboarding.completed',
  ONBOARDING_COMPLETED_AT: 'onboarding.completedAt',
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

  // App update checks
  UPDATE_LAST_CHECK_AT: 'update.lastCheckAt',
  UPDATE_DISMISSED_VERSION: 'update.dismissedVersion',

  // Play subscription reconcile (expired/canceled)
  PLAY_ENTITLEMENT_RECONCILE_AT: 'billing.reconcileAt',

  // Trial reminders (last preview days)
  TRIAL_REMINDERS_SCHEDULED: 'trial.remindersScheduled',
  TRIAL_REMINDERS_INAPP_SHOWN: 'trial.remindersInAppShown',
} as const;

export const DEFAULTS = {
  USER_DEATH_AGE: 80,
  SETTINGS_THEME: 'system' as const,
  PREMIUM_IS_ACTIVE: false,
  ENGAGEMENT_APP_OPEN_COUNT: 0,
  ACTIVITY_DAILY_LIMIT_NOTHING: 2, // hours
  MIGRATION_VERSION: 0,
};

export type StoredTheme = 'light' | 'dark' | 'system';
