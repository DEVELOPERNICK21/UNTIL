/**
 * Startup and change-of-language wiring: saved choice, else the phone's language, else English.
 */

import { getDeviceLanguageTags } from './deviceLocale';
import {
  resolveLanguage,
  type LanguageCode,
  type LanguagePreference,
} from './languages';
import {
  readLanguagePreference,
  writeLanguagePreference,
} from './languagePreference';
import { setLanguage } from './translate';

let preference: LanguagePreference = 'system';
const listeners = new Set<() => void>();

function effectiveLanguage(choice: LanguagePreference): LanguageCode {
  return choice === 'system' ? getDeviceLanguage() : choice;
}

/** Call once before the first render. */
export function initI18n(): void {
  preference = readLanguagePreference();
  setLanguage(effectiveLanguage(preference));
}

export function getLanguagePreference(): LanguagePreference {
  return preference;
}

export function setLanguagePreference(next: LanguagePreference): void {
  preference = next;
  writeLanguagePreference(next);
  setLanguage(effectiveLanguage(next));
  listeners.forEach(listener => listener());
}

export function subscribeLanguagePreference(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The language "match phone language" resolves to right now. */
export function getDeviceLanguage(): LanguageCode {
  return resolveLanguage(getDeviceLanguageTags());
}
