"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EditableField } from "@/components/ui/editable-field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SummaryContent {
  subtitle?: string;
  location?: string;
  context?: string;
  highlights?: string[];
  trips?: string[];
  favoriteMusic?: string;
  likes?: string;
  fears?: string;
}

export function SummaryEditor({
  yearbookId,
  childId,
  content,
  canEdit,
}: {
  yearbookId: string;
  childId: string;
  content: SummaryContent | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<SummaryContent>(content ?? {});
  const [saving, setSaving] = useState(false);

  async function save(next: SummaryContent) {
    setSaving(true);
    try {
      const res = await fetch(`/api/yearbooks/${yearbookId}?childId=${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryContent: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateField(key: keyof SummaryContent, value: string) {
    const next = { ...local, [key]: value || undefined };
    setLocal(next);
    await save(next);
  }

  if (!canEdit) {
    return null;
  }

  return (
    <div className="space-y-4">
      {saving && (
        <p className="text-xs text-muted flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["location", "Where you lived"],
            ["context", "Context of the year"],
            ["trips", "Trips & adventures"],
            ["favoriteMusic", "Favorite music"],
            ["likes", "Likes"],
            ["fears", "Fears"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-border-light bg-cream/50 p-5">
            <p className="text-xs uppercase tracking-wider text-accent-dark mb-1.5">{label}</p>
            <EditableField
              value={(local[key] as string) ?? ""}
              canEdit
              multiline
              placeholder={`Add ${label.toLowerCase()}…`}
              className="text-foreground leading-relaxed"
              onSave={(v) => updateField(key, v)}
            />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border-light bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-accent-dark mb-2">Highlights</p>
        <EditableField
          value={(local.highlights ?? []).join("\n")}
          canEdit
          multiline
          placeholder="One highlight per line…"
          className="text-foreground leading-relaxed"
          onSave={async (v) => {
            const highlights = v.split("\n").map((s) => s.trim()).filter(Boolean);
            const next = { ...local, highlights: highlights.length ? highlights : undefined };
            setLocal(next);
            await save(next);
          }}
        />
      </div>
    </div>
  );
}

export function CoverTitleEditor({
  yearbookId,
  childId,
  title,
  canEdit,
}: {
  yearbookId: string;
  childId: string;
  title: string;
  canEdit: boolean;
}) {
  const router = useRouter();

  if (!canEdit) return null;

  return (
    <EditableField
      value={title}
      canEdit
      as="span"
      className="font-display text-4xl md:text-5xl font-light tracking-tight"
      inputClassName="font-display text-3xl text-center"
      onSave={async (customCoverTitle) => {
        const res = await fetch(`/api/yearbooks/${yearbookId}?childId=${childId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customCoverTitle }),
        });
        if (!res.ok) throw new Error("Failed to save");
        router.refresh();
      }}
    />
  );
}
