/**
 * useGoalsFeatureEnabled — whether the Goals feature (FAB + entry) is enabled.
 * Reads from config/features; can be extended to gate by premium (e.g. useObserveSubscription().isPremium).
 */

import { GOALS_FEATURE_ENABLED } from '../config/features';

export function useGoalsFeatureEnabled(): boolean {
  return GOALS_FEATURE_ENABLED;
}
