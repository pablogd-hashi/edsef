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
    if (isYouTubeUrl(url)) return url;
  }

  const query = [artist, title].filter(Boolean).join(" ");
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);

/** Real https YouTube links only — rejects javascript: and look-alike hosts. */
function isYouTubeUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && YOUTUBE_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
