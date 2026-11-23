/**
 * A failed purchase is sorted into "already owned", "pending", "offline" or a real failure.
 * The first three get their own message and no crash report; the rest keep the generic alert.
 */

import { classifyPurchaseFailure } from '../src/features/premium/domain/purchaseFailure';

describe('classifyPurchaseFailure', () => {
  it.each(['PRODUCT_ALREADY_PURCHASED', 'PRODUCT_ALREADY_PURCHASED_ERROR', '6', 6])(
    'treats %p as already owned',
    code => {
      expect(classifyPurchaseFailure(code)).toBe('alreadyOwned');
    },
  );

  it.each(['PAYMENT_PENDING', 'PAYMENT_PENDING_ERROR', '20', 20])(
    'treats %p as pending',
    code => {
      expect(classifyPurchaseFailure(code)).toBe('pending');
    },
  );

  it.each(['NETWORK', 'NETWORK_ERROR', 'OFFLINE_CONNECTION', 'OFFLINE_CONNECTION_ERROR', '10', '35'])(
    'treats %p as offline',
    code => {
      expect(classifyPurchaseFailure(code)).toBe('offline');
    },
  );

  it('ignores case and surrounding spaces', () => {
    expect(classifyPurchaseFailure(' payment_pending ')).toBe('pending');
    expect(classifyPurchaseFailure('Network_Error')).toBe('offline');
  });

  it.each([
    'STORE_PROBLEM',
    'PURCHASE_NOT_ALLOWED',
    'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE',
    'CONFIGURATION_ERROR',
    'RECEIPT_ALREADY_IN_USE',
    'INVALID_CREDENTIALS',
    'unknown',
    '0',
    '',
  ])('keeps %p as a real failure', code => {
    expect(classifyPurchaseFailure(code)).toBe('other');
  });

  it('keeps a missing code as a real failure', () => {
    expect(classifyPurchaseFailure(undefined)).toBe('other');
    expect(classifyPurchaseFailure(null)).toBe('other');
  });

  it('does not match a code that only contains a known one', () => {
    expect(classifyPurchaseFailure('NOT_PAYMENT_PENDING_AT_ALL')).toBe('other');
    expect(classifyPurchaseFailure('16')).toBe('other');
    expect(classifyPurchaseFailure('60')).toBe('other');
  });
});
