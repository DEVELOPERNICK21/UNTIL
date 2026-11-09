import { useSyncExternalStore } from 'react';
import {
  getLanguagePreference,
  setLanguagePreference,
  subscribeLanguagePreference,
} from './i18nService';
import { useTranslation } from './useTranslation';

/** For the language picker: what the user chose and what that resolved to. */
export function useLanguage() {
  const { language } = useTranslation();
  const preference = useSyncExternalStore(
    subscribeLanguagePreference,
    getLanguagePreference,
    getLanguagePreference,
  );
  return { language, preference, setPreference: setLanguagePreference };
}
