/**
 * ISubscriptionRepository - Port for premium/subscription state
 * Single Source of Truth: all reads/writes for premium go through this interface.
 */

type Subscriber = () => void;

export interface ISubscriptionRepository {
  getIsPremium(): boolean;
  setIsPremium(value: boolean): void;
  subscribe(callback: Subscriber): () => void;
}
