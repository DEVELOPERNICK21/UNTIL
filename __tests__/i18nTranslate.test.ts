import {
  DEFAULT_LANGUAGE,
  isLanguagePreference,
  resolveLanguage,
} from '../src/shared/i18n/languages';
import { pluralCategory } from '../src/shared/i18n/plural';
import { resources } from '../src/shared/i18n/resources';
import {
  formatNumber,
  getLanguage,
  getLocaleTag,
  setLanguage,
  subscribeLanguage,
  t,
} from '../src/shared/i18n/translate';

afterEach(() => setLanguage('en'));

describe('resolveLanguage', () => {
  it('matches a supported language exactly or by its primary subtag', () => {
    expect(resolveLanguage(['hi'])).toBe('hi');
    expect(resolveLanguage(['hi-IN'])).toBe('hi');
    expect(resolveLanguage(['mr_IN'])).toBe('mr');
    expect(resolveLanguage(['de-AT'])).toBe('de');
    expect(resolveLanguage(['ES-mx'])).toBe('es');
  });

  it('maps any Portuguese region to pt-BR', () => {
    expect(resolveLanguage(['pt-BR'])).toBe('pt-BR');
    expect(resolveLanguage(['pt-PT'])).toBe('pt-BR');
    expect(resolveLanguage(['pt'])).toBe('pt-BR');
  });

  it('understands the legacy Android code for Indonesian', () => {
    expect(resolveLanguage(['in_ID'])).toBe('id');
  });

  it('takes the first supported language in the phone’s order', () => {
    expect(resolveLanguage(['zh-Hans-CN', 'fr-FR', 'en-US'])).toBe('fr');
  });

  it('falls back to English', () => {
    expect(resolveLanguage([])).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage([null, undefined, '', 'zh-CN', 'ar'])).toBe('en');
  });
});

describe('isLanguagePreference', () => {
  it('accepts system and shipped codes only', () => {
    expect(isLanguagePreference('system')).toBe(true);
    expect(isLanguagePreference('ja')).toBe(true);
    expect(isLanguagePreference('klingon')).toBe(false);
    expect(isLanguagePreference(undefined)).toBe(false);
  });
});

describe('pluralCategory', () => {
  it('follows CLDR for the languages we ship', () => {
    expect(pluralCategory('en', 1)).toBe('one');
    expect(pluralCategory('en', 0)).toBe('other');
    expect(pluralCategory('hi', 0)).toBe('one');
    expect(pluralCategory('fr', 1.5)).toBe('one');
    expect(pluralCategory('fr', 2)).toBe('other');
    expect(pluralCategory('ja', 1)).toBe('other');
    expect(pluralCategory('id', 1)).toBe('other');
  });

  it('gives Russian its four forms', () => {
    expect(pluralCategory('ru', 1)).toBe('one');
    expect(pluralCategory('ru', 21)).toBe('one');
    expect(pluralCategory('ru', 11)).toBe('many');
    expect(pluralCategory('ru', 2)).toBe('few');
    expect(pluralCategory('ru', 24)).toBe('few');
    expect(pluralCategory('ru', 12)).toBe('many');
    expect(pluralCategory('ru', 5)).toBe('many');
    expect(pluralCategory('ru', 100)).toBe('many');
    expect(pluralCategory('ru', 1.5)).toBe('other');
  });
});

describe('t', () => {
  it('starts in English', () => {
    expect(getLanguage()).toBe('en');
    expect(t('nav.settings')).toBe('Settings');
  });

  it('interpolates {{name}} placeholders', () => {
    expect(t('home.percentLeft', { percent: 42 })).toBe('42% left');
  });

  it('leaves an unknown placeholder visible rather than printing undefined', () => {
    expect(t('home.percentLeft', {})).toBe('{{percent}}% left');
  });

  it('picks the plural form from `count` and groups the number', () => {
    expect(t('common.days', { count: 1 })).toBe('1 day');
    expect(t('common.days', { count: 14220 })).toBe('14,220 days');
  });

  it('switches language and tells subscribers', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeLanguage(listener);
    setLanguage('de');
    expect(t('nav.settings')).toBe('Einstellungen');
    expect(listener).toHaveBeenCalledTimes(1);
    setLanguage('de');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setLanguage('fr');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('uses Russian plural forms', () => {
    setLanguage('ru');
    expect(t('common.days', { count: 1 })).toBe('1 день');
    expect(t('common.days', { count: 3 })).toBe('3 дня');
    expect(t('common.days', { count: 11 })).toBe('11 дней');
  });

  it('falls back to English for a key missing in the active language', () => {
    const saved = resources.fr['nav.badges'];
    delete resources.fr['nav.badges'];
    try {
      setLanguage('fr');
      expect(t('nav.badges')).toBe('Badges');
    } finally {
      resources.fr['nav.badges'] = saved;
    }
  });

  it('falls back to English plural forms when the language lacks the key', () => {
    const saved = resources.hi['common.days_other'];
    delete resources.hi['common.days_other'];
    delete resources.hi['common.days_one'];
    try {
      setLanguage('hi');
      expect(t('common.days', { count: 3 })).toBe('3 days');
    } finally {
      resources.hi['common.days_other'] = saved;
      resources.hi['common.days_one'] = saved;
    }
  });
});

describe('number formatting', () => {
  it('forces Latin digits so Marathi and Hindi numbers stay readable', () => {
    expect(getLocaleTag('mr')).toBe('mr-IN-u-nu-latn');
    expect(getLocaleTag('hi')).toBe('hi-IN-u-nu-latn');
    expect(getLocaleTag('pt-BR')).toBe('pt-BR-u-nu-latn');
    setLanguage('mr');
    expect(formatNumber(1234)).toMatch(/^1,?234$/);
  });
});
