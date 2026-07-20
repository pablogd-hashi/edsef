type PdfParseResult = { text: string; numpages: number; info: Record<string, unknown> };

type PdfParseFn = (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<PdfParseResult>;

/** pdf-parse's index.js runs debug code on ESM import — use the lib entry only. */
export async function loadPdfParser(): Promise<PdfParseFn> {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  return (mod.default ?? mod) as PdfParseFn;
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const pdfParse = await loadPdfParser();
    const result = await pdfParse(buffer);
    return result.text ?? "";
  }

  if (
    mimeType.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md")
  ) {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type. Upload a PDF or plain-text (.txt) export.");
}
