import React from 'react';
import { Linking, Text as NativeText } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { LegalAgreementLine } from '../src/shared/ui/LegalAgreementLine';
import { AgeGateError } from '../src/features/account/domain/ageGateErrors';
import {
  friendlyGoogleSignInMessage,
  mapAppleAuthError,
  mapAuthError,
} from '../src/features/account/domain/authErrors';
import {
  deviceLimitBannerCopy,
  replaceDesktopBody,
} from '../src/features/account/domain/accountCopy';
import { MAX_ACTIVE_DEVICES } from '../src/features/account/domain/deviceLimit';
import { formatLastActive } from '../src/features/account/domain/deviceList';
import {
  parseLinkedText,
  stripLinkMarkers,
} from '../src/shared/i18n/linkedText';
import { setLanguage } from '../src/shared/i18n/translate';

jest.mock('../src/shared/ui/Text', () => {
  const { Text: Native } = require('react-native');
  return { Text: Native };
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 4, 12);

afterEach(() => setLanguage('en'));

describe('parseLinkedText', () => {
  it('reads several linked phrases in order', () => {
    expect(parseLinkedText('Agree to [Terms] and [Privacy].')).toEqual([
      { text: 'Agree to ', link: false },
      { text: 'Terms', link: true },
      { text: ' and ', link: false },
      { text: 'Privacy', link: true },
      { text: '.', link: false },
    ]);
  });

  it('strips markers for screen-reader labels', () => {
    expect(stripLinkMarkers('Have an account? [Sign in]')).toBe(
      'Have an account? Sign in',
    );
  });
});

describe('account copy follows the language', () => {
  it('maps Firebase error codes to messages in the active language', () => {
    expect(
      mapAuthError({ code: 'auth/wrong-password' }, 'fallback').message,
    ).toBe('Email or password is wrong.');
    setLanguage('fr');
    expect(
      mapAuthError({ code: 'auth/wrong-password' }, 'fallback').message,
    ).toBe('L’e-mail ou le mot de passe est incorrect.');
    expect(
      mapAppleAuthError({ code: 'auth/operation-not-allowed' }, 'x').message,
    ).toBe('La connexion avec Apple n’est pas encore configurée.');
  });

  it('keeps unknown errors as they are and uses the given fallback otherwise', () => {
    setLanguage('de');
    expect(mapAuthError(new Error('raw text'), 'fallback').message).toBe(
      'raw text',
    );
    expect(
      mapAuthError({}, 'Konto konnte nicht erstellt werden.').message,
    ).toBe('Konto konnte nicht erstellt werden.');
  });

  it('explains Google setup problems in the active language', () => {
    setLanguage('ja');
    expect(friendlyGoogleSignInMessage({ code: '7' })).toBe(
      'ネットワークエラーです。接続を確認して、もう一度お試しください。',
    );
    expect(friendlyGoogleSignInMessage({ code: 'SOMETHING_ELSE' })).toBeNull();
  });

  it('builds the age-gate message with the minimum age', () => {
    setLanguage('es');
    expect(new AgeGateError('confirmation_required').message).toBe(
      'Confirma que tienes 13 años o más para continuar.',
    );
  });

  it('puts the device cap and device names into sentences', () => {
    setLanguage('de');
    expect(deviceLimitBannerCopy()).toContain(`${MAX_ACTIVE_DEVICES} Geräten`);
    expect(replaceDesktopBody({ label: null, platform: 'macos' })).toBe(
      'UNTIL ist bereits auf Mac angemeldet. Wenn du dich hier anmeldest, wird es dort abgemeldet.',
    );
  });

  it('uses the right Russian plural for "days ago"', () => {
    setLanguage('ru');
    expect(formatLastActive(NOW - 3 * MS_PER_DAY, NOW)).toBe(
      'Было активно 3 дня назад',
    );
    expect(formatLastActive(NOW - 5 * MS_PER_DAY, NOW)).toBe(
      'Было активно 5 дней назад',
    );
  });
});

describe('LegalAgreementLine', () => {
  const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

  afterEach(() => {
    act(() => mounted.splice(0).forEach(tree => tree.unmount()));
  });

  it('links the terms and the privacy policy wherever the language puts them', () => {
    const openURL = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined as never);
    setLanguage('de');
    let tree!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      tree = ReactTestRenderer.create(
        <LegalAgreementLine
          termsUrl="https://t.test"
          privacyUrl="https://p.test"
        />,
      );
    });
    mounted.push(tree);

    const links = tree.root
      .findAllByType(NativeText)
      .filter(node => node.props.accessibilityRole === 'link');
    expect(links.map(node => node.props.children)).toEqual([
      'Nutzungsbedingungen',
      'Datenschutzerklärung',
    ]);

    links[0].props.onPress();
    links[1].props.onPress();
    expect(openURL).toHaveBeenNthCalledWith(1, 'https://t.test');
    expect(openURL).toHaveBeenNthCalledWith(2, 'https://p.test');
    openURL.mockRestore();
  });
});
