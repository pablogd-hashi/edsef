"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Loader2, X, Image as ImageIcon, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { uploadMediaFiles, validateMediaFile } from "@/lib/client/upload-media";
import { getMonthName } from "@/lib/age";

type DateMode = "day" | "month";

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toMonthInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseMonthValue(value: string): Date {
  const [y, m] = value.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function TimelineAddEvent({
  childId,
  yearbookId,
  periodStart,
  periodEnd,
  defaultMonth,
  defaultYear,
  onClose,
}: {
  childId: string;
  yearbookId: string;
  periodStart?: Date | string | null;
  periodEnd?: Date | string | null;
  defaultMonth?: number;
  defaultYear?: number;
  onClose?: () => void;
}) {
  const router = useRouter();
  const photoInputId = useId();
  const videoInputId = useId();
  const titleId = useId();

  const start = periodStart ? new Date(periodStart) : undefined;
  const end = periodEnd ? new Date(periodEnd) : new Date();

  const initialDate = (() => {
    if (defaultMonth && defaultYear) {
      return new Date(defaultYear, defaultMonth - 1, 15);
    }
    if (defaultMonth) {
      return new Date(end.getFullYear(), defaultMonth - 1, 15);
    }
    return end;
  })();

  const [open, setOpen] = useState(false);
  const [dateMode, setDateMode] = useState<DateMode>("day");
  const [dateValue, setDateValue] = useState(toDateInputValue(initialDate));
  const [monthValue, setMonthValue] = useState(toMonthInputValue(initialDate));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const minDate = start ? toDateInputValue(start) : undefined;
  const maxDate = toDateInputValue(end);
  const minMonth = start ? toMonthInputValue(start) : undefined;
  const maxMonth = toMonthInputValue(end);

  function handleOpen() {
    const d = (() => {
      if (defaultMonth && defaultYear) {
        return new Date(defaultYear, defaultMonth - 1, 15);
      }
      if (defaultMonth) {
        return new Date(end.getFullYear(), defaultMonth - 1, 15);
      }
      return initialDate;
    })();
    setDateValue(toDateInputValue(d));
    setMonthValue(toMonthInputValue(d));
    setOpen(true);
    setError("");
  }

  function handleClose() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setPendingFiles([]);
    setError("");
    onClose?.();
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const err = validateMediaFile(files[i]);
      if (err) {
        setError(err);
        return;
      }
      next.push(files[i]);
    }
    setPendingFiles((prev) => [...prev, ...next]);
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Enter a title for this moment");
      return;
    }

    const eventDate =
      dateMode === "month" ? parseMonthValue(monthValue) : new Date(dateValue + "T12:00:00");

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          yearbookId,
          title: title.trim(),
          description: description.trim() || undefined,
          eventDate: eventDate.toISOString(),
          month: eventDate.getMonth() + 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create event");

      if (pendingFiles.length > 0) {
        await uploadMediaFiles(pendingFiles, {
          childId,
          yearbookId,
          timelineEntryId: data.id,
        });
      }

      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={cn(buttonVariants("outline", "sm"), "w-full border-dashed gap-2 py-4 touch-manipulation")}
      >
        <Plus className="h-4 w-4" />
        Add timeline moment
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-accent/30 bg-gradient-to-br from-cream/50 to-card p-5 sm:p-6 shadow-[var(--warm-shadow)] space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-accent-dark">
          <Calendar className="h-5 w-5" />
          <h4 className="font-medium">New moment</h4>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full p-2 hover:bg-cream text-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Day vs month */}
      <div className="flex rounded-full bg-cream p-1 text-sm">
        {(["day", "month"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setDateMode(mode)}
            className={cn(
              "flex-1 rounded-full py-2 px-3 transition-colors touch-manipulation",
              dateMode === mode ? "bg-foreground text-background shadow-sm" : "text-muted"
            )}
          >
            {mode === "day" ? "Exact day" : "Month only"}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor={titleId} className="block text-xs uppercase tracking-wider text-muted mb-2">
          {dateMode === "day" ? "Date" : "Month"}
        </label>
        {dateMode === "day" ? (
          <input
            id={titleId}
            type="date"
            value={dateValue}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-accent/40"
            required
          />
        ) : (
          <input
            type="month"
            value={monthValue}
            min={minMonth}
            max={maxMonth}
            onChange={(e) => setMonthValue(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base touch-manipulation focus:outline-none focus:ring-2 focus:ring-accent/40"
            required
          />
        )}
        {dateMode === "month" && monthValue && (
          <p className="text-xs text-muted mt-1.5 capitalize">
            {getMonthName(parseInt(monthValue.split("-")[1], 10))}{" "}
            {monthValue.split("-")[0]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. First steps at the park"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40"
          required
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-muted mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What happened that day..."
          className="w-full rounded-xl border border-border bg-card px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted mb-2">
          Photos or videos
        </p>
        <input
          id={photoInputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          id={videoInputId}
          type="file"
          accept="video/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 gap-2">
          <label
            htmlFor={photoInputId}
            className={cn(
              buttonVariants("outline", "sm"),
              "flex-col gap-1 h-auto py-3 cursor-pointer touch-manipulation"
            )}
          >
            <ImageIcon className="h-4 w-4" />
            Photos
          </label>
          <label
            htmlFor={videoInputId}
            className={cn(
              buttonVariants("outline", "sm"),
              "flex-col gap-1 h-auto py-3 cursor-pointer touch-manipulation"
            )}
          >
            <Film className="h-4 w-4" />
            Videos
          </label>
        </div>
        {pendingFiles.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {pendingFiles.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 text-sm bg-cream rounded-lg px-3 py-2"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-muted hover:text-foreground shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className={cn(buttonVariants("secondary", "md"), "w-full touch-manipulation")}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save moment"
        )}
      </button>
    </form>
  );
}
