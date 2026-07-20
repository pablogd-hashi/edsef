"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export interface MilestoneMediaItem {
  id: string;
  type: string;
  title?: string | null;
}

export function MilestoneMediaGallery({
  media,
  canEdit = false,
}: {
  media: { media: MilestoneMediaItem }[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!media.length) return null;

  async function removeMedia(mediaId: string) {
    if (!confirm("Delete this photo or video?")) return;
    setDeletingId(mediaId);
    try {
      const res = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
      {media.map(({ media: m }) => (
        <div
          key={m.id}
          className="relative aspect-square rounded-xl overflow-hidden bg-cream border border-border-light group"
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
          {canEdit && (
            <button
              type="button"
              onClick={() => removeMedia(m.id)}
              disabled={deletingId === m.id}
              className="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
              aria-label="Delete"
            >
              {deletingId === m.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
