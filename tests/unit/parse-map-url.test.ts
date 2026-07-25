import { describe, it, expect } from "vitest";
import { parseMapUrl } from "@/lib/maps/parse-url";

describe("parseMapUrl", () => {
  it("parses lat,lng plain text", () => {
    expect(parseMapUrl("52.3676, 4.9041")).toEqual({
      latitude: 52.3676,
      longitude: 4.9041,
    });
  });

  it("parses Google Maps @ coordinates", () => {
    const r = parseMapUrl("https://www.google.com/maps/@52.3676,4.9041,17z");
    expect(r?.latitude).toBeCloseTo(52.3676);
    expect(r?.longitude).toBeCloseTo(4.9041);
  });

  it("parses Google Maps q= query", () => {
    expect(parseMapUrl("https://maps.google.com/?q=Amsterdam")).toEqual({
      query: "Amsterdam",
      label: "Amsterdam",
    });
  });

  it("parses Google Maps q= coordinates", () => {
    const r = parseMapUrl("https://maps.google.com/?q=52.37,4.90");
    expect(r?.latitude).toBeCloseTo(52.37);
    expect(r?.longitude).toBeCloseTo(4.9);
  });
});
