/**
 * RevenueCatUI paywall presenter.
 * Surfaces must not import react-native-purchases-ui; they call this via di.
 */

import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import type {
  IPaywallPresenter,
  PaywallPresentResult,
} from '../../domain/repository/IPaywallPresenter';
import { REVENUECAT_ENTITLEMENT_PREMIUM } from '../../config/revenueCat';

function mapResult(result: string): PaywallPresentResult {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
      return 'purchased';
    case PAYWALL_RESULT.RESTORED:
      return 'restored';
    case PAYWALL_RESULT.CANCELLED:
      return 'cancelled';
    case PAYWALL_RESULT.ERROR:
      return 'error';
    case PAYWALL_RESULT.NOT_PRESENTED:
    default:
      return 'not_presented';
  }
}

export class RevenueCatPaywallPresenter implements IPaywallPresenter {
  async present(): Promise<PaywallPresentResult> {
    try {
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });
      return mapResult(result);
    } catch {
      return 'error';
    }
  }

  async presentIfNeeded(): Promise<PaywallPresentResult> {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_PREMIUM,
        displayCloseButton: true,
      });
      return mapResult(result);
    } catch {
      return 'error';
    }
  }
}
