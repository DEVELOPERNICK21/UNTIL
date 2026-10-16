/**
 * Cross-cutting reactions that more than one feature triggers (premium changed, so refresh the widgets).
 */

import { syncPremiumStatus } from '../../features/widgets/data/WidgetSync';

/**
 * Push effective premium to the native widget bridge only. Used when device
 * eligibility changes but the purchase itself did not, so trial reminders stay.
 */
export function syncPremiumBridge(): void {
  syncPremiumStatus();
}

export function syncPremiumAfterEntitlementChange(): void {
  syncPremiumBridge();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cancelTrialLocalNotifications } = require('../../features/premium/services/trialReminders');
  void cancelTrialLocalNotifications();
}
