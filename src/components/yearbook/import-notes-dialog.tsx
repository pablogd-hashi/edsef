"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { ImportPreview } from "@/lib/import/types";

interface ImportNotesDialogProps {
  childId: string;
  yearbookId: string;
  yearbookTitle: string;
}

export function ImportNotesDialog({
  childId,
  yearbookId,
  yearbookTitle,
}: ImportNotesDialogProps) {
  const router = useRouter();
  const fileInputId = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setText("");
    setPreview(null);
    setError("");
    setLoading(false);
    setApplying(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function handleParse(file?: File) {
    setError("");
    setLoading(true);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("childId", childId);
      if (file) formData.append("file", file);
      if (text.trim()) formData.append("text", text.trim());

      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not parse file");

      setPreview(data.preview as ImportPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!preview) return;
    setApplying(true);
    setError("");

    try {
      const res = await fetch("/api/import/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, yearbookId, preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");

      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setApplying(false);
    }
  }

  const counts = preview
    ? {
        timeline: preview.timeline.length,
        stories: preview.stories.length,
        milestones: preview.milestones.length,
        music: preview.music.length,
        notes: preview.parentNotes.length,
      }
    : null;

  const totalItems = counts
    ? counts.timeline + counts.stories + counts.milestones + counts.music + counts.notes
    : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants("outline", "sm"))}
      >
        <FileUp className="h-4 w-4" />
        Import notes
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={close}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-[var(--warm-shadow-lg)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
              <div>
                <h2 className="font-editorial text-xl">Import notes</h2>
                <p className="text-sm text-muted mt-1">
                  PDF or pasted text → sections in <strong>{yearbookTitle}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-full p-2 hover:bg-cream transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="rounded-xl bg-accent/5 border border-accent/15 px-4 py-3 text-sm text-muted leading-relaxed">
                Works with Apple Notes, Google Keep, or PDF exports. We detect months,
                bullet lists, stories, milestones, and music — then map them to your
                yearbook sections.
              </div>

              <div>
                <label htmlFor={fileInputId} className="block text-sm font-medium mb-2">
                  Upload PDF or .txt
                </label>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".pdf,.txt,.md,text/plain,application/pdf"
                  className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-cream file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-cream/80"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleParse(file);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Or paste notes
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder={`2022 - Things that happened\n\nJanuary\n- First trip together\n- Started crawling\n\nFebruary\n- ...`}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!preview && (
                <button
                  type="button"
                  disabled={loading || !text.trim()}
                  onClick={() => void handleParse()}
                  className={cn(buttonVariants("primary", "md"), "w-full")}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Preview import
                    </>
                  )}
                </button>
              )}

              {preview && counts && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-cream/30 p-4">
                    <p className="text-sm font-medium mb-3">Ready to import</p>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">Timeline</dt>
                        <dd className="font-medium">{counts.timeline}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">Stories</dt>
                        <dd className="font-medium">{counts.stories}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">Milestones</dt>
                        <dd className="font-medium">{counts.milestones}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">Music</dt>
                        <dd className="font-medium">{counts.music}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">Parent notes</dt>
                        <dd className="font-medium">{counts.notes}</dd>
                      </div>
                    </dl>
                    {preview.detectedTitle && (
                      <p className="text-xs text-muted mt-3">
                        Detected title: {preview.detectedTitle}
                      </p>
                    )}
                  </div>

                  {totalItems === 0 ? (
                    <p className="text-sm text-muted">
                      No structured content found. Try adding month headers (January,
                      Febrero…) and bullet points.
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={applying}
                      onClick={() => void handleApply()}
                      className={cn(buttonVariants("primary", "md"), "w-full")}
                    >
                      {applying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing…
                        </>
                      ) : (
                        `Import ${totalItems} items`
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    className={cn(buttonVariants("ghost", "sm"), "w-full")}
                  >
                    Start over
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
