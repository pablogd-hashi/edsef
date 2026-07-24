"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { YEARBOOK_SECTIONS } from "@/lib/yearbook/sections";
import { cn } from "@/lib/utils";

interface SectionState {
  id: string;
  sectionId: string;
  label: string;
  order: number;
  visible: boolean;
}

export function SectionEditor({
  yearbookId,
  childId,
  sections,
}: {
  yearbookId: string;
  childId: string;
  sections: SectionState[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(sections);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  function moveItem(index: number, direction: -1 | 1) {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((s, i) => ({ ...s, order: i })));
  }

  function toggleVisible(index: number) {
    const next = [...items];
    next[index] = { ...next[index], visible: !next[index].visible };
    setItems(next);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/yearbooks/${yearbookId}/sections?childId=${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: items.map((s) => ({
            id: s.id,
            order: s.order,
            visible: s.visible,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to save sections");
        return;
      }
      router.refresh();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-accent-dark hover:text-accent underline-offset-2 hover:underline"
      >
        Arrange sections
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-[var(--warm-shadow-lg)]">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-editorial text-lg">Arrange sections</h3>
          <p className="text-xs text-muted mt-1">
            Reorder, show, or hide book sections. Hidden sections stay in edit mode only.
          </p>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto px-3 py-2 space-y-1">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2 py-2",
                !item.visible && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted shrink-0" />
              <span className="flex-1 text-sm truncate">{item.label}</span>
              <button
                type="button"
                onClick={() => toggleVisible(index)}
                className="p-1.5 rounded-lg hover:bg-cream"
                aria-label={item.visible ? "Hide section" : "Show section"}
              >
                {item.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="p-1.5 rounded-lg hover:bg-cream disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                className="p-1.5 rounded-lg hover:bg-cream disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setItems(sections);
              setOpen(false);
            }}
            className="px-4 py-2 text-sm rounded-xl hover:bg-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function buildSectionEditorState(
  dbSections: { id: string; type: string; title: string | null; order: number; visible: boolean }[]
): SectionState[] {
  return [...dbSections]
    .sort((a, b) => a.order - b.order)
    .map((db) => {
      const ui = YEARBOOK_SECTIONS.find((s) => s.sectionType === db.type);
      return {
        id: db.id,
        sectionId: ui?.id ?? db.type.toLowerCase(),
        label: db.title ?? ui?.label ?? db.type,
        order: db.order,
        visible: db.visible,
      };
    });
}
