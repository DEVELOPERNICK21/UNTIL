import {
  buildResultCards,
  getFunnelEncouragement,
} from '../src/features/onboarding/domain/quizFunnel';
import { getGoalOptions } from '../src/features/onboarding/ui/quizContent';
import { feelForPeriod, timeOfDayLabel } from '../src/shared/theme/emotionalCopy';
import { setLanguage } from '../src/shared/i18n/translate';

afterEach(() => setLanguage('en'));

describe('translated copy outside React', () => {
  it('translates funnel copy built in the domain layer', () => {
    setLanguage('ru');
    expect(getFunnelEncouragement('day_demo')).toBe('Вы уже в пути');
    const cards = buildResultCards({ timeDrain: 'social', cadence: 'both' });
    expect(cards[0]?.text).toContain('21');
    expect(cards[2]?.text).toBe('Ежедневные отметки осознанности включены');
  });

  it('translates quiz options and keeps their values', () => {
    setLanguage('de');
    const options = getGoalOptions();
    expect(options.map(option => option.value)).toEqual([
      'people',
      'focus',
      'health',
      'calm',
      'other',
    ]);
    expect(options[0]?.label).toBe('Zeit mit Menschen');
  });

  it('translates the greeting and the period feel lines', () => {
    setLanguage('es');
    expect(timeOfDayLabel(new Date(2026, 0, 1, 8))).toBe('Buenos días');
    expect(feelForPeriod('month', 0.5)).toBe(
      'Mitad del mes. Un pequeño punto de control.',
    );
  });
});
