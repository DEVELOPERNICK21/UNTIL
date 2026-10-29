/**
 * useItemLimit — how many deadlines or counters this person can keep right now.
 * Premium (paid, or the in-app preview) lifts the free limit of one.
 */

import { useAccessControl } from './useAccessControl';
import { itemLimit, PREMIUM_ITEM_LIMIT } from '../../../config/featureLimits';

export function useItemLimit(): { limit: number; hasPremium: boolean; ceiling: number } {
  const { hasPremiumBundle } = useAccessControl();
  return {
    limit: itemLimit(hasPremiumBundle),
    hasPremium: hasPremiumBundle,
    ceiling: PREMIUM_ITEM_LIMIT,
  };
}
