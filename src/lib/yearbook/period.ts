import { addYears, format, startOfDay, subDays } from "date-fns";
import { enUS } from "date-fns/locale";

/** Life-year period from birth date (year 1 = birth → first birthday). */
export function computeYearbookPeriod(birthDate: Date, yearNumber: number) {
  const periodStart = addYears(birthDate, yearNumber - 1);
  const periodEnd = subDays(addYears(periodStart, 1), 1);
  return { periodStart, periodEnd };
}

/** Life-year number that contains `at` (1 = birth → day before first birthday). */
export function currentLifeYearNumber(birthDate: Date, at: Date = new Date()): number {
  const day = startOfDay(at);
  if (day < startOfDay(birthDate)) return 1;

  let year = 1;
  while (year < 120) {
    const { periodEnd } = computeYearbookPeriod(birthDate, year);
    if (day <= startOfDay(periodEnd)) return year;
    year += 1;
  }
  return year;
}

export function formatYearbookYears(start: Date, end: Date): string {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  if (startYear === endYear) return String(startYear);
  return `${startYear}–${endYear}`;
}

export function formatYearbookPeriodLong(start: Date, end: Date): string {
  return `${format(start, "MMM yyyy", { locale: enUS })} – ${format(end, "MMM yyyy", { locale: enUS })}`;
}
