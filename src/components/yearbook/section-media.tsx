"use client";

import { MediaGallery } from "@/components/yearbook/media-gallery";
import { MediaUpload } from "@/components/yearbook/media-upload";
import type { SectionType } from "@prisma/client";

export interface SectionMediaItem {
  id: string;
  type: string;
  title?: string | null;
  width?: number | null;
  height?: number | null;
}

export function SectionMediaBlock({
  media,
  childId,
  yearbookId,
  sectionType,
  canEdit,
}: {
  media: { media: SectionMediaItem }[];
  childId: string;
  yearbookId: string;
  sectionType: SectionType;
  canEdit: boolean;
}) {
  return (
    <div className={media.length > 0 || canEdit ? "mt-6" : ""}>
      <MediaGallery
        media={media}
        canEdit={canEdit}
        sectionType={sectionType}
        yearbookId={yearbookId}
      />
      {canEdit && (
        <MediaUpload
          className="mt-4"
          childId={childId}
          yearbookId={yearbookId}
          sectionType={sectionType}
        />
      )}
    </div>
  );
}
