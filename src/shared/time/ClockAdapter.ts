import type { IClock } from './IClock';
import {
  endOfDay,
  formatDateToIso,
  nowMs,
  todayIso as localTodayIso,
} from './clock';

export class ClockAdapter implements IClock {
  nowMs(): number {
    return nowMs();
  }

  todayIso(): string {
    return localTodayIso();
  }

  formatDateToIso(date: Date): string {
    return formatDateToIso(date);
  }

  currentYear(): number {
    return new Date().getFullYear();
  }

  endOfDayMs(date: Date): number {
    return endOfDay(date).getTime();
  }
}
