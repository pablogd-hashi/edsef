"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { ImportPreview } from "@/lib/import/types";

function countItems(preview: ImportPreview): number {
  return (
    (preview.summary.highlights?.length ?? 0) +
    (preview.summary.context ? 1 : 0) +
    preview.milestones.length +
    preview.music.length +
    preview.stories.length +
    preview.videos.length +
    preview.parentNotes.length +
    preview.parentsBeforeBirth.length +
    preview.parentsDuringYear.length
  );
}

export function ImportNotesDialog({
  childId,
  yearbookId,
  yearbookTitle,
}: {
  childId: string;
  yearbookId: string;
  yearbookTitle: string;
}) {
  const router = useRouter();
  const fileInputId = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setError("");
    setBusy(false);
  }

  async function importFile(file: File) {
    setBusy(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("childId", childId);
      formData.append("file", file);

      const parseRes = await fetch("/api/import/parse", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error ?? "Could not read file");

      const parsed = parseData.preview as ImportPreview;
      const total = countItems(parsed);
      if (total === 0) {
        throw new Error(
          "No content found. Export your notes as PDF (not a photo scan) or paste text instead."
        );
      }

      const applyRes = await fetch("/api/import/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          yearbookId,
          preview: parsed,
          replaceExisting: true,
        }),
      });
      const applyData = await applyRes.json();
      if (!applyRes.ok) throw new Error(applyData.error ?? "Import failed");

      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants("outline", "sm"))}
      >
        <FileUp className="h-4 w-4" />
        Import PDF
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-editorial text-xl">Import PDF</h2>
                <p className="text-sm text-muted mt-1">
                  Replaces content in <strong>{yearbookTitle}</strong>
                </p>
              </div>
              <button type="button" onClick={close} className="p-2 hover:bg-cream rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted mb-4">
              Upload the year PDF from Apple Notes or Google Docs. Sections are filled
              automatically: summary, milestones, music, stories, notes, and timeline.
            </p>

            <label
              htmlFor={fileInputId}
              className={cn(
                buttonVariants("primary", "md"),
                "w-full cursor-pointer",
                busy && "opacity-60 pointer-events-none"
              )}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  Choose PDF
                </>
              )}
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
              }}
            />

            {error && (
              <p className="mt-4 text-sm text-red-600 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
