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

  // Premium
  PREMIUM_IS_ACTIVE: 'premium.isActive',

  // Activity (Layer 3)
  ACTIVITY_BLOCKS_PREFIX: 'activity.blocks.',
  ACTIVITY_CURRENT_CATEGORY: 'activity.currentCategory',

  // Intervention limits (Layer 5)
  ACTIVITY_DAILY_LIMIT_NOTHING: 'activity.dailyLimitNothing',

  // Migration
  MIGRATION_VERSION: 'migration.version',

  // Widget
  WIDGET_CACHE: 'widget.cache',
} as const;

export const DEFAULTS = {
  USER_DEATH_AGE: 80,
  SETTINGS_THEME: 'system' as const,
  PREMIUM_IS_ACTIVE: true,
  ACTIVITY_DAILY_LIMIT_NOTHING: 2, // hours
  MIGRATION_VERSION: 0,
};

export type StoredTheme = 'light' | 'dark' | 'system';
