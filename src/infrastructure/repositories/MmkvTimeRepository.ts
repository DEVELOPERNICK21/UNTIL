/**
 * MmkvTimeRepository - MMKV-backed implementation of ITimeRepository
 * Single Source of Truth for time and user profile data.
 * Widgets read from the same MMKV that this uses.
 */

import type { ITimeRepository } from '../../domain/repository/ITimeRepository';
import type { TimeProgress } from '../../types';
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
