import { describe, it, expect } from "vitest";
import { calculateAge, formatDate, getMonthName } from "@/lib/age";

describe("calculateAge", () => {
  const birthDate = new Date("2024-03-15");

  it("calculates months for infants", () => {
    const result = calculateAge(birthDate, new Date("2024-09-15"));
    expect(result.years).toBe(0);
    expect(result.months).toBe(6);
    expect(result.label).toBe("6 months");
  });

  it("calculates years and months", () => {
    const result = calculateAge(birthDate, new Date("2026-06-15"));
    expect(result.years).toBe(2);
    expect(result.months).toBe(3);
    expect(result.label).toBe("2 years and 3 months");
  });

  it("handles exactly one year", () => {
    const result = calculateAge(birthDate, new Date("2025-03-15"));
    expect(result.years).toBe(1);
    expect(result.months).toBe(0);
    expect(result.label).toBe("1 year");
  });
});

describe("formatDate", () => {
  it("formats date in English", () => {
    const formatted = formatDate(new Date("2024-03-15"));
    expect(formatted).toContain("2024");
    expect(formatted).toContain("March");
  });
});

describe("getMonthName", () => {
  it("returns English month name", () => {
    expect(getMonthName(3)).toBe("March");
    expect(getMonthName(12)).toBe("December");
  });
});
