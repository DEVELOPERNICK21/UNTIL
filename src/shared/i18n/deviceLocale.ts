/**
 * The phone's preferred languages, best first. React Native only; the pure core never imports it.
 */

import { I18nManager, Platform, Settings } from 'react-native';

export function getDeviceLanguageTags(): string[] {
  const tags: string[] = [];

  if (Platform.OS === 'ios') {
    try {
      // The user's ordered language list, or the per-app language chosen in iOS Settings.
      const appleLanguages: unknown = Settings.get('AppleLanguages');
      if (Array.isArray(appleLanguages)) {
        for (const tag of appleLanguages) {
          if (typeof tag === 'string') tags.push(tag);
        }
      }
    } catch {
      // Settings is unavailable in some test and desktop-like hosts.
    }
  }

  try {
    const identifier = I18nManager.getConstants().localeIdentifier;
    if (identifier) tags.push(identifier);
  } catch {
    // fall through to Intl
  }

  try {
    tags.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    // Intl missing: resolveLanguage falls back to English
  }

  return tags;
}
