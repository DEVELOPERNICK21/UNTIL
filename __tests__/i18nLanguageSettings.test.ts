/**
 * Startup language choice: a saved pick wins, otherwise the phone's language, otherwise English.
 */
const mockStore = new Map<string, string>();
let mockDeviceTags: string[] = [];

jest.mock('../src/shared/persistence/mmkv', () => ({
  getString: (key: string) => mockStore.get(key),
  setString: (key: string, value: string) => void mockStore.set(key, value),
  remove: (key: string) => void mockStore.delete(key),
}));
jest.mock('../src/shared/i18n/deviceLocale', () => ({
  getDeviceLanguageTags: () => mockDeviceTags,
}));

import { STORAGE_KEYS } from '../src/shared/persistence/schema';
import {
  getLanguagePreference,
  initI18n,
  setLanguagePreference,
  subscribeLanguagePreference,
} from '../src/shared/i18n/i18nService';
import { getLanguage, setLanguage, t } from '../src/shared/i18n/translate';

beforeEach(() => {
  mockStore.clear();
  mockDeviceTags = [];
});
afterEach(() => setLanguage('en'));

describe('initI18n', () => {
  it('follows the phone when nothing is saved', () => {
    mockDeviceTags = ['hi-IN', 'en-IN'];
    initI18n();
    expect(getLanguagePreference()).toBe('system');
    expect(getLanguage()).toBe('hi');
  });

  it('uses English when the phone speaks something we do not ship', () => {
    mockDeviceTags = ['sv-SE'];
    initI18n();
    expect(getLanguage()).toBe('en');
  });

  it('prefers the saved language over the phone’s', () => {
    mockDeviceTags = ['hi-IN'];
    mockStore.set(STORAGE_KEYS.SETTINGS_LANGUAGE, 'ja');
    initI18n();
    expect(getLanguagePreference()).toBe('ja');
    expect(getLanguage()).toBe('ja');
  });

  it('ignores a saved value it does not recognise', () => {
    mockDeviceTags = ['fr-FR'];
    mockStore.set(STORAGE_KEYS.SETTINGS_LANGUAGE, 'tlh');
    initI18n();
    expect(getLanguagePreference()).toBe('system');
    expect(getLanguage()).toBe('fr');
  });
});

describe('setLanguagePreference', () => {
  it('applies and saves a fixed language, and tells subscribers', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeLanguagePreference(listener);
    setLanguagePreference('es');
    expect(getLanguage()).toBe('es');
    expect(t('nav.settings')).toBe('Ajustes');
    expect(mockStore.get(STORAGE_KEYS.SETTINGS_LANGUAGE)).toBe('es');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('returns to the phone language and forgets the saved pick', () => {
    mockDeviceTags = ['de-DE'];
    setLanguagePreference('ja');
    setLanguagePreference('system');
    expect(getLanguage()).toBe('de');
    expect(mockStore.has(STORAGE_KEYS.SETTINGS_LANGUAGE)).toBe(false);
  });
});
