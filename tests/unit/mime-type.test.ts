import { describe, it, expect } from "vitest";
import { inferMimeType } from "@/lib/storage/local";

describe("inferMimeType", () => {
  it("treats .mov as video even when browser sends image/jpeg", () => {
    expect(inferMimeType("IMG_1234.MOV", "image/jpeg")).toBe("video/quicktime");
  });

  it("treats .mp4 as video", () => {
    expect(inferMimeType("clip.mp4", "application/octet-stream")).toBe("video/mp4");
  });

  it("treats .jpg as image", () => {
    expect(inferMimeType("photo.jpg", "image/jpeg")).toBe("image/jpeg");
  });

  it("uses browser mime for unknown extensions", () => {
    expect(inferMimeType("file.bin", "video/webm")).toBe("video/webm");
  });
});
