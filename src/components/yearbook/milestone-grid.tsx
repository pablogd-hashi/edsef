"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { MapPin } from "lucide-react";
import { MilestoneMediaGallery } from "@/components/yearbook/milestone-media";
import { MediaUpload } from "@/components/yearbook/media-upload";
import { EditableField } from "@/components/ui/editable-field";

export interface MilestoneItem {
  id: string;
  title: string;
  description?: string | null;
  ageLabel?: string | null;
  location?: { name: string } | null;
  media?: { media: { id: string; type: string; title?: string | null } }[];
}

async function patchMilestone(id: string, data: Record<string, string>) {
  const res = await fetch(`/api/milestones/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to save");
  }
}

export function MilestoneGrid({
  milestones,
  childId,
  yearbookId,
  canEdit = false,
}: {
  milestones: MilestoneItem[];
  childId: string;
  yearbookId: string;
  canEdit?: boolean;
}) {
  const router = useRouter();

  return (
    <StaggerChildren className="grid gap-5 sm:grid-cols-2">
      {milestones.map((m, i) => (
        <StaggerItem key={m.id}>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="group relative h-full rounded-2xl border border-border bg-card p-6 overflow-hidden"
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-[0.06] rounded-full -translate-y-1/2 translate-x-1/2"
              style={{ background: `var(--accent)` }}
            />

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-dark font-editorial text-lg">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <EditableField
                  value={m.ageLabel ?? ""}
                  canEdit={canEdit}
                  placeholder="Etiqueta de edad"
                  className="text-xs uppercase tracking-wider text-accent-dark font-medium mb-1"
                  inputClassName="text-xs uppercase"
                  onSave={async (ageLabel) => {
                    await patchMilestone(m.id, { ageLabel });
                    router.refresh();
                  }}
                />

                <EditableField
                  value={m.title}
                  canEdit={canEdit}
                  as="h3"
                  placeholder="Milestone title"
                  className="font-editorial text-xl leading-snug group-hover:text-accent-dark transition-colors"
                  inputClassName="font-editorial text-lg"
                  onSave={async (title) => {
                    await patchMilestone(m.id, { title });
                    router.refresh();
                  }}
                />

                <EditableField
                  value={m.description ?? ""}
                  canEdit={canEdit}
                  multiline
                  as="p"
                  placeholder="Moment description"
                  className="mt-2 text-sm text-muted leading-relaxed"
                  onSave={async (description) => {
                    await patchMilestone(m.id, { description });
                    router.refresh();
                  }}
                />

                {m.location && (
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-light">
                    <MapPin className="h-3 w-3" />
                    {m.location.name}
                  </p>
                )}

                <MilestoneMediaGallery media={m.media ?? []} canEdit={canEdit} />

                {canEdit && (
                  <MediaUpload
                    className="mt-4"
                    childId={childId}
                    yearbookId={yearbookId}
                    milestoneId={m.id}
                    onUploaded={() => router.refresh()}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerChildren>
  );
}
