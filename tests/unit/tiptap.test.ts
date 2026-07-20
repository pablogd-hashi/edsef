import { describe, it, expect } from "vitest";
import { plainTextToTiptap, tiptapToPlainText } from "@/lib/tiptap";

describe("tiptap helpers", () => {
  it("converts plain text to tiptap paragraphs", () => {
    const doc = plainTextToTiptap("Hola\n\nMundo");
    expect(doc).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hola" }] },
        { type: "paragraph", content: [{ type: "text", text: "Mundo" }] },
      ],
    });
  });

  it("extracts plain text from tiptap", () => {
    const text = tiptapToPlainText({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Bianca nació" }] },
      ],
    });
    expect(text).toBe("Bianca nació");
  });
});
