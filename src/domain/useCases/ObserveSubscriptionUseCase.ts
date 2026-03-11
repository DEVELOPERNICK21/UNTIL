/**
 * ObserveSubscriptionUseCase - Observes subscription/premium state from SubscriptionRepository
 */

import type { ISubscriptionRepository } from '../repository/SubscriptionRepository';

export class ObserveSubscriptionUseCase {
  constructor(private readonly repository: ISubscriptionRepository) {}

  observe() {
    return this.repository.getState();
  }

  subscribe(callback: () => void): () => void {
    return this.repository.subscribe(callback);
  }
}
