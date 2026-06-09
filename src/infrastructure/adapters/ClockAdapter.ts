import type { IClock } from '../../domain/ports/IClock';
import { endOfDay, formatDateToIso, nowMs } from '../../core/time/clock';

export class ClockAdapter implements IClock {
  nowMs(): number {
    return nowMs();
  }

  todayIso(): string {
    return formatDateToIso(new Date());
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
