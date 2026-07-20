"use client";

export interface MilestoneMediaItem {
  id: string;
  type: string;
  title?: string | null;
}

export function MilestoneMediaGallery({
  media,
}: {
  media: { media: MilestoneMediaItem }[];
}) {
  if (!media.length) return null;

  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
      {media.map(({ media: m }) => (
        <div
          key={m.id}
          className="relative aspect-square rounded-xl overflow-hidden bg-cream border border-border-light"
        >
          {m.type === "VIDEO" ? (
            <video
              src={`/api/media/${m.id}/file?variant=original`}
              className="h-full w-full object-cover"
              controls
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${m.id}/file?variant=web`}
              alt={m.title ?? ""}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}
