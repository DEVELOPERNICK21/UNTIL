/**
 * What the paywall tells the person when a purchase fails, and what it reports.
 * Every failure is logged. Only a real one is reported as an error. "Already owned" offers a restore.
 */

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { usePurchaseFailureAlert } from '../src/features/premium/hooks/usePurchaseFailureAlert';
import type { PurchaseFailure } from '../src/features/premium/hooks/usePurchaseFailureAlert';

const mockLogFailed = jest.fn();
jest.mock('../src/features/premium/services/paywallTelemetry', () => ({
  logPurchaseFailed: (...a: unknown[]) => mockLogFailed(...a),
}));

const mockRecordCrash = jest.fn();
jest.mock('../src/shared/analytics/analytics', () => ({
  recordCrashError: (...a: unknown[]) => mockRecordCrash(...a),
  logAnalyticsEvent: jest.fn(),
}));

// Echo the key so each alert can be told apart without loading the language files.
jest.mock('../src/shared/i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const restore = jest.fn();
let report: (failure: PurchaseFailure) => void = () => {};

function Probe() {
  const restoreRef = React.useRef<(() => void) | null>(restore);
  report = usePurchaseFailureAlert('premium_screen', restoreRef);
  return null;
}

const base = { planId: 'yearly_subscription', priceDisplay: '$14.99' };

describe('usePurchaseFailureAlert', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(async () => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockLogFailed.mockClear();
    mockRecordCrash.mockClear();
    restore.mockClear();
    await act(async () => {
      ReactTestRenderer.create(<Probe />);
    });
  });

  afterEach(() => alertSpy.mockRestore());

  it('offers a restore when the product is already owned, and does not report an error', () => {
    report({ ...base, code: 'PRODUCT_ALREADY_PURCHASED', message: 'owned' });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, body, buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('premium.alert.alreadyOwnedTitle');
    expect(body).toBe('premium.alert.alreadyOwnedBody');
    expect(buttons.map((b: { text: string }) => b.text)).toEqual([
      'common.cancel',
      'premium.alert.restoreAction',
    ]);
    expect(mockRecordCrash).not.toHaveBeenCalled();

    buttons[1].onPress();
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it('says a pending payment is pending, not failed', () => {
    report({ ...base, code: 'PAYMENT_PENDING', message: 'pending' });
    expect(alertSpy).toHaveBeenCalledWith(
      'premium.alert.pendingTitle',
      'premium.alert.pendingBody',
    );
    expect(mockRecordCrash).not.toHaveBeenCalled();
  });

  it('asks to check the connection when offline', () => {
    report({ ...base, code: '35', message: 'offline' });
    expect(alertSpy).toHaveBeenCalledWith(
      'premium.alert.offlineTitle',
      'premium.alert.offlineBody',
    );
    expect(mockRecordCrash).not.toHaveBeenCalled();
  });

  it('keeps the generic alert and reports a real failure with its stack', () => {
    const error = new Error('billing unavailable');
    report({ ...base, code: 'STORE_PROBLEM', message: 'billing unavailable', error });

    expect(alertSpy).toHaveBeenCalledWith('premium.alert.purchaseFailed', 'billing unavailable');
    expect(mockRecordCrash).toHaveBeenCalledWith(error, 'PremiumPaywallBody.requestPurchase');
  });

  it('falls back to the translated generic text when a real failure has no message', () => {
    report({ ...base, code: 'unknown' });
    expect(alertSpy).toHaveBeenCalledWith(
      'premium.alert.purchaseFailed',
      'premium.alert.genericError',
    );
    expect(mockRecordCrash).toHaveBeenCalledTimes(1);
  });

  it('logs every failure with the same fields, whatever the kind', () => {
    report({ ...base, code: 'PAYMENT_PENDING', message: 'pending' });
    report({ ...base, code: 'STORE_PROBLEM', message: 'boom' });

    expect(mockLogFailed).toHaveBeenCalledTimes(2);
    expect(mockLogFailed).toHaveBeenNthCalledWith(1, {
      planId: 'yearly_subscription',
      source: 'premium_screen',
      priceDisplay: '$14.99',
      code: 'PAYMENT_PENDING',
      message: 'pending',
    });
    expect(mockLogFailed).toHaveBeenNthCalledWith(2, {
      planId: 'yearly_subscription',
      source: 'premium_screen',
      priceDisplay: '$14.99',
      code: 'STORE_PROBLEM',
      message: 'boom',
    });
  });

  it('does not throw when Restore is tapped before the paywall has set its handler', async () => {
    let reportWithoutHandler: (failure: PurchaseFailure) => void = () => {};
    function EmptyRefProbe() {
      const emptyRef = React.useRef<(() => void) | null>(null);
      reportWithoutHandler = usePurchaseFailureAlert('premium_screen', emptyRef);
      return null;
    }
    await act(async () => {
      ReactTestRenderer.create(<EmptyRefProbe />);
    });

    reportWithoutHandler({ ...base, code: 'PRODUCT_ALREADY_PURCHASED' });
    const buttons = alertSpy.mock.calls[0][2];
    expect(() => buttons[1].onPress()).not.toThrow();
    expect(restore).not.toHaveBeenCalled();
  });
});
