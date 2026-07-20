"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHILD_THEME_PRESETS } from "@/lib/theme/colors";

export function ChildThemePicker({
  childId,
  currentColor,
  canEdit,
}: {
  childId: string;
  currentColor: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelected(currentColor);
  }, [currentColor]);

  if (!canEdit) return null;

  async function saveColor(color: string) {
    if (color === selected && color === currentColor) return;
    setSaving(true);
    setError("");
    setSelected(color);

    try {
      const res = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeColor: color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save color");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setSelected(currentColor);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-wider text-accent-dark mb-3">
        Theme color
      </p>
      <div className="flex flex-wrap gap-2">
        {CHILD_THEME_PRESETS.map((preset) => {
          const isActive = selected.toLowerCase() === preset.value.toLowerCase();
          return (
            <button
              key={preset.value}
              type="button"
              disabled={saving}
              title={preset.name}
              onClick={() => saveColor(preset.value)}
              className={cn(
                "relative h-10 w-10 rounded-full border-2 transition-all touch-manipulation",
                isActive ? "border-foreground scale-110 shadow-md" : "border-white shadow-sm hover:scale-105"
              )}
              style={{ backgroundColor: preset.value }}
            >
              {isActive && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
              )}
            </button>
          );
        })}
        {saving && <Loader2 className="h-5 w-5 animate-spin text-muted self-center ml-1" />}
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
