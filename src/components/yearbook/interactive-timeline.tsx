"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getMonthAbbrev, getMonthName } from "@/lib/age";
import { MapPin, ImageIcon } from "lucide-react";
import { MilestoneMediaGallery } from "@/components/yearbook/milestone-media";
import { MediaUpload } from "@/components/yearbook/media-upload";
import { EditableField } from "@/components/ui/editable-field";
import { TimelineAddEvent } from "@/components/yearbook/timeline-add-event";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string | null;
  eventDate: Date | string;
  month?: number | null;
  ageLabel?: string | null;
  location?: { name: string; city?: string | null } | null;
  media?: { media: { id: string; type: string; title?: string | null } }[];
}

type MediaRef = { id: string; type: string; title?: string | null };

async function patchTimeline(id: string, data: Record<string, string>) {
  const res = await fetch(`/api/timeline/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to save");
  }
}

function collectMonthMedia(items: TimelineItem[]): MediaRef[] {
  const seen = new Set<string>();
  const out: MediaRef[] = [];
  for (const item of items) {
    for (const { media } of item.media ?? []) {
      if (!seen.has(media.id)) {
        seen.add(media.id);
        out.push(media);
      }
    }
  }
  return out;
}

function MediaThumb({ media, className }: { media: MediaRef; className?: string }) {
  const src =
    media.type === "VIDEO"
      ? `/api/media/${media.id}/file?variant=original`
      : `/api/media/${media.id}/file?variant=web`;

  if (media.type === "VIDEO") {
    return (
      <video
        src={src}
        className={cn("h-full w-full object-cover", className)}
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={media.title ?? ""} className={cn("h-full w-full object-cover", className)} />
  );
}

function MonthPreviewGrid({ media }: { media: MediaRef[] }) {
  if (!media.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream/80 text-muted-light">
        <ImageIcon className="h-5 w-5 opacity-40" />
      </div>
    );
  }

  const preview = media.slice(0, 4);
  const count = preview.length;

  if (count === 1) {
    return (
      <div className="h-full w-full overflow-hidden rounded-lg">
        <MediaThumb media={preview[0]} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid h-full w-full gap-0.5 overflow-hidden rounded-lg",
        count === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"
      )}
    >
      {preview.map((m) => (
        <div key={m.id} className="relative min-h-0 overflow-hidden">
          <MediaThumb media={m} />
        </div>
      ))}
    </div>
  );
}

export function InteractiveTimeline({
  items,
  childId,
  yearbookId,
  canEdit = false,
  periodStart,
  periodEnd,
}: {
  items: TimelineItem[];
  childId: string;
  yearbookId: string;
  canEdit?: boolean;
  periodStart?: Date | string | null;
  periodEnd?: Date | string | null;
}) {
  const router = useRouter();

  const months = useMemo(() => {
    const grouped = new Map<number, TimelineItem[]>();
    for (const item of items) {
      const m = item.month ?? new Date(item.eventDate).getMonth() + 1;
      if (!grouped.has(m)) grouped.set(m, []);
      grouped.get(m)!.push(item);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([month, monthItems]) => ({
        month,
        items: monthItems,
        media: collectMonthMedia(monthItems),
      }));
  }, [items]);

  const [activeMonth, setActiveMonth] = useState(months[0]?.month ?? null);
  const activeGroup = months.find((g) => g.month === activeMonth);

  const periodEndDate = periodEnd ? new Date(periodEnd) : new Date();
  const defaultYear = periodEndDate.getFullYear();

  return (
    <div className="space-y-10">
      {canEdit && (
        <TimelineAddEvent
          childId={childId}
          yearbookId={yearbookId}
          periodStart={periodStart}
          periodEnd={periodEnd}
          defaultMonth={activeMonth ?? undefined}
          defaultYear={defaultYear}
        />
      )}

      {months.length === 0 ? (
        canEdit ? (
          <p className="text-center text-muted text-sm py-6">
            Pick a date above and save the first moment of the year.
          </p>
        ) : (
          <p className="text-center text-muted text-sm py-6">
            No timeline moments yet.
          </p>
        )
      ) : (
        <>
      {/* Horizontal month timeline with previews */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-[calc(50%+28px)] h-px bg-gradient-to-r from-transparent via-border to-transparent pointer-events-none hidden sm:block" />

        <div className="timeline-scroll flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
          {months.map(({ month, media, items: monthItems }) => {
            const isActive = month === activeMonth;
            return (
              <button
                key={month}
                type="button"
                onClick={() => setActiveMonth(month)}
                className={cn(
                  "snap-start shrink-0 flex flex-col items-center gap-3 w-[140px] sm:w-[160px] transition-all duration-200 touch-manipulation",
                  isActive && "scale-[1.02]"
                )}
              >
                <div
                  className={cn(
                    "relative w-full aspect-[4/5] rounded-2xl overflow-hidden border-2 shadow-sm transition-all",
                    isActive
                      ? "border-accent ring-2 ring-accent/20 shadow-[var(--warm-shadow)]"
                      : "border-border-light hover:border-accent/40"
                  )}
                >
                  <MonthPreviewGrid media={media} />
                  {media.length > 4 && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white font-medium">
                      +{media.length - 4}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider font-medium",
                      isActive ? "text-accent-dark" : "text-muted"
                    )}
                  >
                    {getMonthAbbrev(month)}
                  </p>
                  <p className="text-[11px] text-muted-light capitalize mt-0.5">
                    {getMonthName(month)}
                  </p>
                  <p className="text-[10px] text-muted-light mt-1">
                    {monthItems.length} {monthItems.length === 1 ? "moment" : "moments"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events for selected month */}
      <AnimatePresence mode="wait">
        {activeGroup && (
          <motion.div
            key={activeGroup.month}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <h3 className="font-editorial text-2xl capitalize text-foreground">
              {getMonthName(activeGroup.month)}
            </h3>

            <div className="relative space-y-8 pl-6 sm:pl-8">
              <div className="absolute left-[11px] sm:left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/60 via-border to-transparent" />

              {activeGroup.items.map((item) => {
                const date = new Date(item.eventDate);
                return (
                  <article key={item.id} className="relative">
                    <div className="absolute -left-6 sm:-left-8 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-accent bg-card z-10">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    </div>

                    <div className="rounded-2xl border border-border-light bg-card p-5 sm:p-6">
                      <time className="text-xs text-muted-light uppercase tracking-wider">
                        {date.toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {item.ageLabel && (
                          <span className="text-accent-dark font-medium ml-2">
                            · {item.ageLabel}
                          </span>
                        )}
                      </time>

                      <EditableField
                        value={item.title}
                        canEdit={canEdit}
                        as="h4"
                        placeholder="Title"
                        className="font-medium text-lg mt-2"
                        onSave={async (title) => {
                          await patchTimeline(item.id, { title });
                          router.refresh();
                        }}
                      />

                      <EditableField
                        value={item.description ?? ""}
                        canEdit={canEdit}
                        multiline
                        as="p"
                        placeholder="Moment description"
                        className="text-muted leading-relaxed mt-2"
                        onSave={async (description) => {
                          await patchTimeline(item.id, { description });
                          router.refresh();
                        }}
                      />

                      {item.location && (
                        <p className="mt-3 flex items-center gap-1.5 text-sm text-accent-dark">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {item.location.name}
                          {item.location.city && `, ${item.location.city}`}
                        </p>
                      )}

                      <MilestoneMediaGallery
                        media={item.media ?? []}
                        canEdit={canEdit}
                        timelineEntryId={item.id}
                      />

                      {canEdit && (
                        <MediaUpload
                          className="mt-4"
                          childId={childId}
                          yearbookId={yearbookId}
                          timelineEntryId={item.id}
                          onUploaded={() => router.refresh()}
                        />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
