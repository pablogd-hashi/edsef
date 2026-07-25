import type { Prisma } from "@prisma/client";

type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export function isTiptapJson(value: unknown): value is Prisma.JsonObject {
  return Boolean(value && typeof value === "object" && "type" in value && (value as { type: string }).type === "doc");
}

export function isHtmlContent(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function tiptapToPlainText(content: Prisma.JsonValue): string {
  if (!content || typeof content !== "object") return "";
  const doc = content as { content?: TiptapNode[] };
  if (!doc.content) return "";

  const lines: string[] = [];
  for (const node of doc.content) {
    const text = node.content?.map((c) => c.text ?? "").join("") ?? "";
    if (node.type === "paragraph" && text) lines.push(text);
    else if (node.type === "blockquote" && text) lines.push(`"${text}"`);
    else if (node.type === "heading" && text) lines.push(text);
  }
  return lines.join("\n\n");
}

export function plainTextToTiptap(text: string): Prisma.InputJsonValue {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    type: "doc",
    content: paragraphs.length
      ? paragraphs.map((p) => ({
          type: "paragraph",
          content: [{ type: "text", text: p }],
        }))
      : [{ type: "paragraph" }],
  };
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/** Plain text from rich text (HTML, TipTap JSON, or plain string) */
export function richTextToPlain(value: string | Prisma.JsonValue | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") {
    return isHtmlContent(value) ? stripHtml(value) : value.trim();
  }
  return tiptapToPlainText(value).trim();
}

/** Normalize stored value for TipTap editor initial content */
export function toEditorContent(value: string | Prisma.JsonValue | null | undefined): string | Prisma.JsonObject {
  if (!value) return "";
  if (isTiptapJson(value)) return value;
  if (typeof value === "string") {
    if (isHtmlContent(value)) return value;
    return plainTextToTiptap(value) as Prisma.JsonObject;
  }
  return "";
}
