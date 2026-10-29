/**
 * How many deadlines and counters a person can keep. The first of each is free for ever;
 * Premium (paid, or the in-app preview) lifts the limit. See docs/MONETIZATION_STRATEGY.md.
 *
 * Nothing is ever deleted when Premium ends: a person who already has more than the free limit
 * keeps every one of them and can still use them. They just cannot add another.
 */

export const FREE_ITEM_LIMIT = 1;

/** Not a promise of "unlimited": a ceiling that keeps the widget data and the list screens small. */
export const PREMIUM_ITEM_LIMIT = 20;

export function itemLimit(hasPremium: boolean): number {
  return hasPremium ? PREMIUM_ITEM_LIMIT : FREE_ITEM_LIMIT;
}
