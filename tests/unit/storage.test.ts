import { describe, it, expect } from "vitest";
import { exportAssetFilename, sanitizeExtension } from "@/lib/storage/local";

describe("exportAssetFilename", () => {
  it("places images under assets/images", () => {
    expect(exportAssetFilename("abc123", "IMAGE", "jpg")).toBe(
      "assets/images/abc123.jpg"
    );
  });

  it("places videos under assets/videos", () => {
    expect(exportAssetFilename("vid456", "VIDEO", "mp4")).toBe(
      "assets/videos/vid456.mp4"
    );
  });
});

describe("sanitizeExtension", () => {
  it("uses filename extension when valid", () => {
    expect(sanitizeExtension("photo.JPG", "image/jpeg")).toBe("jpg");
  });

  it("falls back to mime type", () => {
    expect(sanitizeExtension("video", "video/mp4")).toBe("mp4");
  });
});
