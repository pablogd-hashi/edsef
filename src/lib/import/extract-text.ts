import { extractText, getDocumentProxy } from "unpdf";

/** Per-page extraction — mergePages:true flattens to one line and breaks parsing. */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  return pages
    .map((page) => page.trim())
    .filter(Boolean)
    .join("\n\n");
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return extractTextFromPdf(buffer);
  }

  if (
    mimeType.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md")
  ) {
    return buffer.toString("utf-8");
  }

  throw new Error("Upload a PDF or .txt file.");
}
