/**
 * SendPasswordResetUseCase - email a link to choose a new password.
 *
 * Needs no age confirmation (nothing is created or stored). The answer never says whether the
 * address has an account, so this cannot be used to find out who is registered.
 */

import type { IAuthService } from '../ports/IAuthService';
import { t } from '../../../../shared/i18n/translate';

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SendPasswordResetUseCase {
  constructor(private readonly authService: IAuthService) {}

  async execute(email: string): Promise<void> {
    const normalized = email.trim();
    if (!normalized) throw new Error(t('account.error.enterEmail'));
    if (!LOOKS_LIKE_EMAIL.test(normalized)) throw new Error(t('account.error.validEmail'));
    await this.authService.sendPasswordReset(normalized);
  }
}
