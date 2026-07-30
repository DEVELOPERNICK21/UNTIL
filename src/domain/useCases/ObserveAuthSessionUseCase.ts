/**
 * ObserveAuthSessionUseCase - Observes the local auth session (uid, email,
 * devicePremiumAllowed) for the UI.
 */

import type {
  AuthSessionState,
  IAuthSessionRepository,
} from '../repository/IAuthSessionRepository';

export class ObserveAuthSessionUseCase {
  constructor(private readonly repository: IAuthSessionRepository) {}

  observe(): AuthSessionState {
    return this.repository.getState();
  }

  subscribe(callback: () => void): () => void {
    return this.repository.subscribe(callback);
  }
}
