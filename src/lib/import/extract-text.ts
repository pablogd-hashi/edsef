export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (
    mimeType === "application/pdf" ||
    lower.endsWith(".pdf")
  ) {
    const pdfParse = (await import("pdf-parse")).default;
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
