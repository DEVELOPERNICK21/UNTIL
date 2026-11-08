import { MONETIZATION_TRIAL_DAYS } from '../src/config/monetization';
import {
  buildSubscriptionDisclosure,
  formatPaywallLossHeadline,
  formatPaywallLossPreviewFooter,
  formatPreviewActiveBody,
  formatPreviewEndingMessage,
  formatRenewalTerms,
  formatSubscribeCta,
  joinSentences,
  manageSubscriptionPath,
} from '../src/config/paywallCopy';
import { SUPPORTED_LANGUAGES } from '../src/shared/i18n/languages';
import { setLanguage } from '../src/shared/i18n/translate';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const inDays = (days: number) => Date.now() + (days - 0.5) * MS_PER_DAY;

afterEach(() => setLanguage('en'));

describe('subscription terms keep their legal substance in every language', () => {
  const intervals = ['week', 'month', 'year'] as const;

  describe.each(SUPPORTED_LANGUAGES.map(language => language.code))(
    '%s',
    code => {
      it.each(intervals)(
        'renewal terms for %s show the price twice, the 24-hour rule and where to cancel',
        interval => {
          setLanguage(code);
          const terms = formatRenewalTerms('PRICE', interval);
          expect(terms.split('PRICE')).toHaveLength(3);
          expect(terms).toContain('24');
          expect(terms).toContain(manageSubscriptionPath());
        },
      );

      it('shows the store price untouched in the disclosure', () => {
        setLanguage(code);
        const lines = buildSubscriptionDisclosure({
          yearlyPrice: 'Y-PRICE',
          monthlyPrice: 'M-PRICE',
          weeklyPrice: 'W-PRICE',
          lifetimePrice: 'L-PRICE',
          trialActive: true,
          trialEndsAtMs: inDays(3),
        });
        const text = lines.join('\n');
        for (const price of ['Y-PRICE', 'M-PRICE', 'W-PRICE', 'L-PRICE']) {
          expect(text).toContain(price);
        }
        expect(text).not.toMatch(/\{\{/);
      });

      it('says every renewal interval on the subscribe button', () => {
        setLanguage(code);
        const labels = intervals.map(interval => formatSubscribeCta(interval));
        expect(new Set(labels).size).toBe(3);
      });
    },
  );
});

describe('paywall text', () => {
  it('builds the English strings the app showed before', () => {
    expect(formatSubscribeCta('year')).toBe('Subscribe · renews yearly');
    expect(formatRenewalTerms('₹499', 'month')).toBe(
      '₹499 charged today, then ₹499 every month. Renews automatically until you cancel. Cancel anytime in Settings › Manage subscription, or your app store account, at least 24 hours before renewal.',
    );
    expect(formatPaywallLossHeadline(undefined)).toBe(
      'Your life is passing whether you watch it or not.',
    );
    expect(formatPaywallLossHeadline(0.42)).toBe(
      'You’ve lived 42% of your life, and it’s still rising off-screen.',
    );
  });

  it('counts the days left with the right plural form', () => {
    expect(formatPaywallLossPreviewFooter(inDays(1), true)).toBe(
      'Your preview ends in 1 day. After that, month & life lock.',
    );
    expect(formatPaywallLossPreviewFooter(inDays(3), true)).toBe(
      'Your preview ends in 3 days. After that, month & life lock.',
    );
    expect(formatPaywallLossPreviewFooter(inDays(3), false)).toBeNull();
    setLanguage('ru');
    expect(formatPaywallLossPreviewFooter(inDays(5), true)).toContain('5 дней');
    expect(formatPaywallLossPreviewFooter(inDays(2), true)).toContain('2 дня');
  });

  it('describes the preview end by day', () => {
    const last = MONETIZATION_TRIAL_DAYS;
    expect(formatPreviewEndingMessage(last, 'P')).toContain('ends today');
    expect(formatPreviewEndingMessage(last - 1, 'P')).toContain(
      'ends tomorrow',
    );
    expect(formatPreviewEndingMessage(last - 3, 'P')).toMatch(
      /^3 days left in your free app preview\./,
    );
    expect(formatPreviewEndingMessage(last - 3, 'P')).toContain('P/year');
  });

  it('writes the active-preview body as lead, rest and end date', () => {
    const body = formatPreviewActiveBody(inDays(3));
    expect(body).toMatch(/^Premium features unlocked for 3 days\. No payment/);
    expect(body).toMatch(/Preview ends .+\.$/);
  });

  it('joins sentences with a space, but not in Japanese', () => {
    expect(joinSentences('A.', 'B.')).toBe('A. B.');
    setLanguage('ja');
    expect(joinSentences('A。', 'B。')).toBe('A。B。');
  });
});
