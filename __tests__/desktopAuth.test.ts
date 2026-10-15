import {
  appleStartUrl,
  googleAuthUrl,
  parseAppleDeepLink,
  parseLoopbackCallback,
} from '../desktop/src/auth/oauthUrls';
import {
  checkSetupForm,
  nextStepAfterSignIn,
} from '../desktop/src/auth/afterSignIn';

describe('googleAuthUrl', () => {
  it('asks for an OpenID code with PKCE on the loopback redirect', () => {
    const url = new URL(
      googleAuthUrl({
        clientId: 'cid.apps.googleusercontent.com',
        redirectUri: 'http://127.0.0.1:53111',
        codeChallenge: 'challenge',
        state: 'st',
      }),
    );
    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'cid.apps.googleusercontent.com',
      redirect_uri: 'http://127.0.0.1:53111',
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'st',
      prompt: 'select_account',
    });
  });
});

describe('parseLoopbackCallback', () => {
  it('returns the code when state matches', () => {
    expect(
      parseLoopbackCallback('http://127.0.0.1:5/?code=abc&state=st', 'st'),
    ).toEqual({ ok: true, code: 'abc' });
  });

  it('rejects a mismatched state', () => {
    expect(
      parseLoopbackCallback('http://127.0.0.1:5/?code=abc&state=other', 'st'),
    ).toEqual({ ok: false, reason: 'state_mismatch' });
  });

  it('treats a provider error as cancelled', () => {
    expect(
      parseLoopbackCallback(
        'http://127.0.0.1:5/?error=access_denied&state=st',
        'st',
      ),
    ).toEqual({ ok: false, reason: 'cancelled' });
  });
});

describe('Apple via the website', () => {
  it('sends only the hashed nonce to the page', () => {
    const url = new URL(
      appleStartUrl({
        pageUrl: 'https://example.com/desktop-sign-in.html',
        state: 'st',
        hashedNonce: 'hash',
      }),
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      provider: 'apple',
      state: 'st',
      nonce: 'hash',
    });
  });

  it('reads the id token from the deep link when state matches', () => {
    expect(
      parseAppleDeepLink('until-desktop://auth?state=st&id_token=tok', 'st'),
    ).toEqual({ ok: true, idToken: 'tok' });
  });

  it('rejects a deep link for another sign-in', () => {
    expect(
      parseAppleDeepLink('until-desktop://auth?state=x&id_token=tok', 'st'),
    ).toEqual({ ok: false, reason: 'state_mismatch' });
  });

  it('treats a deep link without a token as cancelled', () => {
    expect(
      parseAppleDeepLink('until-desktop://auth?state=st&error=user_cancelled', 'st'),
    ).toEqual({ ok: false, reason: 'cancelled' });
  });
});

describe('nextStepAfterSignIn', () => {
  const NOW = new Date(2026, 9, 15);

  it('asks for age confirmation and birth date when there is no profile', () => {
    expect(nextStepAfterSignIn(null, NOW)).toEqual({
      kind: 'setup',
      askBirthDate: true,
      askAgeConfirmation: true,
    });
  });

  it('asks only for the 13+ confirmation when the birth date is known', () => {
    expect(
      nextStepAfterSignIn(
        { birthDate: '1990-01-01', deathAge: 80, minimumAgeConfirmed: false },
        NOW,
      ),
    ).toEqual({ kind: 'setup', askBirthDate: false, askAgeConfirmation: true });
  });

  it('asks for a birth date once when it is missing', () => {
    expect(
      nextStepAfterSignIn(
        { birthDate: null, deathAge: null, minimumAgeConfirmed: true },
        NOW,
      ),
    ).toEqual({ kind: 'setup', askBirthDate: true, askAgeConfirmation: false });
  });

  it('is ready when the profile is confirmed and has a birth date', () => {
    expect(
      nextStepAfterSignIn(
        { birthDate: '1990-01-01', deathAge: 80, minimumAgeConfirmed: true },
        NOW,
      ),
    ).toEqual({ kind: 'ready' });
  });

  it('blocks an under-13 birth date', () => {
    expect(
      nextStepAfterSignIn(
        { birthDate: '2020-01-01', deathAge: 80, minimumAgeConfirmed: true },
        NOW,
      ),
    ).toEqual({ kind: 'under_minimum_age' });
  });
});

describe('checkSetupForm', () => {
  const NOW = new Date(2026, 9, 15);

  it('needs a birth date when asked for one', () => {
    expect(
      checkSetupForm({ askBirthDate: true, birthDate: '', confirmed: true }, NOW),
    ).toBe('birth_date_required');
  });

  it('needs the 13+ box ticked', () => {
    expect(
      checkSetupForm(
        { askBirthDate: true, birthDate: '1990-01-01', confirmed: false },
        NOW,
      ),
    ).toBe('confirmation_required');
  });

  it('blocks an under-13 birth date even when ticked', () => {
    expect(
      checkSetupForm(
        { askBirthDate: true, birthDate: '2020-01-01', confirmed: true },
        NOW,
      ),
    ).toBe('under_minimum_age');
  });

  it('allows a valid form', () => {
    expect(
      checkSetupForm(
        { askBirthDate: true, birthDate: '1990-01-01', confirmed: true },
        NOW,
      ),
    ).toBe('allowed');
  });
});
