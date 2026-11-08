/**
 * Public API of the i18n kernel, for the app shell and the language picker.
 * Components import './useTranslation' directly, and domain, services and desktop code import
 * './translate' (and './languages'), so only the app shell loads React Native and MMKV.
 */

export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  resolveLanguage,
  isLanguageCode,
  isLanguagePreference,
} from './languages';
export type { LanguageCode, LanguagePreference } from './languages';
export {
  t,
  getLanguage,
  setLanguage,
  subscribeLanguage,
  getLocaleTag,
  formatNumber,
  formatDate,
} from './translate';
export type { TranslationKey, TranslateParams } from './translate';
export {
  initI18n,
  getDeviceLanguage,
  getLanguagePreference,
  setLanguagePreference,
} from './i18nService';
export { useTranslation } from './useTranslation';
export { useLanguage } from './useLanguage';
