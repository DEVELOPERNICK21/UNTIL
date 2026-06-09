import type {
  ReflectionPersistence,
  ReflectionTone,
} from '../../domain/reflections/reflectionTypes';
import { getString, setString } from '../../persistence/mmkv';
import { STORAGE_KEYS } from '../../persistence/schema';

export class MmkvReflectionRepository implements ReflectionPersistence {
  getDailyReflectionDate(): string | undefined {
    return getString(STORAGE_KEYS.DAILY_REFLECTION_DATE);
  }

  setDailyReflectionDate(value: string): void {
    setString(STORAGE_KEYS.DAILY_REFLECTION_DATE, value);
  }

  getDailyReflectionPayload(): string | undefined {
    return getString(STORAGE_KEYS.DAILY_REFLECTION_PAYLOAD);
  }

  setDailyReflectionPayload(value: string): void {
    setString(STORAGE_KEYS.DAILY_REFLECTION_PAYLOAD, value);
  }

  getDailyReflectionDismissedDate(): string | undefined {
    return getString(STORAGE_KEYS.DAILY_REFLECTION_DISMISSED_DATE);
  }

  setDailyReflectionDismissedDate(value: string): void {
    setString(STORAGE_KEYS.DAILY_REFLECTION_DISMISSED_DATE, value);
  }

  getReflectionTone(): string | undefined {
    return getString(STORAGE_KEYS.REFLECTION_TONE);
  }

  setReflectionTone(value: ReflectionTone): void {
    setString(STORAGE_KEYS.REFLECTION_TONE, value);
  }
}
