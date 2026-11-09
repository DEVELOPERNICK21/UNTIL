import {
  monthlyTimesTwelve,
  toMoney,
  yearlyPerDay,
  yearlySavingPercent,
} from '../src/features/premium/domain/paywallMoney';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const inr = (amount: number) => ({ amount, currency: 'INR' });
const jpy = (amount: number) => ({ amount, currency: 'JPY' });

describe('toMoney', () => {
  it('needs a positive finite amount and a currency', () => {
    expect(toMoney({ amount: 4.99, currency: 'USD' })).toEqual(usd(4.99));
    expect(toMoney(undefined)).toBeNull();
    expect(toMoney({ amount: 4.99 })).toBeNull();
    expect(toMoney({ currency: 'USD' })).toBeNull();
    expect(toMoney({ amount: 0, currency: 'USD' })).toBeNull();
    expect(toMoney({ amount: NaN, currency: 'USD' })).toBeNull();
  });
});

describe('yearlyPerDay', () => {
  it('rounds up so "less than X a day" stays true', () => {
    // 499 / 365 = 1.3671 → 1.37 (the figure the paywall used to hard-code for rupees)
    expect(yearlyPerDay(inr(499))).toEqual(inr(1.37));
    // 14.99 / 365 = 0.04107 → 0.05
    expect(yearlyPerDay(usd(14.99))).toEqual(usd(0.05));
  });

  it('goes one unit above an exact figure', () => {
    // 365 / 365 = 1.00 exactly: "less than 1.00" would be false, so 1.01
    expect(yearlyPerDay(usd(365))).toEqual(usd(1.01));
  });

  it('uses the currency\'s own smallest unit', () => {
    // 1,200 yen / 365 = 3.29 → 4 (yen has no minor unit)
    expect(yearlyPerDay(jpy(1200))).toEqual(jpy(4));
  });

  it('is null without a price', () => {
    expect(yearlyPerDay(null)).toBeNull();
  });
});

describe('monthlyTimesTwelve', () => {
  it('is twelve payments when that is more than the yearly price', () => {
    expect(monthlyTimesTwelve(usd(2.99), usd(14.99))).toEqual(usd(35.88));
    expect(monthlyTimesTwelve(inr(149), inr(499))).toEqual(inr(1788));
  });

  it('is null when it would not be a real anchor', () => {
    expect(monthlyTimesTwelve(usd(1), usd(14.99))).toBeNull(); // 12 < yearly
    expect(monthlyTimesTwelve(usd(2.99), inr(499))).toBeNull(); // currencies differ
    expect(monthlyTimesTwelve(null, usd(14.99))).toBeNull();
    expect(monthlyTimesTwelve(usd(2.99), null)).toBeNull();
  });
});

describe('yearlySavingPercent', () => {
  it('is the whole-percent saving against twelve monthly payments, rounded down', () => {
    // 1 - 499 / 1788 = 72.09%
    expect(yearlySavingPercent(inr(149), inr(499))).toBe(72);
    // 1 - 14.99 / 35.88 = 58.22%
    expect(yearlySavingPercent(usd(2.99), usd(14.99))).toBe(58);
  });

  it('is null when there is no saving or the figures cannot be compared', () => {
    expect(yearlySavingPercent(usd(1), usd(14.99))).toBeNull();
    expect(yearlySavingPercent(usd(2.99), inr(499))).toBeNull();
    expect(yearlySavingPercent(null, usd(14.99))).toBeNull();
  });
});
