export const WEEKS_PER_YEAR = 365.25 / 7;
export const LIFE_WEEKS_DOT_CAP = 5200;

export function computeLifeWeeks(
  deathAge: number,
  remainingDaysLife: number | undefined,
): { totalWeeks: number; livedWeeks: number; renderWeeks: number } {
  const totalWeeks = Math.round(deathAge * WEEKS_PER_YEAR);
  const remainingWeeks =
    typeof remainingDaysLife === 'number'
      ? Math.max(0, Math.round(remainingDaysLife / 7))
      : 0;
  const livedWeeks = Math.max(0, Math.min(totalWeeks, totalWeeks - remainingWeeks));
  const renderWeeks = Math.min(totalWeeks, LIFE_WEEKS_DOT_CAP);
  return { totalWeeks, livedWeeks, renderWeeks };
}
