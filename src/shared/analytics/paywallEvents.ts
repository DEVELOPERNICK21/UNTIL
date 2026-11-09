/**
 * Paywall funnel events. Kept apart from the main event list so that file stays within its
 * line limit; AnalyticsEventName includes this union.
 *
 * - paywall_shown          { surface, kind: 'custom' | 'revenuecat', is_premium? }
 *                          The paywall was actually on screen (not merely requested).
 * - paywall_plan_selected  { surface, plan_id }   A plan card was tapped on the custom paywall.
 * - paywall_dismissed      { surface, kind, method, seconds_open }   Closed without buying.
 * - premium_restore_empty  { source }   Restore succeeded but found nothing.
 * - premium_restore_failed { source, error_code }   Restore threw.
 * - premium_welcome_shown  { plan }   The "Welcome to Premium" popup was on screen.
 * - premium_welcome_see_plan { plan }   They tapped "See my plan" on it.
 */
export type PaywallEventName =
  | 'paywall_shown'
  | 'paywall_plan_selected'
  | 'paywall_dismissed'
  | 'premium_restore_empty'
  | 'premium_restore_failed'
  | 'premium_welcome_shown'
  | 'premium_welcome_see_plan';
