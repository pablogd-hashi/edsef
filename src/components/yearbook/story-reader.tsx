"use client";

import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { EditableField } from "@/components/ui/editable-field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { MediaGallery } from "@/components/yearbook/media-gallery";
import { MediaUpload } from "@/components/yearbook/media-upload";
import type { MediaItem } from "@/components/yearbook/media-gallery";

export function StoryReader({
  id,
  title,
  content,
  media = [],
  childId,
  yearbookId,
  canEdit = false,
}: {
  id: string;
  title: string;
  content: Prisma.JsonValue;
  media?: { media: MediaItem }[];
  childId: string;
  yearbookId: string;
  canEdit?: boolean;
}) {
  const router = useRouter();

  async function patchStory(data: Record<string, unknown>) {
    const res = await fetch(`/api/stories/${id}`, {
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
    <article>
      <EditableField
        value={title}
        canEdit={canEdit}
        as="h3"
        placeholder="Story title"
        className="font-display text-3xl md:text-4xl mb-8 tracking-tight"
        inputClassName="font-display text-2xl"
        onSave={async (newTitle) => {
          await patchStory({ title: newTitle });
          router.refresh();
        }}
      />
      {canEdit ? (
        <RichTextEditor
          value={content}
          canEdit
          outputFormat="tiptap"
          placeholder="Write the story — use bold, links, headings…"
          onSave={async (newContent) => {
            await patchStory({ content: newContent });
            router.refresh();
          }}
        />
      ) : (
        <RichTextContent value={content} className="prose-yearbook text-muted" />
      )}

      <MediaGallery media={media} canEdit={canEdit} storyId={id} />
      {canEdit && (
        <MediaUpload
          className="mt-4"
          childId={childId}
          yearbookId={yearbookId}
          storyId={id}
        />
      )}
    </article>
  );
}
