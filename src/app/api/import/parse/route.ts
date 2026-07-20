import { NextResponse } from "next/server";
import { z } from "zod";
import { extractTextFromFile } from "@/lib/import/extract-text";
import { parseNotesDocument } from "@/lib/import/notes-parser";
import { requireParentSession } from "@/lib/api/require-parent";

export const runtime = "nodejs";
export const maxDuration = 60;

const parseBodySchema = z.object({
  childId: z.string().cuid(),
  text: z.string().min(20).optional(),
});

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const childId = formData.get("childId") as string | null;
      const file = formData.get("file") as File | null;
      const pastedText = formData.get("text") as string | null;

      if (!childId) {
        return NextResponse.json({ error: "childId required" }, { status: 400 });
      }

      const auth = await requireParentSession(childId);
      if (auth.error) return auth.error;

      let text = pastedText?.trim() ?? "";

      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        text = await extractTextFromFile(buffer, file.type, file.name);
      }

      if (!text || text.length < 20) {
        return NextResponse.json(
          { error: "Upload a PDF/text file or paste at least a few lines of notes." },
          { status: 400 }
        );
      }

      const preview = parseNotesDocument(text);
      return NextResponse.json({ preview, characterCount: text.length });
    }

    const body = await request.json();
    const parsed = parseBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const auth = await requireParentSession(parsed.data.childId);
    if (auth.error) return auth.error;

    if (!parsed.data.text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const preview = parseNotesDocument(parsed.data.text);
    return NextResponse.json({ preview, characterCount: parsed.data.text.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
