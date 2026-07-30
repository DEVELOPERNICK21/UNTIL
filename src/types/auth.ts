/**
 * Account / auth DTOs — provider-agnostic (Google first, Apple later).
 */

export type AuthProviderId = 'google' | 'apple';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  providers: AuthProviderId[];
}

export interface AccountDevice {
  id: string;
  platform: 'ios' | 'android';
  label: string | null;
  lastSeenAt: number;
  createdAt: number;
  active: boolean;
}

export interface CloudEntitlement {
  active: boolean;
  source: 'play' | 'app_store' | 'license' | 'none';
  purchaseType: 'monthly' | 'yearly' | 'lifetime' | null;
  lastValidatedAt: number;
}

export interface CloudUserProfile {
  birthDate: string | null;
  deathAge: number | null;
  theme: string | null;
  updatedAt: number;
}
