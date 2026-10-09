import { describe, expect, it } from "vitest";
import {
  CHILD_THEME_PRESETS,
  normalizeThemeHex,
  themeToCssVars,
} from "@/lib/theme/colors";

describe("CHILD_THEME_PRESETS", () => {
  it("covers more than pink and purple", () => {
    const names = CHILD_THEME_PRESETS.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(["Sky", "Forest", "Gold", "Slate"]));
    expect(CHILD_THEME_PRESETS.length).toBeGreaterThanOrEqual(16);
  });
});

describe("normalizeThemeHex", () => {
  it("accepts #RRGGBB and #RGB", () => {
    expect(normalizeThemeHex("#0ea5e9")).toBe("#0EA5E9");
    expect(normalizeThemeHex("2563eb")).toBe("#2563EB");
    expect(normalizeThemeHex("#abc")).toBe("#AABBCC");
  });

  it("rejects invalid values", () => {
    expect(normalizeThemeHex("red")).toBeNull();
    expect(normalizeThemeHex("#gg0000")).toBeNull();
    expect(normalizeThemeHex("#12")).toBeNull();
  });
});

describe("themeToCssVars", () => {
  it("derives accent tokens from any hex", () => {
    const vars = themeToCssVars("#2563EB");
    expect(vars["--accent"]).toBe("#2563EB");
    expect(vars["--accent-light"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(vars["--cream"]).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
