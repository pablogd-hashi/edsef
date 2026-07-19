import { Music } from "lucide-react";

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
      {tracks.map((track, i) => (
        <div
          key={track.id}
          className="group flex items-center gap-4 rounded-xl border border-border-light bg-card p-4 hover:border-accent-light hover:shadow-[var(--warm-shadow)] transition-all duration-200"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-dark">
            <Music className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate group-hover:text-accent-dark transition-colors">
              {track.title}
            </p>
            {track.artist && (
              <p className="text-sm text-muted truncate">{track.artist}</p>
            )}
          </div>
          <span className="text-sm text-muted-light font-editorial">
            {String(i + 1).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}
