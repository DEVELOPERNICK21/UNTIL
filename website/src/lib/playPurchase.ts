/**
 * Input checks and URL building for the Google Play purchase lookup behind /api/verify-purchase.
 *
 * The route calls Google with the server's own service-account token, so nothing from the request may
 * reach the URL unchecked: a `productId` like `x/../../reviews` would otherwise let any caller aim that
 * token at other Play Developer API endpoints. Every value is checked against a strict pattern and then
 * percent-encoded, and the host is fixed. Pure functions, so they are covered by `__tests__`.
 */

export const DEFAULT_PACKAGE_NAME = 'app.until.time';

const GOOGLE_PLAY_API =
  'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

// Reverse-DNS package name: at least two dot-separated parts, each starting with a letter.
const PACKAGE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/;
// Play product and subscription ids: letters, digits, `.`, `_` and `-` (base plans use a hyphen).
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;
// Purchase tokens are opaque URL-safe strings, a few hundred characters long.
const PURCHASE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,2048}$/;

export function isValidPackageName(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 150 && PACKAGE_NAME_PATTERN.test(value);
}

export function isValidProductId(value: unknown): value is string {
  return typeof value === 'string' && PRODUCT_ID_PATTERN.test(value);
}

export function isValidPurchaseToken(value: unknown): value is string {
  return typeof value === 'string' && PURCHASE_TOKEN_PATTERN.test(value);
}

/** A product id that names a subscription (the Play API has separate endpoints for the two kinds). */
export function isSubscriptionProduct(productId: string): boolean {
  return productId.includes('subscription');
}

/**
 * The Google Play Developer API URL for one purchase. Throws if any part fails its check, so a caller
 * that forgot to validate still cannot build a URL with a path or host of its choosing.
 */
export function buildPurchaseLookupUrl(args: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): string {
  const { packageName, productId, purchaseToken } = args;
  if (!isValidPackageName(packageName)) throw new Error('Invalid package name');
  if (!isValidProductId(productId)) throw new Error('Invalid product id');
  if (!isValidPurchaseToken(purchaseToken)) throw new Error('Invalid purchase token');

  const kind = isSubscriptionProduct(productId) ? 'subscriptions' : 'products';
  return (
    `${GOOGLE_PLAY_API}/${encodeURIComponent(packageName)}/purchases/${kind}/` +
    `${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`
  );
}
