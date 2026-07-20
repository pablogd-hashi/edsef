"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { formatDate } from "@/lib/age";
import { EditableField } from "@/components/ui/editable-field";

export interface ParentNoteItem {
  id: string;
  author: string;
  content: string;
  noteDate: Date | string;
}

export function ParentNotes({
  notes,
  canEdit = false,
}: {
  notes: ParentNoteItem[];
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
          <EditableField
            value={note.content}
            canEdit={canEdit}
            multiline
            as="p"
            placeholder="Escribe tu nota..."
            className="font-editorial text-lg leading-relaxed italic text-foreground/90"
            inputClassName="font-editorial text-base italic"
            onSave={async (content) => {
              await patchNote(note.id, { content });
              router.refresh();
            }}
          />
        </div>
      ))}
    </div>
  );
}
