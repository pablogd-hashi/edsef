"use client";

import type { Prisma } from "@prisma/client";
import { isHtmlContent, isTiptapJson, tiptapToPlainText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: { level?: number };
};

function renderTiptapNode(node: TiptapNode, key: number): React.ReactNode {
  const text = node.content?.map((c) => c.text ?? "").join("") ?? "";

  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level ?? 2;
      if (level === 2) {
        return (
          <h3 key={key} className="font-editorial text-2xl mt-6 mb-3">
            {text}
          </h3>
        );
      }
      return (
        <h4 key={key} className="font-editorial text-xl mt-4 mb-2">
          {text}
        </h4>
      );
    }
    case "paragraph":
      return text ? (
        <p key={key} className="mb-3 leading-relaxed">
          {text}
        </p>
      ) : (
        <br key={key} />
      );
    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-5 mb-3 space-y-1">
          {node.content?.map((li, i) => (
            <li key={i}>{li.content?.map((c) => c.text).join("")}</li>
          ))}
        </ul>
      );
    case "blockquote":
      return (
        <blockquote key={key} className="border-l-3 border-accent pl-4 italic my-4">
          {node.content?.map((c, j) => renderTiptapNode(c, j))}
        </blockquote>
      );
    default:
      return null;
  }
}

export function RichTextContent({
  value,
  className,
  as: Tag = "div",
}: {
  value: string | Prisma.JsonValue | null | undefined;
  className?: string;
  as?: "div" | "p" | "span";
}) {
  if (!value) return null;

  if (isTiptapJson(value)) {
    const doc = value as { content?: TiptapNode[] };
    return (
      <Tag className={cn("prose-yearbook", className)}>
        {doc.content?.map((node, i) => renderTiptapNode(node, i))}
      </Tag>
    );
  }

  if (typeof value === "string") {
    if (isHtmlContent(value)) {
      return (
        <Tag
          className={cn("prose-yearbook rich-html", className)}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      );
    }
    if (!value.trim()) return null;
    return <Tag className={cn("prose-yearbook whitespace-pre-line leading-relaxed", className)}>{value}</Tag>;
  }

  const plain = tiptapToPlainText(value);
  if (!plain) return null;
  return <Tag className={cn("prose-yearbook whitespace-pre-line", className)}>{plain}</Tag>;
}
