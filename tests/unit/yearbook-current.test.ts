import { describe, expect, it } from "vitest";
import { computeYearbookPeriod, currentLifeYearNumber } from "@/lib/yearbook/period";

describe("currentLifeYearNumber", () => {
  const birthDate = new Date(2021, 10, 15);

  it("is year 1 on the birth day", () => {
    expect(currentLifeYearNumber(birthDate, new Date(2021, 10, 15))).toBe(1);
  });

  it("stays year 1 the day before the first birthday", () => {
    expect(currentLifeYearNumber(birthDate, new Date(2022, 10, 14))).toBe(1);
  });

  it("becomes year 2 on the first birthday", () => {
    expect(currentLifeYearNumber(birthDate, new Date(2022, 10, 15))).toBe(2);
  });

  it("is year 1 before birth (newborn profile)", () => {
    expect(currentLifeYearNumber(birthDate, new Date(2021, 9, 1))).toBe(1);
  });

  it("aligns with computeYearbookPeriod bounds", () => {
    const year = currentLifeYearNumber(birthDate, new Date(2024, 2, 3));
    const { periodStart, periodEnd } = computeYearbookPeriod(birthDate, year);
    expect(new Date(2024, 2, 3).getTime()).toBeGreaterThanOrEqual(periodStart.getTime());
    expect(new Date(2024, 2, 3).getTime()).toBeLessThanOrEqual(periodEnd.getTime());
  });
});
