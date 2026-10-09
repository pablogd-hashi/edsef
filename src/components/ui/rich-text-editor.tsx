"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import type { Prisma } from "@prisma/client";
import { Bold, Italic, Link2, List, Heading2, Loader2, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { richTextToPlain, toEditorContent } from "@/lib/rich-text";
import { RichTextContent } from "@/components/ui/rich-text-content";

interface RichTextEditorProps {
  value: string | Prisma.JsonValue | null;
  onSave: (value: string | Prisma.JsonObject) => Promise<void>;
  canEdit: boolean;
  placeholder?: string;
  className?: string;
  /** Store as TipTap JSON (stories) or HTML string (milestones, notes, etc.) */
  outputFormat?: "html" | "tiptap";
}

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.preventDefault()}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        active ? "bg-accent text-white" : "text-muted hover:bg-cream hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function hasRichText(value: string | Prisma.JsonValue | null | undefined) {
  return Boolean(richTextToPlain(value)?.trim());
}

function RichTextEditorSurface({
  value,
  onSave,
  placeholder = "Write here…",
  className,
  outputFormat = "html",
}: Omit<RichTextEditorProps, "canEdit">) {
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const focusedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  const outputFormatRef = useRef(outputFormat);
  useEffect(() => {
    onSaveRef.current = onSave;
    outputFormatRef.current = outputFormat;
  }, [onSave, outputFormat]);
  const lastSavedRef = useRef<string | null>(null);

  function snapshot(json: Prisma.JsonObject, html: string) {
    return outputFormatRef.current === "tiptap" ? JSON.stringify(json) : html;
  }

  async function persist(json: Prisma.JsonObject, html: string) {
    const next = snapshot(json, html);
    if (lastSavedRef.current === null) {
      lastSavedRef.current = next;
      return;
    }
    if (next === lastSavedRef.current) return;

    setSaving(true);
    try {
      const output = outputFormatRef.current === "tiptap" ? json : html;
      await onSaveRef.current(output);
      lastSavedRef.current = next;
      setSaveFailed(false);
    } catch {
      // Keep the draft in the editor; lastSavedRef stays stale so a retry re-sends it.
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { class: "text-accent-dark underline" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorContent(value),
    editable: true,
    immediatelyRender: false,
    onCreate: ({ editor: ed }) => {
      lastSavedRef.current = snapshot(ed.getJSON(), ed.getHTML());
    },
    onFocus: () => {
      focusedRef.current = true;
    },
    onBlur: ({ editor: ed, event }) => {
      const next = event.relatedTarget;
      if (next instanceof Node && ed.view.dom.parentElement?.contains(next)) {
        return;
      }
      focusedRef.current = false;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      void persist(ed.getJSON(), ed.getHTML());
    },
    onUpdate: ({ editor: ed }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(ed.getJSON(), ed.getHTML());
      }, 1200);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    requestAnimationFrame(() => editor.commands.focus("end"));
  }, [editor]);

  useEffect(() => {
    if (!editor || value == null || value === "") return;
    if (focusedRef.current) return;
    const next = toEditorContent(value);
    if (typeof next === "string") {
      if (editor.getHTML() !== next) editor.commands.setContent(next);
    } else if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) {
      editor.commands.setContent(next);
    }
  }, [value, editor]);

  if (!editor) return null;

  function setLink() {
    const prev = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className={cn("rounded-xl border border-border-light bg-cream/30 overflow-hidden", className)}>
      <div className="flex items-center gap-0.5 border-b border-border-light px-2 py-1.5 bg-card/80">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted ml-auto" />}
        {!saving && saveFailed && (
          <button
            type="button"
            className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            onClick={() => editor && void persist(editor.getJSON(), editor.getHTML())}
          >
            Not saved – retry
          </button>
        )}
      </div>
      <EditorContent
        editor={editor}
        className="prose-yearbook-editor px-4 py-3 min-h-[100px] text-base text-foreground leading-relaxed [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}

/** TipTap mounts only after tap — yearbooks had dozens of editors repainting on iOS. */
export function RichTextEditor({
  value,
  onSave,
  canEdit,
  placeholder = "Write here…",
  className,
  outputFormat = "html",
}: RichTextEditorProps) {
  const [editing, setEditing] = useState(false);

  if (!canEdit) return null;

  if (!editing) {
    const filled = hasRichText(value);
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "group/rte w-full rounded-xl border border-border-light bg-cream/30 px-4 py-3 text-left touch-manipulation",
          className
        )}
      >
        {filled ? (
          <RichTextContent value={value} />
        ) : (
          <span className="text-muted italic">{placeholder}</span>
        )}
        <span className="mt-2 flex items-center gap-1 text-xs text-muted/70">
          <Pencil className="h-3 w-3" />
          Tap to edit
        </span>
      </button>
    );
  }

  return (
    <RichTextEditorSurface
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      className={className}
      outputFormat={outputFormat}
    />
  );
}
