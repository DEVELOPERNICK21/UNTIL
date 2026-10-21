import { wantsDailyCheckIns } from '../src/features/onboarding/domain/quizFunnel';

describe('wantsDailyCheckIns', () => {
  it('is true when they picked daily check-ins, alone or with widgets', () => {
    expect(wantsDailyCheckIns('checkins')).toBe(true);
    expect(wantsDailyCheckIns('both')).toBe(true);
  });

  it('is false for widgets only, not sure, or no answer', () => {
    expect(wantsDailyCheckIns('widgets')).toBe(false);
    expect(wantsDailyCheckIns('unsure')).toBe(false);
    expect(wantsDailyCheckIns(undefined)).toBe(false);
  });
});
