import { differenceInMonths, differenceInYears, format } from "date-fns";
import { enUS } from "date-fns/locale";

export interface AgeResult {
  years: number;
  months: number;
  totalMonths: number;
  label: string;
}

export function calculateAge(birthDate: Date, atDate: Date = new Date()): AgeResult {
  const years = differenceInYears(atDate, birthDate);
  const totalMonths = differenceInMonths(atDate, birthDate);
  const months = totalMonths % 12;

  let label: string;
  if (years === 0) {
    label = months === 1 ? "1 month" : `${months} months`;
  } else if (months === 0) {
    label = years === 1 ? "1 year" : `${years} years`;
  } else {
    const yearPart = years === 1 ? "1 year" : `${years} years`;
    const monthPart = months === 1 ? "1 month" : `${months} months`;
    label = `${yearPart} and ${monthPart}`;
  }

  return { years, months, totalMonths, label };
}

export function formatDate(date: Date, pattern = "d MMMM yyyy"): string {
  return format(date, pattern, { locale: enUS });
}

export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1);
  return format(date, "MMMM", { locale: enUS });
}

export function getMonthAbbrev(month: number): string {
  const date = new Date(2024, month - 1, 1);
  return format(date, "MMM", { locale: enUS }).toUpperCase().slice(0, 3);
}
