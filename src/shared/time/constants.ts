/**
 * Time-unit constants. SSOT: no other module spells out `24 * 60 * 60 * 1000`.
 * (tests/ssot.test.ts fails if one does.)
 */

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
/** A mean Gregorian year, for lifetime projections (not for calendar math). */
export const MS_PER_YEAR = 365.25 * MS_PER_DAY;
