/**
 * ObserveSubscriptionUseCase - Observes subscription/premium state from SubscriptionRepository
 */

import type { ISubscriptionRepository } from '../repository/SubscriptionRepository';

export interface SubscriptionState {
  isPremium: boolean;
}

export class ObserveSubscriptionUseCase {
  constructor(private readonly repository: ISubscriptionRepository) {}

  observe(): SubscriptionState {
    return {
      isPremium: this.repository.getIsPremium(),
    };
  }

  subscribe(callback: () => void): () => void {
    return this.repository.subscribe(callback);
  }
}
