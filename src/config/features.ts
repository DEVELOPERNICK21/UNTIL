/**
 * Feature flags — SSOT for enabling/disabling app features.
 * Surfaces use hooks (e.g. useGoalsFeatureEnabled) that read from here or from di/subscription.
 */

/**
 * When true, the Home tasks FAB opens DailyTasks (full flow).
 * When false, the FAB still shows and opens TasksComingSoon.
 */
export const GOALS_FEATURE_ENABLED = false;
