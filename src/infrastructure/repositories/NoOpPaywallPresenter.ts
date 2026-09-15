import type { IPaywallPresenter } from '../../domain/repository/IPaywallPresenter';

export class NoOpPaywallPresenter implements IPaywallPresenter {
  async presentIfNeeded() {
    return 'not_presented' as const;
  }
}
