import type {
  IPaywallPresenter,
  PaywallPresentResult,
} from '../../domain/repository/IPaywallPresenter';

/**
 * Fallback when react-native-purchases-ui is unavailable.
 * Callers should show the custom PremiumPaywallBody on `not_presented`.
 */
export class NoOpPaywallPresenter implements IPaywallPresenter {
  async present(): Promise<PaywallPresentResult> {
    return 'not_presented';
  }

  async presentIfNeeded(): Promise<PaywallPresentResult> {
    return 'not_presented';
  }
}
