"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { formatDate } from "@/lib/age";
import { EditableField } from "@/components/ui/editable-field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { MediaGallery } from "@/components/yearbook/media-gallery";
import { MediaUpload } from "@/components/yearbook/media-upload";
import type { MediaItem } from "@/components/yearbook/media-gallery";

export interface ParentNoteItem {
  id: string;
  author: string;
  content: string;
  noteDate: Date | string;
  media?: { media: MediaItem }[];
}

export function ParentNotes({
  notes,
  childId,
  yearbookId,
  canEdit = false,
}: {
  notes: ParentNoteItem[];
  childId: string;
  yearbookId: string;
  canEdit?: boolean;
}) {
  const router = useRouter();

  async function patchNote(id: string, data: Record<string, string>) {
    const res = await fetch(`/api/parent-notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      {notes.map((note) => (
        <div
          key={note.id}
          className="relative rounded-2xl border border-border bg-gradient-to-br from-cream/80 to-card p-8"
        >
          <Heart className="absolute top-6 right-6 h-5 w-5 text-accent/30" />
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3">
            <EditableField
              value={note.author}
              canEdit={canEdit}
              placeholder="Author"
              className="inline text-xs uppercase tracking-wider text-accent-dark"
              onSave={async (author) => {
                await patchNote(note.id, { author });
                router.refresh();
              }}
            />
            {" · "}
            {formatDate(new Date(note.noteDate), "d MMMM yyyy")}
          </p>
          {canEdit ? (
            <RichTextEditor
              value={note.content}
              canEdit
              placeholder="Write your note…"
              className="font-editorial italic"
              onSave={async (content) => {
                await patchNote(note.id, { content: content as string });
                router.refresh();
              }}
            />
          ) : (
            <RichTextContent
              value={note.content}
              className="font-editorial text-lg leading-relaxed italic text-foreground/90"
            />
          )}

          <MediaGallery
            media={note.media ?? []}
            canEdit={canEdit}
            parentNoteId={note.id}
          />
          {canEdit && (
            <MediaUpload
              className="mt-4"
              childId={childId}
              yearbookId={yearbookId}
              parentNoteId={note.id}
            />
          )}
        </div>
      ))}
    </div>
  );
}
