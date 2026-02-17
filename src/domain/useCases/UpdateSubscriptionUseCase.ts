/**
 * UpdateSubscriptionUseCase - Updates subscription/premium state via SubscriptionRepository
 */

import type { ISubscriptionRepository } from '../repository/SubscriptionRepository';

export class UpdateSubscriptionUseCase {
  constructor(private readonly repository: ISubscriptionRepository) {}

  execute(isPremium: boolean): void {
    this.repository.setIsPremium(isPremium);
  }
}
