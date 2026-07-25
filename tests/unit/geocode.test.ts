import { describe, expect, it } from "vitest";
import { splitPlaceList } from "@/lib/maps/geocode";
import { richTextToPlain } from "@/lib/rich-text";

describe("splitPlaceList", () => {
  it("splits comma-separated places", () => {
    expect(splitPlaceList("Paris, Rome, Barcelona")).toEqual(["Paris", "Rome", "Barcelona"]);
  });

  it("splits on middle dots and semicolons", () => {
    expect(splitPlaceList("Amsterdam · Berlin; Prague")).toEqual(["Amsterdam", "Berlin", "Prague"]);
  });

  it("strips HTML tags", () => {
    expect(splitPlaceList("<p>Amsterdam, Netherlands</p>")).toEqual(["Amsterdam", "Netherlands"]);
  });
});

describe("richTextToPlain", () => {
  it("strips HTML", () => {
    expect(richTextToPlain("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });
});
