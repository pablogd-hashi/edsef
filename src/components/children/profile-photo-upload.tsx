"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ProfilePhotoUpload({
  childId,
  name,
  themeColor,
  currentPhotoUrl,
  canEdit = false,
  size = "xl",
}: {
  childId: string;
  name: string;
  themeColor: string;
  currentPhotoUrl?: string | null;
  canEdit?: boolean;
  size?: "lg" | "xl";
}) {
  const inputId = useId();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? currentPhotoUrl ?? null;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo (JPG, PNG, HEIC…)");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Photo too large (max 20MB)");
      return;
    }

    setError("");
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("childId", childId);

      const uploadRes = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? "Upload failed");
      }

      const patchRes = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhotoId: uploadData.id }),
      });
      if (!patchRes.ok) {
        const patchData = await patchRes.json();
        throw new Error(patchData.error ?? "Failed to save profile photo");
      }

      router.refresh();
    } catch (e) {
      setPreviewUrl(null);
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <Avatar name={name} color={themeColor} size={size} src={displayUrl} />

      {canEdit && (
        <>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-foreground text-background shadow-md transition-opacity hover:opacity-90",
              uploading && "pointer-events-none opacity-60"
            )}
            aria-label="Change profile photo"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </label>
        </>
      )}

      {error && (
        <p className="absolute left-0 top-full mt-2 w-48 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
