"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { Upload, Loader2, Image as ImageIcon, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface MediaUploadProps {
  childId: string;
  yearbookId: string;
  milestoneId?: string;
  timelineEntryId?: string;
  storyId?: string;
  parentNoteId?: string;
  sectionType?: string;
  onUploaded?: () => void;
  className?: string;
}

/** Wildcards only — file extensions in accept make iOS open Files/Browse instead of Photos */
const ACCEPT_ALL = "image/*,video/*";
const ACCEPT_PHOTOS = "image/*";
const ACCEPT_VIDEOS = "video/*";

function subscribe() {
  return () => {};
}

function getAppleTouchSnapshot() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS;
}

function useAppleTouchDevice() {
  return useSyncExternalStore(subscribe, getAppleTouchSnapshot, () => false);
}

export function MediaUpload({
  childId,
  yearbookId,
  milestoneId,
  timelineEntryId,
  storyId,
  parentNoteId,
  sectionType,
  onUploaded,
  className,
}: MediaUploadProps) {
  const photoInputId = useId();
  const videoInputId = useId();
  const allInputId = useId();
  const isAppleTouch = useAppleTouchDevice();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const maxVideo = 500 * 1024 * 1024;
      const maxImage = 20 * 1024 * 1024;
      const isVideo =
        /\.(mov|mp4|m4v|webm|avi|mkv|3gp)$/i.test(file.name) ||
        file.type.startsWith("video/");
      const isImage =
        /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name) ||
        (file.type.startsWith("image/") && !isVideo);
      const limit = isVideo ? maxVideo : maxImage;
      if (file.size > limit) {
        setError(
          isVideo
            ? `Video too large (max ${Math.round(maxVideo / 1024 / 1024)}MB)`
            : `Image too large (max ${Math.round(maxImage / 1024 / 1024)}MB)`
        );
        setUploading(false);
        return;
      }

      setProgress(`Uploading ${i + 1}/${files.length}: ${file.name || "file"}`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("childId", childId);
      formData.append("yearbookId", yearbookId);
      if (milestoneId) formData.append("milestoneId", milestoneId);
      if (timelineEntryId) formData.append("timelineEntryId", timelineEntryId);
      if (storyId) formData.append("storyId", storyId);
      if (parentNoteId) formData.append("parentNoteId", parentNoteId);
      if (sectionType) formData.append("sectionType", sectionType);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setProgress("");
    onUploaded?.();
  }

  const inputProps = {
    multiple: true as const,
    className: "sr-only" as const,
    disabled: uploading,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
  };

  if (isAppleTouch) {
    return (
      <div className={className}>
        <input id={photoInputId} type="file" accept={ACCEPT_PHOTOS} {...inputProps} />
        <input id={videoInputId} type="file" accept={ACCEPT_VIDEOS} {...inputProps} />

        <div
          className={cn(
            "rounded-xl border border-dashed border-border p-4 space-y-3",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-center px-2">{progress}</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-center text-muted">
                Opens the Apple Photos library
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label
                  htmlFor={photoInputId}
                  className={cn(
                    buttonVariants("outline", "sm"),
                    "flex-col gap-1.5 h-auto py-4 cursor-pointer touch-manipulation"
                  )}
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">Photos</span>
                </label>
                <label
                  htmlFor={videoInputId}
                  className={cn(
                    buttonVariants("outline", "sm"),
                    "flex-col gap-1.5 h-auto py-4 cursor-pointer touch-manipulation"
                  )}
                >
                  <Film className="h-5 w-5" />
                  <span className="text-sm">Videos</span>
                </label>
              </div>
            </>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <input id={allInputId} type="file" accept={ACCEPT_ALL} {...inputProps} />

      <label
        htmlFor={allInputId}
        className={cn(
          buttonVariants("outline", "sm"),
          "w-full border-dashed py-6 flex-col gap-2 h-auto cursor-pointer touch-manipulation min-h-[88px]",
          uploading && "opacity-60 pointer-events-none"
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Upload className="h-5 w-5" />
        )}
        <span className="text-sm text-center px-2">
          {uploading ? progress : "Upload photos or videos"}
        </span>
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
