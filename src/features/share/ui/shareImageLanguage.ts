import type { LanguageCode } from '../../../shared/i18n/languages';

/**
 * Languages whose share-image text the bundled Inter font can draw (it covers Latin and Cyrillic).
 * Hindi, Marathi and Japanese are not in the font, so their image is drawn in English until a font
 * with those scripts is bundled. The preview card follows the same rule so it matches what is shared.
 * __tests__/i18nShareUpdateCopy.test.tsx checks every string below against the font file.
 */
const IMAGE_LANGUAGES: readonly LanguageCode[] = [
  'en',
  'es',
  'de',
  'fr',
  'pt-BR',
  'id',
  'ru',
  'tr',
];

export function shareImageLanguage(language: LanguageCode): LanguageCode {
  return IMAGE_LANGUAGES.includes(language) ? language : 'en';
}
