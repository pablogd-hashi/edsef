"use client";

import { YEARBOOK_SECTIONS } from "@/lib/yearbook/sections";
import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { CoverHero, SummarySection } from "./cover-hero";
import { MilestoneGrid } from "./milestone-grid";
import { InteractiveTimeline } from "./interactive-timeline";
import { StoryReader } from "./story-reader";
import { MusicPlaylist } from "./music-playlist";
import { ParentNotes } from "./parent-notes";
import { SectionEmpty } from "./section-empty";
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
  if (items.length === 0) return null;
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

function sectionVisible(
  id: string,
  hasContent: boolean,
  canEdit: boolean,
  isPreview: boolean
): boolean {
  if (id === "cover") return true;
  if (canEdit && !isPreview) return true;
  return hasContent;
}

export function YearbookViewer({
  yearbook,
  mode = "edit",
  canEdit: canEditProp,
}: YearbookViewerProps) {
  const canEdit = canEditProp ?? mode === "edit";
  const isPreview = mode === "preview";
  const childId = yearbook.childId;
  const yearbookId = yearbook.id;
  const [activeSection, setActiveSection] = useState("cover");

  const summary = yearbook.summaryContent as Record<string, unknown> | null;
  const hasSummary = Boolean(
    summary &&
      (summary.context ||
        summary.location ||
        (Array.isArray(summary.highlights) && summary.highlights.length > 0))
  );

  const videos = filterTimeline(yearbook.timeline, ["VIDEO"]);
  const beforeBirth = filterTimeline(yearbook.timeline, ["PARENTS_BEFORE_BIRTH"]);
  const parentsYear = filterTimeline(yearbook.timeline, ["PARENTS_DURING_YEAR"]);
  const childTimeline = filterTimeline(yearbook.timeline, ["GENERAL"]);

  const hasContent: Record<string, boolean> = {
    cover: true,
    summary: hasSummary,
    highlights: yearbook.milestones.length > 0,
    music: yearbook.music.length > 0,
    stories: yearbook.stories.length > 0,
    videos: videos.length > 0,
    notes: yearbook.parentNotes.length > 0,
    "before-birth": beforeBirth.length > 0,
    "parents-year": parentsYear.length > 0,
    timeline: childTimeline.length > 0,
  };

  const visibleSections = YEARBOOK_SECTIONS.filter((s) =>
    sectionVisible(s.id, hasContent[s.id] ?? false, canEdit, isPreview)
  );

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

    for (const s of visibleSections) {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [visibleSections]);

  const sectionMeta = Object.fromEntries(YEARBOOK_SECTIONS.map((s) => [s.id, s]));

  return (
    <div className={cn(isPreview && "preview-mode")}>
      <nav className="sticky top-[57px] z-40 border-b border-border/60 glass">
        <div className="mx-auto max-w-4xl overflow-x-auto timeline-scroll px-4">
          <div className="flex gap-1 py-2">
            {visibleSections.map((s) => (
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
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-8 md:py-12 space-y-20 md:space-y-28">
        <section id="section-cover">
          <CoverHero yearbook={yearbook} immersive={isPreview} />
        </section>

        {sectionVisible("summary", hasSummary, canEdit, isPreview) && (
          <section id="section-summary">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta.summary.subtitle}>
                {sectionMeta.summary.label}
              </SectionTitle>
              {hasSummary ? (
                <SummarySection content={summary} />
              ) : (
                <SectionEmpty hint={sectionMeta.summary.emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("highlights", hasContent.highlights, canEdit, isPreview) && (
          <section id="section-highlights">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta.highlights.subtitle}>
                {sectionMeta.highlights.label}
              </SectionTitle>
              {yearbook.milestones.length > 0 ? (
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
              ) : (
                <SectionEmpty hint={sectionMeta.highlights.emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("music", hasContent.music, canEdit, isPreview) && (
          <section id="section-music">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta.music.subtitle}>
                {sectionMeta.music.label}
              </SectionTitle>
              {yearbook.music.length > 0 ? (
                <MusicPlaylist tracks={yearbook.music} />
              ) : (
                <SectionEmpty hint={sectionMeta.music.emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("stories", hasContent.stories, canEdit, isPreview) && (
          <section id="section-stories">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta.stories.subtitle}>
                {sectionMeta.stories.label}
              </SectionTitle>
              {yearbook.stories.length > 0 ? (
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
              ) : (
                <SectionEmpty hint={sectionMeta.stories.emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("videos", hasContent.videos, canEdit, isPreview) && (
          <section id="section-videos">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta.videos.subtitle}>
                {sectionMeta.videos.label}
              </SectionTitle>
              {videos.length > 0 ? (
                <VideoLinks items={videos} />
              ) : (
                <SectionEmpty hint={sectionMeta.videos.emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("notes", hasContent.notes, canEdit, isPreview) && (
          <section id="section-notes">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta.notes.subtitle}>
                {sectionMeta.notes.label}
              </SectionTitle>
              {yearbook.parentNotes.length > 0 ? (
                <ParentNotes notes={yearbook.parentNotes} canEdit={canEdit} />
              ) : (
                <SectionEmpty hint={sectionMeta.notes.emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("before-birth", hasContent["before-birth"], canEdit, isPreview) && (
          <section id="section-before-birth">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta["before-birth"].subtitle}>
                {sectionMeta["before-birth"].label}
              </SectionTitle>
              {beforeBirth.length > 0 ? (
                <InteractiveTimeline
                  items={beforeBirth}
                  childId={childId}
                  yearbookId={yearbookId}
                  canEdit={canEdit}
                  periodStart={yearbook.periodStart}
                  periodEnd={yearbook.periodEnd}
                />
              ) : (
                <SectionEmpty hint={sectionMeta["before-birth"].emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("parents-year", hasContent["parents-year"], canEdit, isPreview) && (
          <section id="section-parents-year">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta["parents-year"].subtitle}>
                {sectionMeta["parents-year"].label}
              </SectionTitle>
              {parentsYear.length > 0 ? (
                <InteractiveTimeline
                  items={parentsYear}
                  childId={childId}
                  yearbookId={yearbookId}
                  canEdit={canEdit}
                  periodStart={yearbook.periodStart}
                  periodEnd={yearbook.periodEnd}
                />
              ) : (
                <SectionEmpty hint={sectionMeta["parents-year"].emptyHint} />
              )}
            </FadeIn>
          </section>
        )}

        {sectionVisible("timeline", hasContent.timeline, canEdit, isPreview) && (
          <section id="section-timeline">
            <FadeIn>
              <SectionTitle subtitle={sectionMeta.timeline.subtitle}>
                {sectionMeta.timeline.label}
              </SectionTitle>
              <InteractiveTimeline
                items={childTimeline}
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
