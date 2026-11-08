/**
 * Supported app languages and the rules that map a device locale onto one of them.
 * Pure: no React, no storage, no packages. Domain code and the desktop build may import it.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'mr', nativeName: 'मराठी' },
  { code: 'es', nativeName: 'Español' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'pt-BR', nativeName: 'Português (Brasil)' },
  { code: 'id', nativeName: 'Bahasa Indonesia' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'tr', nativeName: 'Türkçe' },
  { code: 'ja', nativeName: '日本語' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/** What the user picked: a fixed language, or "follow the phone". */
export type LanguagePreference = 'system' | LanguageCode;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/** Old Android and ICU codes that still show up in `Locale.toString()`. */
const LEGACY_PRIMARY_SUBTAGS: Record<string, string> = { in: 'id' };

export function isLanguageCode(value: unknown): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some(language => language.code === value);
}

export function isLanguagePreference(
  value: unknown,
): value is LanguagePreference {
  return value === 'system' || isLanguageCode(value);
}

/**
 * First device locale (in the user's order) that we ship, else English.
 * Accepts `hi-IN`, `hi_IN`, `pt-PT`, `zh-Hans-CN`, ...
 */
export function resolveLanguage(
  tags: readonly (string | null | undefined)[],
): LanguageCode {
  for (const raw of tags) {
    if (!raw) continue;
    const lower = raw.trim().replace(/_/g, '-').toLowerCase();
    if (!lower) continue;

    const exact = SUPPORTED_LANGUAGES.find(
      language => language.code.toLowerCase() === lower,
    );
    if (exact) return exact.code;

    const primary = lower.split('-')[0];
    // We ship one Portuguese; any region reads it fine.
    if (primary === 'pt') return 'pt-BR';

    const wanted = LEGACY_PRIMARY_SUBTAGS[primary] ?? primary;
    const match = SUPPORTED_LANGUAGES.find(
      language => language.code.toLowerCase() === wanted,
    );
    if (match) return match.code;
  }
  return DEFAULT_LANGUAGE;
}
