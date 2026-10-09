import { describe, expect, it } from "vitest";
import { sanitizeRichHtml } from "@/lib/rich-text";

describe("sanitizeRichHtml", () => {
  it("keeps editor formatting", () => {
    const html = "<h2>Verano</h2><p><strong>Primer</strong> baño en el <em>mar</em></p><ul><li>uno</li></ul>";
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it("drops scripts, handlers and javascript links", () => {
    const out = sanitizeRichHtml(
      '<p onclick="steal()">hola</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a>'
    );
    expect(out).not.toMatch(/script|onclick|onerror|javascript|<img/i);
    expect(out).toContain("hola");
  });

  it("forces safe link attributes", () => {
    expect(sanitizeRichHtml('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer" target="_blank">x</a>'
    );
  });
});
