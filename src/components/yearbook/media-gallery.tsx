"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { X, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaItem {
  id: string;
  type: string;
  title?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface MediaGalleryProps {
  media: { media: MediaItem }[];
  canEdit?: boolean;
  milestoneId?: string;
  timelineEntryId?: string;
  storyId?: string;
  parentNoteId?: string;
  sectionType?: string;
  yearbookId?: string;
}

function mediaOrientation(width?: number | null, height?: number | null): "portrait" | "landscape" | "square" {
  if (!width || !height) return "square";
  const ratio = width / height;
  if (ratio > 1.15) return "landscape";
  if (ratio < 0.85) return "portrait";
  return "square";
}

export function MediaGallery({
  media,
  canEdit = false,
  milestoneId,
  timelineEntryId,
  storyId,
  parentNoteId,
  sectionType,
  yearbookId,
}: MediaGalleryProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [items, setItems] = useState(media);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const canReorder = canEdit && (milestoneId || timelineEntryId || storyId || parentNoteId || sectionType);

  const saveOrder = useCallback(
    async (ordered: { media: MediaItem }[]) => {
      if (!canReorder) return;
      setSaving(true);
      try {
        const res = await fetch("/api/media/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestoneId,
            timelineEntryId,
            storyId,
            parentNoteId,
            sectionType,
            yearbookId,
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
    [canReorder, milestoneId, timelineEntryId, storyId, parentNoteId, sectionType, yearbookId, media, router]
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map(({ media: m }, index) => {
          const isVideo = m.type === "VIDEO";
          const orientation = isVideo ? "landscape" : mediaOrientation(m.width, m.height);
          return (
            <div
              key={m.id}
              draggable={!!canReorder}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative rounded-xl overflow-hidden bg-cream border border-border-light group",
                canReorder && "cursor-grab active:cursor-grabbing",
                dragIndex === index && "ring-2 ring-accent opacity-80",
                isVideo && "col-span-2 sm:col-span-3 aspect-video",
                !isVideo && orientation === "portrait" && "row-span-2 aspect-[3/4]",
                !isVideo && orientation === "landscape" && "col-span-2 aspect-[4/3]",
                !isVideo && orientation === "square" && "aspect-square"
              )}
            >
              {isVideo ? (
                <video
                  src={`/api/media/${m.id}/file?variant=original`}
                  className="h-full w-full object-contain bg-black"
                  controls={!canReorder}
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/media/${m.id}/file?variant=web`}
                  alt={m.title ?? ""}
                  className="h-full w-full object-cover"
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
          );
        })}
      </div>
    </div>
  );
}

/** @deprecated Use MediaGallery */
export const MilestoneMediaGallery = MediaGallery;
export type MilestoneMediaItem = MediaItem;
