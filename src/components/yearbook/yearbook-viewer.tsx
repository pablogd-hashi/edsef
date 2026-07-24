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
import type { Prisma, SectionType, TimelineCategory } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
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
  visible: boolean,
  hasContent: boolean,
  canEdit: boolean,
  isPreview: boolean
): boolean {
  if (!visible) return canEdit && !isPreview;
  if (canEdit && !isPreview) return true;
  return hasContent;
}

const UI_TO_SECTION_TYPE: Record<string, SectionType> = {
  cover: "COVER",
  summary: "SUMMARY",
  milestones: "MILESTONES",
  music: "MUSIC",
  stories: "STORIES",
  videos: "VIDEOS",
  notes: "PARENT_NOTES",
  "before-birth": "TIMELINE",
  "this-year": "TIMELINE",
};

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
  const thisYear = filterTimeline(yearbook.timeline, ["PARENTS_DURING_YEAR", "GENERAL"]);

  const hasContent: Record<string, boolean> = {
    cover: true,
    summary: hasSummary,
    milestones: yearbook.milestones.length > 0,
    music: yearbook.music.length > 0,
    stories: yearbook.stories.length > 0,
    videos: videos.length > 0,
    notes: yearbook.parentNotes.length > 0,
    "before-birth": beforeBirth.length > 0,
    "this-year": thisYear.length > 0,
  };

  const orderedSections = useMemo(() => {
    const dbByType = new Map(yearbook.sections.map((s) => [s.type, s]));
    const timelineDb = dbByType.get("TIMELINE");

    return [...YEARBOOK_SECTIONS]
      .map((ui) => {
        if (ui.id === "before-birth" || ui.id === "this-year") {
          return {
            ...ui,
            order:
              (timelineDb?.order ?? 7) + (ui.id === "before-birth" ? -0.1 : 0),
            visible: timelineDb?.visible ?? true,
            label: ui.label,
          };
        }

        const sectionType = UI_TO_SECTION_TYPE[ui.id];
        const db = dbByType.get(sectionType);
        return {
          ...ui,
          order: db?.order ?? YEARBOOK_SECTIONS.indexOf(ui),
          visible: db?.visible ?? true,
          label: db?.title ?? ui.label,
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [yearbook.sections]);

  const visibleSections = orderedSections.filter((s) =>
    sectionVisible(s.visible, hasContent[s.id] ?? false, canEdit, isPreview)
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

  function renderSection(id: string) {
    const meta = orderedSections.find((s) => s.id === id);
    if (!meta) return null;

    switch (id) {
      case "cover":
        return (
          <section id="section-cover" className="book-page">
            <CoverHero yearbook={yearbook} immersive={isPreview} />
          </section>
        );

      case "summary":
        return (
          <section id="section-summary" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {hasSummary ? (
                <SummarySection content={summary} />
              ) : (
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      case "milestones":
        return (
          <section id="section-milestones" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
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
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      case "music":
        return (
          <section id="section-music" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {yearbook.music.length > 0 ? (
                <MusicPlaylist tracks={yearbook.music} />
              ) : (
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      case "stories":
        return (
          <section id="section-stories" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
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
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      case "videos":
        return (
          <section id="section-videos" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {videos.length > 0 ? (
                <VideoLinks items={videos} />
              ) : (
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      case "notes":
        return (
          <section id="section-notes" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {yearbook.parentNotes.length > 0 ? (
                <ParentNotes notes={yearbook.parentNotes} canEdit={canEdit} />
              ) : (
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      case "before-birth":
        return (
          <section id="section-before-birth" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
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
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      case "this-year":
        return (
          <section id="section-this-year" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {thisYear.length > 0 ? (
                <InteractiveTimeline
                  items={thisYear}
                  childId={childId}
                  yearbookId={yearbookId}
                  canEdit={canEdit}
                  periodStart={yearbook.periodStart}
                  periodEnd={yearbook.periodEnd}
                />
              ) : (
                <SectionEmpty hint={meta.emptyHint} />
              )}
            </FadeIn>
          </section>
        );

      default:
        return null;
    }
  }

  return (
    <div className={cn("yearbook-reader", isPreview && "preview-mode")}>
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

      <div className="mx-auto max-w-4xl px-6 py-8 md:py-12 space-y-0">
        {visibleSections.map((s) => (
          <div key={s.id}>{renderSection(s.id)}</div>
        ))}
      </div>
    </div>
  );
}
