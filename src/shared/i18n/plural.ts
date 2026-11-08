/**
 * CLDR plural categories for the languages we ship.
 * Written out by hand because Hermes does not reliably provide Intl.PluralRules.
 *
 * Spanish, French and Portuguese also have a "many" category, but it only applies to exact
 * multiples of a million ("1 million de jours"). Nothing in the app counts that high, so those
 * languages use one/other and the lookup in translate.ts falls back to "other" for anything else.
 */

import type { LanguageCode } from './languages';

export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/** Forms each language must provide for a counted string; the parity test enforces it. */
export const PLURAL_CATEGORIES: Record<
  LanguageCode,
  readonly PluralCategory[]
> = {
  en: ['one', 'other'],
  hi: ['one', 'other'],
  mr: ['one', 'other'],
  es: ['one', 'other'],
  de: ['one', 'other'],
  fr: ['one', 'other'],
  'pt-BR': ['one', 'other'],
  id: ['other'],
  ru: ['one', 'few', 'many', 'other'],
  tr: ['one', 'other'],
  ja: ['other'],
};

export function pluralCategory(
  language: LanguageCode,
  count: number,
): PluralCategory {
  const n = Math.abs(count);
  switch (language) {
    case 'en':
    case 'de':
    case 'es':
    case 'tr':
    case 'mr':
      return n === 1 ? 'one' : 'other';
    case 'hi':
      return n === 0 || n === 1 ? 'one' : 'other';
    case 'fr':
    case 'pt-BR':
      return n < 2 ? 'one' : 'other';
    case 'ru': {
      if (!Number.isInteger(n)) return 'other';
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return 'one';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return 'few';
      }
      return 'many';
    }
    case 'id':
    case 'ja':
      return 'other';
  }
}
