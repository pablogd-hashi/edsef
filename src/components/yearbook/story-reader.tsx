"use client";

import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { EditableField } from "@/components/ui/editable-field";
import { tiptapToPlainText } from "@/lib/tiptap";

type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: { level?: number };
};

function renderNode(node: TiptapNode, key: number): React.ReactNode {
  const text = node.content?.map((c) => c.text ?? "").join("") ?? "";

  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level ?? 1;
      if (level === 1) {
        return (
          <h3 key={key} className="font-editorial text-3xl mt-8 mb-4">
            {text}
          </h3>
        );
      }
      return (
        <h4 key={key} className="font-editorial text-xl mt-6 mb-3">
          {text}
        </h4>
      );
    }
    case "paragraph":
      return text ? (
        <p key={key} className="mb-4 text-muted leading-[1.85]">
          {text}
        </p>
      ) : (
        <br key={key} />
      );
    case "blockquote":
      return (
        <blockquote key={key} className="my-8">
          {node.content?.map((c, j) => renderNode(c, j))}
        </blockquote>
      );
    default:
      return null;
  }
}

function renderTiptapContent(content: Prisma.JsonValue): React.ReactNode[] {
  if (!content || typeof content !== "object") return [];
  const doc = content as { type?: string; content?: TiptapNode[] };
  if (!doc.content) return [];
  return doc.content.map((node, i) => renderNode(node, i));
}

export function StoryReader({
  id,
  title,
  content,
  canEdit = false,
}: {
  id: string;
  title: string;
  content: Prisma.JsonValue;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const plainText = tiptapToPlainText(content);

  async function patchStory(data: Record<string, string>) {
    const res = await fetch(`/api/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al guardar");
    }
  }

  return (
    <article>
      <EditableField
        value={title}
        canEdit={canEdit}
        as="h3"
        placeholder="Título de la historia"
        className="font-display text-3xl md:text-4xl mb-8 tracking-tight"
        inputClassName="font-display text-2xl"
        onSave={async (newTitle) => {
          await patchStory({ title: newTitle });
          router.refresh();
        }}
      />
      {canEdit ? (
        <EditableField
          value={plainText}
          canEdit
          multiline
          as="p"
          placeholder="Escribe la historia aquí..."
          className="prose-yearbook text-muted leading-[1.85] whitespace-pre-line"
          onSave={async (newContent) => {
            await patchStory({ content: newContent });
            router.refresh();
          }}
        />
      ) : (
        <div className="prose-yearbook">{renderTiptapContent(content)}</div>
      )}
    </article>
  );
}
