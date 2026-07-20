export async function uploadMediaFiles(
  files: File[],
  params: {
    childId: string;
    yearbookId: string;
    milestoneId?: string;
    timelineEntryId?: string;
  }
): Promise<void> {
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("childId", params.childId);
    formData.append("yearbookId", params.yearbookId);
    if (params.milestoneId) formData.append("milestoneId", params.milestoneId);
    if (params.timelineEntryId) formData.append("timelineEntryId", params.timelineEntryId);

    const res = await fetch("/api/media/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Error al subir archivo");
    }
  }
}

export function validateMediaFile(file: File): string | null {
  const maxVideo = 500 * 1024 * 1024;
  const maxImage = 20 * 1024 * 1024;
  const isVideo =
    file.type.startsWith("video/") || /\.(mov|mp4|m4v|webm)$/i.test(file.name);
  const limit = isVideo ? maxVideo : maxImage;
  if (file.size > limit) {
    return isVideo
      ? `Video demasiado grande (máx ${Math.round(maxVideo / 1024 / 1024)}MB)`
      : `Imagen demasiado grande (máx ${Math.round(maxImage / 1024 / 1024)}MB)`;
  }
  return null;
}
