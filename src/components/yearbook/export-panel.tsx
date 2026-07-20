"use client";

import { useState } from "react";
import { Download, FileArchive, FileText, FileImage, Loader2, CheckCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportPanel({
  yearbookId,
  childId,
  childName,
  yearTitle,
}: {
  yearbookId: string;
  childId: string;
  childName: string;
  yearTitle: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{
    downloadUrl: string;
    filename: string;
    mediaCount: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function exportFormat(format: "ZIP" | "HTML" | "PDF") {
    setLoading(format);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearbookId, childId, format }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");

      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-muted mb-8 leading-relaxed">
        Export <strong>{yearTitle}</strong> for {childName} with all photos and
        videos referenced locally. The ZIP includes offline HTML you can open with
        no install — just double-click{" "}
        <code className="text-sm bg-cream px-1.5 py-0.5 rounded">html/index.html</code>.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          {
            format: "ZIP" as const,
            icon: FileArchive,
            label: "Full ZIP",
            desc: "HTML + photos + videos + PDF",
            recommended: true,
          },
          {
            format: "HTML" as const,
            icon: FileText,
            label: "HTML only",
            desc: "index.html (needs assets folder)",
          },
          {
            format: "PDF" as const,
            icon: FileImage,
            label: "PDF only",
            desc: "Printable; videos in HTML",
          },
        ].map((opt) => (
          <button
            key={opt.format}
            type="button"
            disabled={!!loading}
            onClick={() => exportFormat(opt.format)}
            className={cn(
              "rounded-2xl border p-5 text-left transition-all hover:shadow-[var(--warm-shadow)] hover:border-accent-light",
              opt.recommended && "border-accent/40 bg-cream/30",
              loading === opt.format && "opacity-60"
            )}
          >
            {loading === opt.format ? (
              <Loader2 className="h-6 w-6 animate-spin text-accent-dark mb-3" />
            ) : (
              <opt.icon className="h-6 w-6 text-accent-dark mb-3" />
            )}
            <p className="font-medium">{opt.label}</p>
            <p className="text-xs text-muted mt-1">{opt.desc}</p>
            {opt.recommended && (
              <span className="inline-block mt-2 text-xs text-accent-dark font-medium">
                Recommended
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-emerald-900">Export ready</p>
              <p className="text-sm text-emerald-800 mt-1">
                {result.mediaCount} media files included in the package.
              </p>
              <a
                href={result.downloadUrl}
                download={result.filename}
                className={cn(buttonVariants("primary", "sm"), "mt-4 inline-flex")}
              >
                <Download className="h-4 w-4" />
                Download {result.filename}
              </a>
              <p className="text-xs text-emerald-700 mt-3">
                Copy the ZIP to a USB drive. Open <strong>html/index.html</strong> to
                view photos and play videos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
