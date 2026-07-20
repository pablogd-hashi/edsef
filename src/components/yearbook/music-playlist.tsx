import { ExternalLink, Music } from "lucide-react";
import { getYouTubeMusicUrl } from "@/lib/youtube-music";

export interface MusicItem {
  id: string;
  title: string;
  artist?: string | null;
  spotifyUrl?: string | null;
  youtubeUrl?: string | null;
}

export function MusicPlaylist({ tracks }: { tracks: MusicItem[] }) {
  return (
    <div className="space-y-3">
      {tracks.map((track, i) => {
        const href = getYouTubeMusicUrl(track.title, track.artist, track.youtubeUrl);

        return (
          <a
            key={track.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-xl border border-border-light bg-card p-4 hover:border-accent-light hover:shadow-[var(--warm-shadow)] transition-all duration-200 touch-manipulation"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-dark group-hover:bg-accent group-hover:text-white transition-colors">
              <Music className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate group-hover:text-accent-dark transition-colors">
                {track.title}
              </p>
              {track.artist && (
                <p className="text-sm text-muted truncate">{track.artist}</p>
              )}
              <p className="text-xs text-muted-light mt-0.5">Open in YouTube Music</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-muted group-hover:text-accent-dark">
              <span className="text-sm font-editorial hidden sm:inline">
                {String(i + 1).padStart(2, "0")}
              </span>
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>
        );
      })}
    </div>
  );
}
