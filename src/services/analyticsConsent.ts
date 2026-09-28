/**
 * Stored, revocable privacy choices for analytics and session recording.
 *
 * - Usage analytics (events only, no recording): on unless the user turns it off.
 * - Session recording: off unless the user explicitly opts in AND the feature
 *   flag is on. Unset never counts as consent.
 * - A known under-13 user gets no analytics, crash reporting or recording, and
 *   the flag is not cleared by editing the birth date later.
 */

import { getString, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { SESSION_REPLAY_ENABLED } from '../config/analytics';

export type ConsentChoice = 'granted' | 'denied';

const listeners = new Set<() => void>();

function readChoice(key: string): ConsentChoice | null {
  const raw = getString(key);
  return raw === 'granted' || raw === 'denied' ? raw : null;
}

function notify(): void {
  listeners.forEach(listener => listener());
}

export function getAnalyticsConsent(): ConsentChoice | null {
  return readChoice(STORAGE_KEYS.PRIVACY_ANALYTICS_CONSENT);
}

export function setAnalyticsConsent(choice: ConsentChoice): void {
  setString(STORAGE_KEYS.PRIVACY_ANALYTICS_CONSENT, choice);
  notify();
}

export function getSessionRecordingConsent(): ConsentChoice | null {
  return readChoice(STORAGE_KEYS.PRIVACY_SESSION_RECORDING_CONSENT);
}

export function setSessionRecordingConsent(choice: ConsentChoice): void {
  setString(STORAGE_KEYS.PRIVACY_SESSION_RECORDING_CONSENT, choice);
  notify();
}

export function isKnownUnderMinimumAge(): boolean {
  return getString(STORAGE_KEYS.PRIVACY_UNDER_MINIMUM_AGE) === '1';
}

export function markUnderMinimumAge(): void {
  if (isKnownUnderMinimumAge()) return;
  setString(STORAGE_KEYS.PRIVACY_UNDER_MINIMUM_AGE, '1');
  notify();
}

export function isAnalyticsAllowed(): boolean {
  return !isKnownUnderMinimumAge() && getAnalyticsConsent() !== 'denied';
}

export function isCrashReportingAllowed(): boolean {
  return !isKnownUnderMinimumAge();
}

export function canStartSessionReplay(): boolean {
  return (
    SESSION_REPLAY_ENABLED &&
    !isKnownUnderMinimumAge() &&
    getSessionRecordingConsent() === 'granted'
  );
}

export function subscribeAnalyticsConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
