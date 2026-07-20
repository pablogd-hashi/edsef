"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getMonthAbbrev } from "@/lib/age";
import { MapPin, ChevronDown } from "lucide-react";
import { MilestoneMediaGallery } from "@/components/yearbook/milestone-media";
import { MediaUpload } from "@/components/yearbook/media-upload";

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

export function InteractiveTimeline({
  items,
  childId,
  yearbookId,
  canEdit = false,
}: {
  items: TimelineItem[];
  childId: string;
  yearbookId: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const active = items.find((i) => i.id === activeId);

  const months = Array.from(
    new Set(items.map((i) => i.month).filter(Boolean) as number[])
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div className="timeline-scroll flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {months.map((month) => {
          const monthItems = items.filter((i) => i.month === month);
          const isActive = monthItems.some((i) => i.id === activeId);
          return (
            <button
              key={month}
              onClick={() => setActiveId(monthItems[0].id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-cream text-muted hover:bg-border-light hover:text-foreground"
              )}
            >
              {getMonthAbbrev(month)}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-accent via-border to-transparent" />

        <div className="space-y-1">
          {items.map((item, index) => {
            const isActive = item.id === activeId;
            const date = new Date(item.eventDate);

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => setActiveId(isActive ? null : item.id)}
                  className={cn(
                    "w-full flex items-start gap-4 rounded-xl p-3 text-left transition-all duration-200",
                    isActive ? "bg-cream" : "hover:bg-cream/50"
                  )}
                >
                  <div
                    className={cn(
                      "relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "border-accent bg-accent text-white scale-110"
                        : "border-border bg-card text-muted"
                    )}
                  >
                    <span className="text-xs font-medium">
                      {item.month ? getMonthAbbrev(item.month).slice(0, 1) : index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <time className="text-xs text-muted-light uppercase tracking-wider">
                        {date.toLocaleDateString("es", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                      {item.ageLabel && (
                        <span className="text-xs text-accent-dark font-medium">
                          · {item.ageLabel}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "font-medium mt-0.5 transition-colors",
                        isActive ? "text-foreground" : "text-muted"
                      )}
                    >
                      {item.title}
                    </p>
                  </div>

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-light shrink-0 mt-2 transition-transform duration-200",
                      isActive && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-14 pr-3 pb-4">
                        {item.description && (
                          <p className="text-muted leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {item.location && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-accent-dark">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.location.name}
                            {item.location.city && `, ${item.location.city}`}
                          </p>
                        )}
                        <MilestoneMediaGallery media={item.media ?? []} />
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {active && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-accent/20 bg-gradient-to-br from-cream to-card p-6 shadow-[var(--warm-shadow)]"
        >
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-2">
            Destacado
          </p>
          <h3 className="font-editorial text-2xl">{active.title}</h3>
          {active.description && (
            <p className="mt-2 text-muted leading-relaxed">{active.description}</p>
          )}
          <MilestoneMediaGallery media={active.media ?? []} />
        </motion.div>
      )}
    </div>
  );
}
