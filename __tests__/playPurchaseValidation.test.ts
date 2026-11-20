import {
  buildPurchaseLookupUrl,
  isSubscriptionProduct,
  isValidPackageName,
  isValidProductId,
  isValidPurchaseToken,
} from '../website/src/lib/playPurchase';

const GOOD = {
  packageName: 'app.until.time',
  productId: 'premium_yearly_subscription',
  purchaseToken: 'abcDEF123-_.~xyz',
};

describe('Play purchase lookup: inputs', () => {
  it('accepts a normal product id, package name and token', () => {
    expect(isValidProductId('premium_lifetime')).toBe(true);
    expect(isValidProductId('premium_yearly_subscription')).toBe(true);
    expect(isValidProductId('plan-monthly.v2')).toBe(true);
    expect(isValidPackageName('app.until.time')).toBe(true);
    expect(isValidPurchaseToken('abcDEF123-_.~xyz')).toBe(true);
  });

  it.each([
    'x/../../reviews',
    '../../edits',
    'a/b',
    'a?b=1',
    'a#b',
    'a b',
    'a%2f..%2f',
    'a\\b',
    '',
    'é',
    'x'.repeat(101),
  ])('rejects the product id %j', value => {
    expect(isValidProductId(value)).toBe(false);
  });

  it.each(['a/b', 'a?x=1', 'a b', '', '../x', 'a#b', 'x'.repeat(2049)])(
    'rejects the purchase token %j',
    value => {
      expect(isValidPurchaseToken(value)).toBe(false);
    },
  );

  it.each(['app', 'app/until', 'app.until.time/../x', '1app.until', 'app..time', 'app.until.', ''])(
    'rejects the package name %j',
    value => {
      expect(isValidPackageName(value)).toBe(false);
    },
  );

  it('rejects values that are not strings', () => {
    expect(isValidProductId(undefined)).toBe(false);
    expect(isValidProductId(42)).toBe(false);
    expect(isValidProductId({ toString: () => 'ok' })).toBe(false);
    expect(isValidPurchaseToken(null)).toBe(false);
    expect(isValidPackageName(['app.until.time'])).toBe(false);
  });

  it('tells subscriptions from one-time products', () => {
    expect(isSubscriptionProduct('premium_yearly_subscription')).toBe(true);
    expect(isSubscriptionProduct('premium_lifetime')).toBe(false);
  });
});

describe('Play purchase lookup: URL', () => {
  it('always targets the Google Play Developer API host', () => {
    const url = new URL(buildPurchaseLookupUrl(GOOD));
    expect(url.protocol).toBe('https:');
    expect(url.host).toBe('androidpublisher.googleapis.com');
    expect(url.pathname).toBe(
      '/androidpublisher/v3/applications/app.until.time/purchases/subscriptions/' +
        'premium_yearly_subscription/tokens/abcDEF123-_.~xyz',
    );
    expect(url.search).toBe('');
  });

  it('uses the products endpoint for a one-time purchase', () => {
    const url = new URL(buildPurchaseLookupUrl({ ...GOOD, productId: 'premium_lifetime' }));
    expect(url.pathname).toContain('/purchases/products/premium_lifetime/tokens/');
  });

  it.each([
    { productId: 'x/../../reviews' },
    { productId: '../..' },
    { purchaseToken: '../../x' },
    { purchaseToken: 'a?b=c' },
    { packageName: 'evil.host/../x' },
    { packageName: 'app.until.time/../../other' },
  ])('refuses to build a URL from %j', override => {
    expect(() => buildPurchaseLookupUrl({ ...GOOD, ...override })).toThrow();
  });
});
