import type { Prisma } from "@prisma/client";

type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
};

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
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p }],
    })),
  };
}
