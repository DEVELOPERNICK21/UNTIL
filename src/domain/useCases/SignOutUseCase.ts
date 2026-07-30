/**
 * SignOutUseCase — end the session and stop treating cloud entitlement as active.
 * DOB, settings, and local purchases stay: sign-out is not a data wipe.
 */

import type { IAuthService } from '../ports/IAuthService';
import type { IAuthSessionRepository } from '../repository/IAuthSessionRepository';
import type { ISubscriptionRepository } from '../repository/ISubscriptionRepository';
import { hasLocalPurchaseProof } from '../../core/account/entitlementProof';

export class SignOutUseCase {
  constructor(
    private readonly authService: IAuthService,
    private readonly authSession: IAuthSessionRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly onEntitlementChanged?: () => void
  ) {}

  async execute(): Promise<{ localPremiumKept: boolean }> {
    await this.authService.signOut();
    return this.clearLocalSession();
  }

  /**
   * The local half of sign-out: drop the session mirror and any premium that
   * only existed because of the account. Call this directly when Firebase has
   * already dropped the session (e.g. revoked on another device), so we do not
   * ask it to sign out again.
   */
  clearLocalSession(): { localPremiumKept: boolean } {
    /** Clearing also resets devicePremiumAllowed to true, the unsigned default. */
    this.authSession.clear();

    const keepPremium = hasLocalPurchaseProof({
      purchaseType: this.subscriptionRepository.getPurchaseType(),
      licenseKey: this.subscriptionRepository.getLicenseKey(),
    });

    if (!keepPremium && this.subscriptionRepository.getIsPremium()) {
      this.subscriptionRepository.setIsPremium(false);
      this.onEntitlementChanged?.();
    }

    return { localPremiumKept: this.subscriptionRepository.getIsPremium() };
  }
}
