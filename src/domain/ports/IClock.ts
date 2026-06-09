export interface IClock {
  nowMs(): number;
  todayIso(): string;
  formatDateToIso(date: Date): string;
  currentYear(): number;
  endOfDayMs(date: Date): number;
}
