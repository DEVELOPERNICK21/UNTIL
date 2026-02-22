/**
 * MmkvTimeRepository - MMKV-backed implementation of ITimeRepository
 * Single Source of Truth for time and user profile data.
 * Widgets read from the same MMKV that this uses.
 */

import type { ITimeRepository } from '../../domain/repository/ITimeRepository';
import type { TimeProgress, WidgetCache } from '../../types';
import { getDayProgress } from '../../core/time/day';
import { getMonthProgress } from '../../core/time/month';
import { getYearProgress } from '../../core/time/year';
import { getLifeProgress } from '../../core/time/life';
import { now } from '../../core/time/clock';
import { STORAGE_KEYS } from '../../persistence/schema';
import {
  getString,
  getNumber,
  setString,
  setNumber,
} from '../../persistence/mmkv';
import { DEFAULTS } from '../../persistence/schema';

type Subscriber = () => void;

function computeTimeState(birthDate: string | null, deathAge: number): TimeProgress {
  const date = now();
  const dayProgress = getDayProgress(date);
  const monthProgress = getMonthProgress(date);
  const yearProgress = getYearProgress(date);
  const lifeProgress = birthDate
    ? getLifeProgress(birthDate, deathAge, date)
    : { progress: 0, yearsRemaining: 0 };

  const remainingHours = Math.floor(dayProgress.remainingMs / (1000 * 60 * 60));
  const remainingDaysLife = birthDate
    ? Math.round(lifeProgress.yearsRemaining * 365.25)
    : undefined;

  return {
    day: dayProgress.progress,
    week: dayProgress.progress,
    month: monthProgress.progress,
    year: yearProgress.progress,
    life: lifeProgress.progress,
    remainingHours,
    remainingDaysMonth: monthProgress.remainingDays,
    remainingDaysYear: yearProgress.remainingDays,
    remainingDaysLife,
  };
}

function computeWidgetCache(): WidgetCache {
  const date = now();
  const day = getDayProgress(date);
  const month = getMonthProgress(date);
  const year = getYearProgress(date);
  const totalMinutesInDay = 24 * 60;
  const passedMinutes = Math.floor(day.progress * totalMinutesInDay);
  const remainingMinutes = totalMinutesInDay - passedMinutes;
  return {
    dayProgress: day.progress,
    dayPercentDone: Math.round(day.progress * 100),
    dayPercentLeft: Math.round((1 - day.progress) * 100),
    dayHoursPassed: Math.round((day.progress * 24 * 60 * 60 * 1000) / (60 * 60 * 1000) * 10) / 10,
    dayHoursLeft: Math.round(day.remainingMs / (60 * 60 * 1000) * 10) / 10,
    dayPassedMinutes: passedMinutes,
    dayRemainingMinutes: remainingMinutes,
    startOfDay: day.startOfDay,
    endOfDay: day.endOfDay,
    monthProgress: month.progress,
    monthIndex: date.getMonth() + 1,
    monthDaysPassed: month.dayOfMonth,
    monthDaysLeft: month.remainingDays,
    monthPercent: Math.round(month.progress * 100),
    yearProgress: year.progress,
    yearDaysPassed: year.dayOfYear,
    yearDaysLeft: year.remainingDays,
    yearPercent: Math.round(year.progress * 100),
    updatedAt: Date.now(),
  };
}

export class MmkvTimeRepository implements ITimeRepository {
  private subscribers: Set<Subscriber> = new Set();

  getUserProfile(): { birthDate: string | null; deathAge: number } {
    const birthDate = getString(STORAGE_KEYS.USER_BIRTH_DATE) ?? null;
    const deathAge = getNumber(STORAGE_KEYS.USER_DEATH_AGE) ?? DEFAULTS.USER_DEATH_AGE;
    return {
      birthDate,
      deathAge,
    };
  }

  getTimeState(): TimeProgress {
    const profile = this.getUserProfile();
    return computeTimeState(profile.birthDate, profile.deathAge);
  }

  getWidgetCache(): WidgetCache {
    return computeWidgetCache();
  }

  setUserProfile(birthDate: string, deathAge: number): void {
    setString(STORAGE_KEYS.USER_BIRTH_DATE, birthDate);
    setNumber(STORAGE_KEYS.USER_DEATH_AGE, deathAge);
    this.notifySubscribers();
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }
}
