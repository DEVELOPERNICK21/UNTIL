/**
 * Translator: `t('settings.title')`, `t('home.daysLeft', { count: 3 })`.
 *
 * Pure on purpose (no React, no storage, no packages) so domain code, the phone UI and the
 * desktop build can all call it. Which language is active is a module-level fact, set once at
 * startup by `initI18n()` and again whenever the user picks another language.
 *
 * Message syntax matches i18next, so a later move to that library is a swap, not a rewrite:
 * - `{{name}}` is replaced by `params.name`
 * - passing a numeric `count` picks `key_one`, `key_few`, `key_many`, `key_other`, ...
 */

import { DEFAULT_LANGUAGE, type LanguageCode } from './languages';
import { pluralCategory } from './plural';
import { resources, type TranslationKey } from './resources';

export type { TranslationKey } from './resources';
export type TranslateParams = Record<string, string | number>;

let currentLanguage: LanguageCode = DEFAULT_LANGUAGE;
const listeners = new Set<() => void>();

export function getLanguage(): LanguageCode {
  return currentLanguage;
}

export function setLanguage(language: LanguageCode): void {
  if (language === currentLanguage) return;
  currentLanguage = language;
  listeners.forEach(listener => listener());
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name: string) => {
    if (!(name in params)) return whole;
    const value = params[name];
    // `count` is a quantity, so it gets the language's digit grouping (14,220 / 14 220).
    return name === 'count' && typeof value === 'number'
      ? formatNumber(value)
      : String(value);
  });
}

function lookup(language: LanguageCode, key: string): string | undefined {
  return resources[language][key];
}

function lookupPlural(
  language: LanguageCode,
  key: string,
  count: number,
): string | undefined {
  return (
    lookup(language, `${key}_${pluralCategory(language, count)}`) ??
    lookup(language, `${key}_other`)
  );
}

/**
 * Translates into a given language instead of the active one (English still fills any gap).
 * For text that must differ from the UI language, like the share image: its bundled font cannot
 * draw every script. A numeric `count` is still grouped by the active language.
 */
export function tIn(
  language: LanguageCode,
  key: TranslationKey,
  params?: TranslateParams,
): string {
  const count = typeof params?.count === 'number' ? params.count : undefined;
  let template: string | undefined;
  if (count !== undefined) {
    template =
      lookupPlural(language, key, count) ??
      lookupPlural(DEFAULT_LANGUAGE, key, count);
  }
  template ??= lookup(language, key) ?? lookup(DEFAULT_LANGUAGE, key) ?? key;
  return interpolate(template, params);
}

export function t(key: TranslationKey, params?: TranslateParams): string {
  return tIn(currentLanguage, key, params);
}

/**
 * BCP 47 tag for Intl. Latin digits are forced: Marathi and Hindi default to Devanagari
 * numerals in some Intl builds, and the app's numbers (percentages, day counts) are Latin.
 */
export function getLocaleTag(language: LanguageCode = currentLanguage): string {
  const base =
    language === 'hi' || language === 'mr' ? `${language}-IN` : language;
  return `${base}-u-nu-latn`;
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(getLocaleTag(), options).format(value);
  } catch {
    return value.toLocaleString('en-US', options);
  }
}

export function formatDate(
  value: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  try {
    return new Intl.DateTimeFormat(getLocaleTag(), options).format(value);
  } catch {
    return value.toLocaleDateString('en-US', options);
  }
}
