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
