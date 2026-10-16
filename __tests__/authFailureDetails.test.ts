import {
  describeAuthFailure,
  friendlyGoogleSignInMessage,
} from '../src/features/account/domain/authErrors';
import {
  purchaseErrorCode,
  purchaseErrorDetail,
} from '../src/features/premium/domain/purchasesErrors';

describe('describeAuthFailure', () => {
  it('reports the native code and a short message', () => {
    const error = Object.assign(new Error('DEVELOPER_ERROR'), { code: '10' });
    expect(describeAuthFailure(error)).toEqual({
      error_code: '10',
      error_message: 'DEVELOPER_ERROR',
    });
  });

  it('keeps email addresses out of analytics', () => {
    const error = new Error('The email nick@example.com is already in use');
    expect(describeAuthFailure(error).error_message).toBe('The email [email] is already in use');
  });

  it('copes with things that are not errors', () => {
    expect(describeAuthFailure(undefined)).toEqual({ error_code: 'unknown', error_message: '' });
    expect(describeAuthFailure('boom').error_message).toBe('boom');
  });

  it('cuts long messages', () => {
    expect(describeAuthFailure(new Error('x'.repeat(500))).error_message).toHaveLength(100);
  });
});

describe('friendlyGoogleSignInMessage', () => {
  it('explains a developer error as "use email for now"', () => {
    expect(friendlyGoogleSignInMessage(Object.assign(new Error('x'), { code: '10' }))).toMatch(/email/);
    expect(friendlyGoogleSignInMessage(new Error('DEVELOPER_ERROR: bad config'))).toMatch(/email/);
  });

  it('explains network and Play services problems', () => {
    expect(friendlyGoogleSignInMessage(Object.assign(new Error('x'), { code: '7' }))).toMatch(/Network/);
    expect(friendlyGoogleSignInMessage(new Error('PLAY_SERVICES_NOT_AVAILABLE'))).toMatch(/Play services/);
  });

  it('leaves other errors to the caller', () => {
    expect(friendlyGoogleSignInMessage(new Error('Something else'))).toBeNull();
  });
});

describe('purchaseErrorCode', () => {
  it('prefers the readable RevenueCat code', () => {
    const error = { code: '5', userInfo: { readableErrorCode: 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE' } };
    expect(purchaseErrorCode(error)).toBe('PRODUCT_NOT_AVAILABLE_FOR_PURCHASE');
  });

  it('falls back to the numeric code, then to unknown', () => {
    expect(purchaseErrorCode({ code: 3 })).toBe('3');
    expect(purchaseErrorCode(new Error('x'))).toBe('unknown');
    expect(purchaseErrorCode(null)).toBe('unknown');
  });

  it('passes on the store message, trimmed', () => {
    expect(purchaseErrorDetail({ underlyingErrorMessage: 'a'.repeat(300) })).toHaveLength(100);
    expect(purchaseErrorDetail('nope')).toBe('');
  });
});
