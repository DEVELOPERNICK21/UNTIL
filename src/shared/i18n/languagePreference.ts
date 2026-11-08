/**
 * The only module that reads or writes STORAGE_KEYS.SETTINGS_LANGUAGE.
 * MMKV is synchronous, so the saved language is known before the first frame is drawn.
 */

import { getString, remove, setString } from '../persistence/mmkv';
import { STORAGE_KEYS } from '../persistence/schema';
import { isLanguagePreference, type LanguagePreference } from './languages';

export function readLanguagePreference(): LanguagePreference {
  try {
    const stored = getString(STORAGE_KEYS.SETTINGS_LANGUAGE);
    return isLanguagePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function writeLanguagePreference(preference: LanguagePreference): void {
  try {
    if (preference === 'system') {
      remove(STORAGE_KEYS.SETTINGS_LANGUAGE);
    } else {
      setString(STORAGE_KEYS.SETTINGS_LANGUAGE, preference);
    }
  } catch {
    // Not persisted; the choice still applies until the app closes.
  }
}
