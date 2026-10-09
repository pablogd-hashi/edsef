"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ThemeColorSwatches } from "@/components/children/theme-color-swatches";

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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [syncedColor, setSyncedColor] = useState(currentColor);
  if (currentColor !== syncedColor) {
    setSyncedColor(currentColor);
    setSelected(currentColor);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!canEdit) return null;

  function queueSave(color: string) {
    if (color.toLowerCase() === selected.toLowerCase()) return;
    setSelected(color);
    setError("");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(color);
    }, 350);
  }

  async function persist(color: string) {
    setSaving(true);
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
      <ThemeColorSwatches value={selected} onChange={queueSave} />
      {saving && (
        <Loader2 className="h-5 w-5 animate-spin text-muted mt-2" />
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
