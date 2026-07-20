"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewYearbookPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [title, setTitle] = useState("Year 1");
  const [yearNumber, setYearNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/yearbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          title: title.trim(),
          yearNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create year");

      router.push(`/children/${childId}/yearbooks/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-lg px-6 py-10 md:py-14">
        <Link
          href={`/children/${childId}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to child
        </Link>

        <h1 className="font-display text-3xl font-light tracking-tight mb-2">
          New life year
        </h1>
        <p className="text-muted mb-8">
          Each year is an independent digital book with its own timeline, photos, and stories.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="e.g. Year 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Year number</label>
            <input
              type="number"
              min={1}
              value={yearNumber}
              onChange={(e) => setYearNumber(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <p className="text-xs text-muted mt-1.5">1 = first year of life, 2 = second, etc.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(buttonVariants("primary", "md"), "w-full")}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create year"
            )}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
