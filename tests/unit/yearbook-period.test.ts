import { describe, expect, it } from "vitest";
import {
  computeYearbookPeriod,
  formatYearbookPeriodLong,
  formatYearbookYears,
} from "@/lib/yearbook/period";

describe("yearbook period", () => {
  const birthDate = new Date("2021-11-15");

  it("computes first life year from birth date", () => {
    const { periodStart, periodEnd } = computeYearbookPeriod(birthDate, 1);
    expect(periodStart.getFullYear()).toBe(2021);
    expect(periodStart.getMonth()).toBe(10);
    expect(periodEnd.getFullYear()).toBe(2022);
    expect(periodEnd.getMonth()).toBe(10);
    expect(periodEnd.getDate()).toBe(14);
  });

  it("formats calendar years across two years", () => {
    const { periodStart, periodEnd } = computeYearbookPeriod(birthDate, 1);
    expect(formatYearbookYears(periodStart, periodEnd)).toBe("2021–2022");
    expect(formatYearbookPeriodLong(periodStart, periodEnd)).toBe("Nov 2021 – Nov 2022");
  });
});
