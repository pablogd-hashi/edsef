"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { CHILD_THEME_PRESETS, DEFAULT_THEME_COLOR } from "@/lib/theme/colors";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewChildPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          nickname: nickname.trim() || undefined,
          birthDate,
          themeColor,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create child");

      router.push(`/children/${data.id}`);
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
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <h1 className="font-display text-3xl font-light tracking-tight mb-2">
          Add a child
        </h1>
        <p className="text-muted mb-8">
          Create a profile to start their yearbook. You can add life years after this.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="e.g. Emma Johnson"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nickname <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="What you call them at home"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Birth date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Theme color</label>
            <div className="flex flex-wrap gap-2">
              {CHILD_THEME_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  onClick={() => setThemeColor(preset.value)}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition-all",
                    themeColor === preset.value
                      ? "border-foreground scale-110"
                      : "border-white shadow-sm hover:scale-105"
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Short bio <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="A line or two for their profile page"
            />
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
              "Create profile"
            )}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
