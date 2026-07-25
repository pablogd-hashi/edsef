"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import type { Prisma } from "@prisma/client";
import { Bold, Italic, Link2, List, Heading2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isTiptapJson, toEditorContent } from "@/lib/rich-text";

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

export function RichTextEditor({
  value,
  onSave,
  canEdit,
  placeholder = "Write here…",
  className,
  outputFormat = "html",
}: RichTextEditorProps) {
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-accent-dark underline" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorContent(value),
    editable: canEdit,
    immediatelyRender: false,
    onBlur: ({ editor: ed }) => {
      void handleSave(ed.getJSON(), ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || !value) return;
    const next = toEditorContent(value);
    if (typeof next === "string") {
      if (editor.getHTML() !== next) editor.commands.setContent(next);
    } else if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) {
      editor.commands.setContent(next);
    }
  }, [value, editor]);

  async function handleSave(json: Prisma.JsonObject, html: string) {
    const output = outputFormat === "tiptap" ? json : html;
    const prev = outputFormat === "tiptap"
      ? (isTiptapJson(value) ? JSON.stringify(value) : "")
      : (typeof value === "string" ? value : "");
    const next = outputFormat === "tiptap" ? JSON.stringify(output) : (output as string);
    if (next === prev) return;

    setSaving(true);
    try {
      await onSave(output);
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return null;
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
      </div>
      <EditorContent
        editor={editor}
        className="prose-yearbook-editor px-4 py-3 min-h-[100px] text-foreground leading-relaxed [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
