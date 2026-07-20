import { describe, it, expect } from "vitest";
import { getYouTubeMusicUrl } from "@/lib/youtube-music";

describe("getYouTubeMusicUrl", () => {
  it("uses stored youtube URL when provided", () => {
    expect(
      getYouTubeMusicUrl("Song", "Artist", "https://music.youtube.com/watch?v=abc123")
    ).toBe("https://music.youtube.com/watch?v=abc123");
  });

  it("builds search URL from title and artist", () => {
    const url = getYouTubeMusicUrl("As It Was", "Harry Styles");
    expect(url).toContain("music.youtube.com/search");
    expect(url).toContain("Harry");
    expect(url).toContain("As");
  });
});
