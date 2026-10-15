/**
 * Desktop panel + extra numbers, built from the same pieces phone Home uses
 * (getXProgress for remaining days, homeFormatters for strings and percents).
 */

import { getLifeProgress } from './life';
import { getMonthProgress } from './month';
import { getYearProgress } from './year';
import {
  extraDayPercentText,
  formatDayPassedLeftWithSeconds,
  formatLifePassedLeft,
  formatMonthPassedLeft,
  formatYearPassedLeft,
} from './homeFormatters';

const DEFAULT_DEATH_AGE = 80;

export interface PanelProfile {
  signedIn: boolean;
  birthDate: string | null;
  deathAge: number | null;
}

export function buildPanelModel(profile: PanelProfile, now: Date) {
  const hasBirthDate = Boolean(profile.birthDate);
  const day = formatDayPassedLeftWithSeconds(now);
  const deathAge = profile.deathAge ?? DEFAULT_DEATH_AGE;
  const lifeProgress = profile.birthDate
    ? getLifeProgress(profile.birthDate, deathAge, now)
    : null;

  return {
    extraText: extraDayPercentText({
      signedIn: profile.signedIn,
      hasBirthDate,
      now,
    }),
    extraProgress: profile.signedIn && hasBirthDate ? day.progress : null,
    day,
    month: formatMonthPassedLeft(getMonthProgress(now).remainingDays, now),
    year: formatYearPassedLeft(getYearProgress(now).remainingDays, now),
    life: lifeProgress
      ? formatLifePassedLeft(
          lifeProgress.progress,
          Math.round(lifeProgress.yearsRemaining * 365.25),
          deathAge,
        )
      : null,
  };
}

export type PanelModel = ReturnType<typeof buildPanelModel>;
