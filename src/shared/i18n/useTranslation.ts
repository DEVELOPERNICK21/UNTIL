import { useMemo, useSyncExternalStore } from 'react';
import {
  formatDate,
  formatNumber,
  getLanguage,
  subscribeLanguage,
  t,
} from './translate';

/**
 * Re-renders the component when the language changes. Call it in every component that shows
 * translated text, then use the returned `t`; plain `t` from './translate' is for non-React code.
 *
 * The returned functions get a new identity per language, so a `useMemo` / `useCallback` that
 * lists `t` (or `formatDate`) recomputes when the language changes.
 *
 * Import this file directly rather than the folder index: the index also loads storage.
 */
export function useTranslation() {
  const language = useSyncExternalStore(
    subscribeLanguage,
    getLanguage,
    getLanguage,
  );
  return useMemo(
    () => ({
      t: ((key, params) => t(key, params)) as typeof t,
      language,
      formatNumber: ((value, options) =>
        formatNumber(value, options)) as typeof formatNumber,
      formatDate: ((value, options) =>
        formatDate(value, options)) as typeof formatDate,
    }),
    [language],
  );
}
