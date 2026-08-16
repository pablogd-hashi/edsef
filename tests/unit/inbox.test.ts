import { describe, expect, it } from "vitest";
import { extractCapturedAt, parseExifDate } from "@/lib/inbox/exif";
import { folderSlug, isPlaceholderName, titleFromFilename } from "@/lib/inbox/paths";
import { matchChildFolder, resolveChildForFile } from "@/lib/inbox/match-child";

const children = [
  { id: "1", fullName: "Sofía García", nickname: "Sofia" },
  { id: "2", fullName: "Baby Two", nickname: "Coco" },
];

describe("inbox folder matching", () => {
  it("slugs nicknames and accented names the same way", () => {
    expect(folderSlug("Sofia")).toBe("sofia");
    expect(folderSlug("Sofía García")).toBe("sofia-garcia");
  });

  it("matches a child folder by nickname", () => {
    const sofia = matchChildFolder("Sofia", children);
    const coco = matchChildFolder("coco", children);
    expect(sofia !== "unassigned" && sofia?.id).toBe("1");
    expect(coco !== "unassigned" && coco?.id).toBe("2");
  });

  it("treats unassigned as a reserved folder", () => {
    expect(matchChildFolder("unassigned", children)).toBe("unassigned");
  });

  it("imports root files only when there is a single child", () => {
    expect(resolveChildForFile(null, children)).toBeNull();
    expect(resolveChildForFile(null, [children[0]])?.id).toBe("1");
  });

  it("skips iCloud placeholders", () => {
    expect(isPlaceholderName(".DS_Store")).toBe(true);
    expect(isPlaceholderName("IMG_001.heic.icloud")).toBe(true);
    expect(isPlaceholderName("IMG_001.heic")).toBe(false);
  });

  it("titles from filename", () => {
    expect(titleFromFilename("First steps.HEIC")).toBe("First steps");
  });
});

describe("EXIF date", () => {
  it("parses DateTimeOriginal ASCII", () => {
    const buf = Buffer.from("xxxx\x00DateTimeOriginal\x002024:03:08 14:05:06\x00");
    const date = parseExifDate(buf);
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(8);
  });

  it("falls back when EXIF is missing", () => {
    const fallback = new Date(2020, 0, 2);
    expect(extractCapturedAt(Buffer.from("no dates here"), fallback)).toEqual(fallback);
  });
});
