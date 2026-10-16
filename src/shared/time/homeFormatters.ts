import { now as clockNow } from './clock';
export function formatDayPassedLeftWithSeconds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  const passedMs = date.getTime() - start.getTime();
  const remainingMs = Math.max(0, end.getTime() - date.getTime());
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const passedS = Math.floor(passedMs / 1000);
  const remainingS = Math.floor(remainingMs / 1000);
  const passedH = Math.floor(passedS / 3600);
  const passedM = Math.floor((passedS % 3600) / 60);
  const passedSec = passedS % 60;
  const leftH = Math.floor(remainingS / 3600);
  const leftM = Math.floor((remainingS % 3600) / 60);
  const leftSec = remainingS % 60;
  const passedStr = `${passedH}h ${passedM}m ${passedSec}s`;
  const leftStr = `${leftH}h ${leftM}m ${leftSec}s`;
  const progress = Math.min(1, Math.max(0, passedMs / totalMs));
  const passedPct = Math.round(progress * 100);
  const leftPct = 100 - passedPct;
  return { passedStr, leftStr, passedPct, leftPct, progress };
}

export function formatMonthPassedLeft(
  remainingDaysMonth: number,
  date: Date = clockNow(),
) {
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const passedDays = daysInMonth - remainingDaysMonth;
  const passedPct = Math.round((passedDays / daysInMonth) * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remainingDaysMonth,
    passedPct,
    leftPct,
  };
}

export function formatYearPassedLeft(
  remainingDaysYear: number,
  date: Date = clockNow(),
) {
  const y = date.getFullYear();
  const daysInYear =
    (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
  const passedDays = daysInYear - remainingDaysYear;
  const passedPct = Math.round((passedDays / daysInYear) * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remainingDaysYear,
    passedPct,
    leftPct,
  };
}

export function formatLifePassedLeft(
  lifeProgress: number,
  remainingDaysLife: number | undefined,
  deathAge: number,
) {
  const totalLifeDays = Math.round(deathAge * 365.25);
  const remaining = remainingDaysLife ?? 0;
  const passedDays = totalLifeDays - remaining;
  const passedPct = Math.round(lifeProgress * 100);
  const leftPct = 100 - passedPct;
  return {
    passedDays,
    leftDays: remaining,
    passedPct,
    leftPct,
    totalLifeDays,
  };
}

export function extraDayPercentText(input: {
  signedIn: boolean;
  hasBirthDate: boolean;
  now: Date;
}): string {
  if (!input.signedIn || !input.hasBirthDate) return '—';
  return `${formatDayPassedLeftWithSeconds(input.now).passedPct}%`;
}
