"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Image as ImageIcon, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface MediaUploadProps {
  childId: string;
  yearbookId: string;
  milestoneId?: string;
  timelineEntryId?: string;
  onUploaded?: () => void;
  className?: string;
}

export function MediaUpload({
  childId,
  yearbookId,
  milestoneId,
  timelineEntryId,
  onUploaded,
  className,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Subiendo ${i + 1}/${files.length}: ${file.name}`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("childId", childId);
      formData.append("yearbookId", yearbookId);
      if (milestoneId) formData.append("milestoneId", milestoneId);
      if (timelineEntryId) formData.append("timelineEntryId", timelineEntryId);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al subir");
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setProgress("");
    onUploaded?.();
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          buttonVariants("outline", "sm"),
          "w-full border-dashed py-6 flex-col gap-2 h-auto",
          uploading && "opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
        <span className="text-sm">
          {uploading ? progress : "Subir fotos o videos"}
        </span>
        <span className="text-xs text-muted font-normal flex items-center gap-3">
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Fotos
          </span>
          <span className="flex items-center gap-1">
            <Film className="h-3 w-3" /> Videos
          </span>
        </span>
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
