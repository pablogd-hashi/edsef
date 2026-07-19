import { Heart } from "lucide-react";
import { formatDate } from "@/lib/age";

export interface ParentNoteItem {
  id: string;
  author: string;
  content: string;
  noteDate: Date | string;
}

export function ParentNotes({ notes }: { notes: ParentNoteItem[] }) {
  return (
    <div className="space-y-6">
      {notes.map((note) => (
        <div
          key={note.id}
          className="relative rounded-2xl border border-border bg-gradient-to-br from-cream/80 to-card p-8"
        >
          <Heart className="absolute top-6 right-6 h-5 w-5 text-accent/30" />
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3">
            {note.author} · {formatDate(new Date(note.noteDate), "d MMMM yyyy")}
          </p>
          <p className="font-editorial text-lg leading-relaxed italic text-foreground/90">
            {note.content}
          </p>
        </div>
      ))}
    </div>
  );
}
