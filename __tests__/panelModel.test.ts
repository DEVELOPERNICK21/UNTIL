import { buildPanelModel } from '../src/core/time/panelModel';
import {
  formatDayPassedLeftWithSeconds,
  formatLifePassedLeft,
  formatMonthPassedLeft,
  formatYearPassedLeft,
} from '../src/core/time/homeFormatters';
import { getLifeProgress } from '../src/core/time/life';

const NOW = new Date(2026, 2, 15, 8, 12, 4);

describe('buildPanelModel', () => {
  it('matches Home for a fixture profile and clock', () => {
    const model = buildPanelModel(
      { signedIn: true, birthDate: '1990-01-15', deathAge: 80 },
      NOW,
    );
    const life = getLifeProgress('1990-01-15', 80, NOW);

    expect(model.extraText).toBe('34%');
    expect(model.extraProgress).toBeCloseTo(model.day.progress, 10);
    expect(model.day).toEqual(formatDayPassedLeftWithSeconds(NOW));
    expect(model.month).toEqual(formatMonthPassedLeft(16, NOW));
    expect(model.year).toEqual(formatYearPassedLeft(291, NOW));
    expect(model.life).toEqual(
      formatLifePassedLeft(
        life.progress,
        Math.round(life.yearsRemaining * 365.25),
        80,
      ),
    );
  });

  it('dashes the extra and hides life when signed out', () => {
    const model = buildPanelModel(
      { signedIn: false, birthDate: null, deathAge: null },
      NOW,
    );
    expect(model.extraText).toBe('—');
    expect(model.extraProgress).toBeNull();
    expect(model.life).toBeNull();
    expect(model.day.passedStr).toBe('8h 12m 4s');
  });

  it('dashes the extra when signed in without a birth date', () => {
    const model = buildPanelModel(
      { signedIn: true, birthDate: null, deathAge: null },
      NOW,
    );
    expect(model.extraText).toBe('—');
    expect(model.extraProgress).toBeNull();
  });

  it('defaults death age to 80 like Home', () => {
    const withDefault = buildPanelModel(
      { signedIn: true, birthDate: '1990-01-15', deathAge: null },
      NOW,
    );
    const explicit = buildPanelModel(
      { signedIn: true, birthDate: '1990-01-15', deathAge: 80 },
      NOW,
    );
    expect(withDefault.life).toEqual(explicit.life);
  });
});
