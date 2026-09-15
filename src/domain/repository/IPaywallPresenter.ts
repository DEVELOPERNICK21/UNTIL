/**
 * Domain result for presenting a store paywall UI.
 * Maps to RevenueCat PAYWALL_RESULT without leaking SDK types into domain.
 */
export type PaywallPresentResult =
  | 'purchased'
  | 'restored'
  | 'cancelled'
  | 'error'
  | 'not_presented';

export interface IPaywallPresenter {
  /**
   * Present the dashboard-configured RevenueCat paywall.
   * Always show when called (first-offer screens).
   */
  present(): Promise<PaywallPresentResult>;

  /**
   * Present only when entitlement `premium` is missing.
   */
  presentIfNeeded(): Promise<PaywallPresentResult>;
}
