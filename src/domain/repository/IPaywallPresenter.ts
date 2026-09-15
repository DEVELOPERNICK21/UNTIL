export interface IPaywallPresenter {
  /** Reserved for react-native-purchases-ui; no-op in this plan. */
  presentIfNeeded(): Promise<'purchased' | 'restored' | 'cancelled' | 'not_presented'>;
}
