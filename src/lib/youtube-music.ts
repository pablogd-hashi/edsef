/**
 * YouTube Music search or direct track URL.
 * Prefer stored youtubeUrl; otherwise open search for title + artist.
 */
export function getYouTubeMusicUrl(
  title: string,
  artist?: string | null,
  youtubeUrl?: string | null
): string {
  if (youtubeUrl?.trim()) {
    const url = youtubeUrl.trim();
    if (url.includes("music.youtube.com") || url.includes("youtube.com")) {
      return url;
    }
  }

  const query = [artist, title].filter(Boolean).join(" ");
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
}
