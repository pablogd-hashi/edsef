"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { X, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MilestoneMediaItem {
  id: string;
  type: string;
  title?: string | null;
}

export function MilestoneMediaGallery({
  media,
  canEdit = false,
  milestoneId,
  timelineEntryId,
}: {
  media: { media: MilestoneMediaItem }[];
  canEdit?: boolean;
  milestoneId?: string;
  timelineEntryId?: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [items, setItems] = useState(media);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const canReorder = canEdit && (milestoneId || timelineEntryId);

  const saveOrder = useCallback(
    async (ordered: { media: MilestoneMediaItem }[]) => {
      if (!canReorder) return;
      setSaving(true);
      try {
        const res = await fetch("/api/media/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestoneId,
            timelineEntryId,
            mediaIds: ordered.map((m) => m.media.id),
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error ?? "Failed to reorder");
          setItems(media);
          return;
        }
        router.refresh();
      } finally {
        setSaving(false);
      }
    },
    [canReorder, milestoneId, timelineEntryId, media, router]
  );

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setItems(next);
    setDragIndex(index);
  }

  async function handleDragEnd() {
    if (dragIndex !== null) {
      await saveOrder(items);
    }
    setDragIndex(null);
  }

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

  if (!items.length) return null;

  return (
    <div className="mt-4">
      {canReorder && (
        <p className="text-xs text-muted mb-2 flex items-center gap-1.5">
          <GripVertical className="h-3 w-3" />
          Drag photos and videos to arrange
          {saving && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map(({ media: m }, index) => (
          <div
            key={m.id}
            draggable={!!canReorder}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden bg-cream border border-border-light group",
              canReorder && "cursor-grab active:cursor-grabbing",
              dragIndex === index && "ring-2 ring-accent opacity-80"
            )}
          >
            {m.type === "VIDEO" ? (
              <video
                src={`/api/media/${m.id}/file?variant=original`}
                className="h-full w-full object-cover pointer-events-none"
                controls={!canReorder}
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/media/${m.id}/file?variant=web`}
                alt={m.title ?? ""}
                className="h-full w-full object-cover pointer-events-none"
                draggable={false}
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
    </div>
  );
}
