/**
 * ILicenseVerificationService - Port for license activation and verification
 * Implement with backend API (Stripe, Paddle, or custom).
 */

import type { ActivationResult, VerificationResult } from '../../types/subscription';

export interface ILicenseVerificationService {
  /** Activate license on this device. Fails if already activated elsewhere. */
  activate(licenseKey: string, deviceId: string): Promise<ActivationResult>;

  /** Verify license is still valid. Call periodically and on app launch. */
  verify(licenseKey: string, deviceId: string): Promise<VerificationResult>;
}
