/**
 * License verification adapter — calls backend API for activation and verification.
 * Replace the API_BASE_URL and implement your backend per docs/SUBSCRIPTION.md.
 */

import type { ILicenseVerificationService } from '../../domain/ports/ILicenseVerificationService';
import type { ActivationResult, VerificationResult } from '../../types/subscription';

// Configure your backend URL. Use env var in production.
const API_BASE_URL = process.env.UNTIL_LICENSE_API ?? 'https://your-api.example.com/until';

export class LicenseVerificationServiceAdapter implements ILicenseVerificationService {
  async activate(licenseKey: string, deviceId: string): Promise<ActivationResult> {
    try {
      const body = { licenseKey: licenseKey.trim(), deviceId };
      const res = await fetch(`${API_BASE_URL}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
      };
      if (res.ok && data.success) {
        return { success: true };
      }
      const message = data.error ?? 'Activation failed';
      if (message.toLowerCase().includes('already') || message.toLowerCase().includes('another device')) {
        return { success: false, code: 'already_activated', message };
      }
      if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('not found')) {
        return { success: false, code: 'invalid_license', message };
      }
      const code = (data.code as ActivationResult extends { success: false } ? ActivationResult['code'] : 'unknown') ?? 'unknown';
      return { success: false, code, message };
    } catch (e) {
      return {
        success: false,
        code: 'network_error',
        message: e instanceof Error ? e.message : 'Network error',
      };
    }
  }

  async verify(licenseKey: string, deviceId: string): Promise<VerificationResult> {
    try {
      const params = new URLSearchParams({ licenseKey, deviceId });
      const res = await fetch(`${API_BASE_URL}/verify?${params}`, { method: 'GET' });
      const data = (await res.json()) as {
        valid?: boolean;
        error?: string;
        code?: string;
      };
      if (res.ok && data.valid) {
        return { valid: true };
      }
      const message = data.error ?? 'Verification failed';
      if (message.toLowerCase().includes('revoked') || message.toLowerCase().includes('refund')) {
        return { valid: false, code: 'revoked', message };
      }
      if (message.toLowerCase().includes('device') || message.toLowerCase().includes('another')) {
        return { valid: false, code: 'device_mismatch', message };
      }
      if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('expired')) {
        return { valid: false, code: 'invalid', message };
      }
      const code = (data.code as VerificationResult extends { valid: false } ? VerificationResult['code'] : 'unknown') ?? 'unknown';
      return { valid: false, code, message };
    } catch (e) {
      return {
        valid: false,
        code: 'network_error',
        message: e instanceof Error ? e.message : 'Network error',
      };
    }
  }
}
