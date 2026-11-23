/**
 * Tells the person what happened when a purchase did not go through, and records it.
 *
 * Every failure is logged. Only a real failure is also reported as a non-fatal error: "already
 * owned", "pending" and "offline" are expected states, and reporting them buried the real ones.
 * "Already owned" offers the restore the paywall already has, instead of a dead end.
 */

import { useCallback, type MutableRefObject } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from '../../../shared/i18n/useTranslation';
import {
  recordCrashError,
  type AnalyticsPaywallSource,
} from '../../../shared/analytics/analytics';
import { classifyPurchaseFailure } from '../domain/purchaseFailure';
import { logPurchaseFailed } from '../services/paywallTelemetry';

export type PurchaseFailure = {
  planId: string;
  priceDisplay: string;
  code?: unknown;
  message?: string;
  /** The thrown value, when there is one, so the crash report keeps its stack. */
  error?: unknown;
};

/** `restoreRef` is filled by the paywall once it has defined its restore handler. */
export function usePurchaseFailureAlert(
  source: AnalyticsPaywallSource,
  restoreRef: MutableRefObject<(() => void) | null>,
): (failure: PurchaseFailure) => void {
  const { t } = useTranslation();

  return useCallback(
    (failure: PurchaseFailure) => {
      logPurchaseFailed({
        planId: failure.planId,
        source,
        priceDisplay: failure.priceDisplay,
        code: failure.code,
        message: failure.message,
      });

      switch (classifyPurchaseFailure(failure.code)) {
        case 'alreadyOwned':
          Alert.alert(
            t('premium.alert.alreadyOwnedTitle'),
            t('premium.alert.alreadyOwnedBody'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('premium.alert.restoreAction'),
                onPress: () => restoreRef.current?.(),
              },
            ],
          );
          return;
        case 'pending':
          Alert.alert(
            t('premium.alert.pendingTitle'),
            t('premium.alert.pendingBody'),
          );
          return;
        case 'offline':
          Alert.alert(
            t('premium.alert.offlineTitle'),
            t('premium.alert.offlineBody'),
          );
          return;
        default:
          recordCrashError(
            failure.error ?? new Error(failure.message ?? 'Purchase failed'),
            'PremiumPaywallBody.requestPurchase',
          );
          Alert.alert(
            t('premium.alert.purchaseFailed'),
            failure.message || t('premium.alert.genericError'),
          );
      }
    },
    [source, t, restoreRef],
  );
}
