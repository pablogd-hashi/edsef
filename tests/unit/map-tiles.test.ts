import { describe, expect, it } from "vitest";
import { buildMapViewport, latLngToTile } from "@/lib/maps/tiles";

describe("latLngToTile", () => {
  it("returns Amsterdam tile at zoom 13", () => {
    const tile = latLngToTile(52.3676, 4.9041, 13);
    expect(tile.x).toBeGreaterThan(4000);
    expect(tile.y).toBeGreaterThan(2000);
  });
});

describe("buildMapViewport", () => {
  it("centers the coordinate in the viewport", () => {
    const viewport = buildMapViewport(52.3676, 4.9041, 640, 192);
    expect(viewport.tiles).toHaveLength(9);
    expect(viewport.gridWidth).toBe(768);
    expect(viewport.gridHeight).toBe(768);
    // Pin should be near horizontal center
    expect(Math.abs(viewport.offsetX)).toBeLessThan(200);
  });
});
