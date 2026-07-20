"use client";

import { YEARBOOK_SECTIONS } from "@/lib/import/types";
import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { CoverHero, SummarySection } from "./cover-hero";
import { MilestoneGrid } from "./milestone-grid";
import { InteractiveTimeline } from "./interactive-timeline";
import { StoryReader } from "./story-reader";
import { MusicPlaylist } from "./music-playlist";
import { ParentNotes } from "./parent-notes";
import { FadeIn, SectionTitle } from "@/components/ui/motion";
import type { Prisma, TimelineCategory } from "@prisma/client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface YearbookViewerProps {
  yearbook: YearbookWithRelations;
  mode?: "edit" | "preview";
  canEdit?: boolean;
}

function filterTimeline(
  items: YearbookWithRelations["timeline"],
  categories: TimelineCategory[]
) {
  return items
    .filter((t) => categories.includes(t.category))
    .map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      eventDate: t.eventDate,
      month: t.month,
      ageLabel: t.ageLabel,
      location: t.location,
      media: t.media,
    }));
}

function VideoLinks({
  items,
}: {
  items: { id: string; title: string; description?: string | null }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.description ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-accent-light transition-colors"
        >
          <ExternalLink className="h-4 w-4 text-accent-dark shrink-0" />
          <span className="text-sm font-medium">{item.title}</span>
        </a>
      ))}
    </div>
  );
}

export function YearbookViewer({
  yearbook,
  mode = "edit",
  canEdit: canEditProp,
}: YearbookViewerProps) {
  const canEdit = canEditProp ?? mode === "edit";
  const childId = yearbook.childId;
  const yearbookId = yearbook.id;
  const [activeSection, setActiveSection] = useState("cover");

  const summary = yearbook.summaryContent as Record<string, unknown> | null;
  const hasSummary =
    summary &&
    (summary.context ||
      summary.location ||
      (Array.isArray(summary.highlights) && summary.highlights.length > 0));

  const videos = filterTimeline(yearbook.timeline, ["VIDEO"]);
  const beforeBirth = filterTimeline(yearbook.timeline, ["PARENTS_BEFORE_BIRTH"]);
  const thisYear = filterTimeline(yearbook.timeline, [
    "PARENTS_DURING_YEAR",
    "GENERAL",
  ]);

  const sectionContent: Record<string, boolean> = {
    cover: true,
    summary: !!hasSummary,
    milestones: yearbook.milestones.length > 0,
    music: yearbook.music.length > 0,
    stories: yearbook.stories.length > 0,
    videos: videos.length > 0,
    notes: yearbook.parentNotes.length > 0,
    "before-birth": beforeBirth.length > 0,
    "this-year": thisYear.length > 0 || canEdit,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace("section-", ""));
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    for (const s of YEARBOOK_SECTIONS) {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn(mode === "preview" && "preview-mode")}>
      <nav className="sticky top-[57px] z-40 border-b border-border/60 glass">
        <div className="mx-auto max-w-4xl overflow-x-auto timeline-scroll px-4">
          <div className="flex gap-1 py-2">
            {YEARBOOK_SECTIONS.map((s) => {
              if (!sectionContent[s.id]) return null;
              return (
                <a
                  key={s.id}
                  href={`#section-${s.id}`}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm transition-all duration-200",
                    activeSection === s.id
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground hover:bg-cream"
                  )}
                >
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-8 md:py-12 space-y-20 md:space-y-28">
        <section id="section-cover">
          <CoverHero yearbook={yearbook} immersive={mode === "preview"} />
        </section>

        {hasSummary && (
          <section id="section-summary">
            <FadeIn>
              <SectionTitle subtitle="The year at a glance">Summary</SectionTitle>
              <SummarySection content={summary} />
            </FadeIn>
          </section>
        )}

        {yearbook.milestones.length > 0 && (
          <section id="section-milestones">
            <FadeIn>
              <SectionTitle subtitle="What you achieved this year">
                Milestones
              </SectionTitle>
              <MilestoneGrid
                milestones={yearbook.milestones.map((m) => ({
                  id: m.id,
                  title: m.title,
                  description: m.description,
                  ageLabel: m.ageLabel,
                  location: m.location,
                  media: m.media,
                }))}
                childId={childId}
                yearbookId={yearbookId}
                canEdit={canEdit}
              />
            </FadeIn>
          </section>
        )}

        {yearbook.music.length > 0 && (
          <section id="section-music">
            <FadeIn>
              <SectionTitle subtitle="Songs that marked the year">Music</SectionTitle>
              <MusicPlaylist tracks={yearbook.music} />
            </FadeIn>
          </section>
        )}

        {yearbook.stories.length > 0 && (
          <section id="section-stories">
            <FadeIn>
              <SectionTitle subtitle="Stories worth telling">Stories</SectionTitle>
              <div className="space-y-16">
                {yearbook.stories.map((story) => (
                  <StoryReader
                    key={story.id}
                    id={story.id}
                    title={story.title}
                    content={story.content as Prisma.JsonValue}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            </FadeIn>
          </section>
        )}

        {videos.length > 0 && (
          <section id="section-videos">
            <FadeIn>
              <SectionTitle subtitle="Videos from this year">Videos</SectionTitle>
              <VideoLinks items={videos} />
            </FadeIn>
          </section>
        )}

        {yearbook.parentNotes.length > 0 && (
          <section id="section-notes">
            <FadeIn>
              <SectionTitle subtitle="Notes from mom and dad">Parent notes</SectionTitle>
              <ParentNotes notes={yearbook.parentNotes} canEdit={canEdit} />
            </FadeIn>
          </section>
        )}

        {beforeBirth.length > 0 && (
          <section id="section-before-birth">
            <FadeIn>
              <SectionTitle subtitle="What mom and dad were up to before you arrived">
                Before you were born
              </SectionTitle>
              <InteractiveTimeline
                items={beforeBirth}
                childId={childId}
                yearbookId={yearbookId}
                canEdit={canEdit}
                periodStart={yearbook.periodStart}
                periodEnd={yearbook.periodEnd}
              />
            </FadeIn>
          </section>
        )}

        {(thisYear.length > 0 || canEdit) && (
          <section id="section-this-year">
            <FadeIn>
              <SectionTitle subtitle="Month by month — family life this year">
                This year
              </SectionTitle>
              <InteractiveTimeline
                items={thisYear}
                childId={childId}
                yearbookId={yearbookId}
                canEdit={canEdit}
                periodStart={yearbook.periodStart}
                periodEnd={yearbook.periodEnd}
              />
            </FadeIn>
          </section>
        )}
      </div>
    </div>
  );
}
