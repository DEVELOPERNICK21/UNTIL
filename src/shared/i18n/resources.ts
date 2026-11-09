/**
 * Every locale file, merged into one flat key → message map per language.
 * English is the source: its keys define `TranslationKey`, and the parity test
 * (__tests__/i18nLocales.test.ts) keeps every other language in step with it.
 *
 * To add a language: add it to SUPPORTED_LANGUAGES and PLURAL_CATEGORIES, create
 * locales/<code>/<namespace>.json and locales/<code>/index.ts, and register it below.
 * To add a namespace: create its JSON for every language and list it in each language's index.ts.
 */

import type { LanguageCode } from './languages';

import en from './locales/en';
import hi from './locales/hi';
import mr from './locales/mr';
import es from './locales/es';
import de from './locales/de';
import fr from './locales/fr';
import ptBR from './locales/pt-BR';
import id from './locales/id';
import ru from './locales/ru';
import tr from './locales/tr';
import ja from './locales/ja';

type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
type BaseKey<K extends string> = K extends `${infer Base}_${PluralSuffix}`
  ? Base
  : K;

/** Every key the app can ask for; plural forms (`x_one`, `x_other`) collapse to `x`. */
export type TranslationKey = BaseKey<keyof typeof en & string>;

type Messages = Record<string, string>;

export const resources: Record<LanguageCode, Messages> = {
  en: en,
  hi: hi,
  mr: mr,
  es: es,
  de: de,
  fr: fr,
  'pt-BR': ptBR,
  id: id,
  ru: ru,
  tr: tr,
  ja: ja,
};
