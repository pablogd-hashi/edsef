"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EditableField } from "@/components/ui/editable-field";
import { getYouTubeMusicUrl } from "@/lib/youtube-music";
import { ExternalLink, Music } from "lucide-react";
import { MediaUpload } from "@/components/yearbook/media-upload";

// ─── Milestone add ───────────────────────────────────────────────────────────

export function MilestoneAdd({
  childId,
  yearbookId,
}: {
  childId: string;
  yearbookId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, yearbookId, title: title.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setOpen(false);
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add milestone");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants("outline", "sm"), "w-full border-dashed gap-2 py-4")}>
        <Plus className="h-4 w-4" /> Add highlight
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-accent/30 bg-cream/40 p-5 space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title" className="w-full rounded-xl border border-border px-4 py-3" required />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full rounded-xl border border-border px-4 py-3 resize-none" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={cn(buttonVariants("secondary", "sm"))}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={cn(buttonVariants("ghost", "sm"))}>Cancel</button>
      </div>
    </form>
  );
}

// ─── Story add ─────────────────────────────────────────────────────────────

export function StoryAdd({ childId, yearbookId }: { childId: string; yearbookId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, yearbookId, title: title.trim(), content }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setOpen(false);
      setTitle("");
      setContent("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants("outline", "sm"), "w-full border-dashed gap-2 py-4")}>
        <Plus className="h-4 w-4" /> Add story
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-accent/30 bg-cream/40 p-5 space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story title" className="w-full rounded-xl border border-border px-4 py-3" required />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the story…" rows={6} className="w-full rounded-xl border border-border px-4 py-3 resize-none" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={cn(buttonVariants("secondary", "sm"))}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save story"}</button>
        <button type="button" onClick={() => setOpen(false)} className={cn(buttonVariants("ghost", "sm"))}>Cancel</button>
      </div>
    </form>
  );
}

// ─── Music editor ──────────────────────────────────────────────────────────

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string | null;
  youtubeUrl?: string | null;
}

export function MusicSection({
  tracks,
  childId,
  yearbookId,
  canEdit,
}: {
  tracks: MusicTrack[];
  childId: string;
  yearbookId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function addTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, yearbookId, title: title.trim(), artist: artist.trim() || undefined, youtubeUrl: youtubeUrl.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setTitle("");
      setArtist("");
      setYoutubeUrl("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeTrack(id: string) {
    if (!confirm("Remove this song?")) return;
    await fetch(`/api/music/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function patchTrack(id: string, data: Record<string, string>) {
    const res = await fetch(`/api/music/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {tracks.map((track, i) => {
        const href = getYouTubeMusicUrl(track.title, track.artist, track.youtubeUrl);
        return (
          <div key={track.id} className="group flex items-center gap-4 rounded-xl border border-border-light bg-card p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-dark">
              <Music className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              {canEdit ? (
                <>
                  <EditableField value={track.title} canEdit placeholder="Song title" className="font-medium" onSave={(t) => patchTrack(track.id, { title: t })} />
                  <EditableField value={track.artist ?? ""} canEdit placeholder="Artist" className="text-sm text-muted" onSave={(a) => patchTrack(track.id, { artist: a })} />
                  <EditableField value={track.youtubeUrl ?? ""} canEdit placeholder="YouTube URL (optional)" className="text-xs text-muted-light" onSave={(u) => patchTrack(track.id, { youtubeUrl: u })} />
                </>
              ) : (
                <>
                  <p className="font-medium truncate">{track.title}</p>
                  {track.artist && <p className="text-sm text-muted truncate">{track.artist}</p>}
                </>
              )}
            </div>
            <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted hover:text-accent-dark">
              <ExternalLink className="h-4 w-4" />
            </a>
            {canEdit && (
              <button type="button" onClick={() => removeTrack(track.id)} className="shrink-0 text-muted hover:text-red-600" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <span className="text-sm font-editorial text-muted hidden sm:inline">{String(i + 1).padStart(2, "0")}</span>
          </div>
        );
      })}

      {canEdit && (
        open ? (
          <form onSubmit={addTrack} className="rounded-2xl border border-accent/30 bg-cream/40 p-5 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" className="w-full rounded-xl border border-border px-4 py-3" required />
            <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist (optional)" className="w-full rounded-xl border border-border px-4 py-3" />
            <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="YouTube or YouTube Music URL" className="w-full rounded-xl border border-border px-4 py-3" />
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className={cn(buttonVariants("secondary", "sm"))}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add song"}</button>
              <button type="button" onClick={() => setOpen(false)} className={cn(buttonVariants("ghost", "sm"))}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants("outline", "sm"), "w-full border-dashed gap-2 py-4")}>
            <Plus className="h-4 w-4" /> Add song
          </button>
        )
      )}
    </div>
  );
}

// ─── Video link add ──────────────────────────────────────────────────────────

export function VideoAdd({ childId, yearbookId }: { childId: string; yearbookId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          yearbookId,
          title: title.trim(),
          description: url.trim(),
          eventDate: new Date().toISOString(),
          category: "VIDEO",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setOpen(false);
      setTitle("");
      setUrl("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants("outline", "sm"), "w-full border-dashed gap-2 py-4")}>
        <Plus className="h-4 w-4" /> Add video link
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-accent/30 bg-cream/40 p-5 space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" className="w-full rounded-xl border border-border px-4 py-3" required />
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube, Google Drive, or other URL" type="url" className="w-full rounded-xl border border-border px-4 py-3" required />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={cn(buttonVariants("secondary", "sm"))}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add video"}</button>
        <button type="button" onClick={() => setOpen(false)} className={cn(buttonVariants("ghost", "sm"))}>Cancel</button>
      </div>
    </form>
  );
}

// ─── Video file upload ───────────────────────────────────────────────────────

export function VideoFileAdd({ childId, yearbookId }: { childId: string; yearbookId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function createEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          yearbookId,
          title: title.trim(),
          eventDate: new Date().toISOString(),
          category: "VIDEO",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data = await res.json();
      setEntryId(data.id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  function close() {
    setOpen(false);
    setTitle("");
    setEntryId(null);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants("outline", "sm"), "w-full border-dashed gap-2 py-4")}>
        <Plus className="h-4 w-4" /> Upload video file
      </button>
    );
  }

  if (!entryId) {
    return (
      <form onSubmit={createEntry} className="rounded-2xl border border-accent/30 bg-cream/40 p-5 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" className="w-full rounded-xl border border-border px-4 py-3" required />
        <div className="flex gap-2">
          <button type="submit" disabled={creating} className={cn(buttonVariants("secondary", "sm"))}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to upload"}
          </button>
          <button type="button" onClick={close} className={cn(buttonVariants("ghost", "sm"))}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-cream/40 p-5 space-y-3">
      <p className="text-sm text-muted">Upload one or more video files for &ldquo;{title}&rdquo;</p>
      <MediaUpload
        childId={childId}
        yearbookId={yearbookId}
        timelineEntryId={entryId}
        onUploaded={() => {
          close();
          router.refresh();
        }}
      />
      <button type="button" onClick={close} className={cn(buttonVariants("ghost", "sm"))}>Done</button>
    </div>
  );
}

// ─── Parent note add ─────────────────────────────────────────────────────────

export function ParentNoteAdd({ childId, yearbookId }: { childId: string; yearbookId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState("Mom");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/parent-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, yearbookId, author: author.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setOpen(false);
      setContent("");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonVariants("outline", "sm"), "w-full border-dashed gap-2 py-4")}>
        <Plus className="h-4 w-4" /> Add note
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-accent/30 bg-cream/40 p-5 space-y-3">
      <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (Mom, Dad…)" className="w-full rounded-xl border border-border px-4 py-3" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your note…" rows={4} className="w-full rounded-xl border border-border px-4 py-3 resize-none" required />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={cn(buttonVariants("secondary", "sm"))}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save note"}</button>
        <button type="button" onClick={() => setOpen(false)} className={cn(buttonVariants("ghost", "sm"))}>Cancel</button>
      </div>
    </form>
  );
}
