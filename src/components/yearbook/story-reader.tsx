import type { Prisma } from "@prisma/client";

type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: { level?: number };
};

export function renderTiptapContent(content: Prisma.JsonValue): React.ReactNode[] {
  if (!content || typeof content !== "object") return [];

  const doc = content as { type?: string; content?: TiptapNode[] };
  if (!doc.content) return [];

  return doc.content.map((node, i) => renderNode(node, i));
}

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

export function StoryReader({
  title,
  content,
}: {
  title: string;
  content: Prisma.JsonValue;
}) {
  return (
    <article>
      <h3 className="font-display text-3xl md:text-4xl mb-8 tracking-tight">
        {title}
      </h3>
      <div className="prose-yearbook">{renderTiptapContent(content)}</div>
    </article>
  );
}
