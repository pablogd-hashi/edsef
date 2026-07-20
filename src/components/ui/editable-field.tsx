"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  canEdit: boolean;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  as?: "span" | "p" | "h3" | "h4";
}

export function EditableField({
  value,
  onSave,
  canEdit,
  multiline = false,
  className,
  inputClassName,
  placeholder = "Tap to edit",
  as: Tag = "span",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(draft.length, draft.length);
      }
    }
  }, [editing, draft.length, multiline]);

  async function save() {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    if (!value) return null;
    const C = Tag;
    return <C className={className}>{value}</C>;
  }

  if (editing) {
    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: () => void save(),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          void save();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      },
      disabled: saving,
      className: cn(
        "w-full rounded-lg border border-accent/30 bg-cream/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation",
        inputClassName
      ),
    };

    return (
      <div className="relative">
        {multiline ? (
          <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} rows={4} {...sharedProps} />
        ) : (
          <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />
        )}
        {saving && (
          <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted" />
        )}
      </div>
    );
  }

  const C = Tag;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "group/edit text-left w-full rounded-lg -mx-1 px-1 py-0.5 hover:bg-cream/60 transition-colors touch-manipulation",
        className
      )}
    >
      <C className={cn("inline", value ? "" : "text-muted italic")}>
        {value || placeholder}
      </C>
      <Pencil className="inline-block ml-1.5 h-3 w-3 text-muted/60 align-middle" />
    </button>
  );
}
