"use client";

import { YEARBOOK_SECTIONS } from "@/lib/yearbook/sections";
import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { CoverHero, SummarySection } from "./cover-hero";
import { MilestoneGrid } from "./milestone-grid";
import { InteractiveTimeline } from "./interactive-timeline";
import { StoryReader } from "./story-reader";
import { ParentNotes } from "./parent-notes";
import { SectionMediaBlock } from "./section-media";
import {
  deriveSummaryFromYearbook,
  hasDerivedOrManualSummary,
  type ManualSummaryContent,
} from "@/lib/yearbook/derive-summary";
import {
  MilestoneAdd,
  StoryAdd,
  MusicSection,
  VideoAdd,
  VideoFileAdd,
  ParentNoteAdd,
} from "./section-add-forms";
import { SectionEmpty } from "./section-empty";
import { FadeIn, SectionTitle } from "@/components/ui/motion";
import type { Prisma, SectionType, TimelineCategory } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import {
  computeYearbookPeriod,
  formatYearbookYears,
} from "@/lib/yearbook/period";

interface YearbookViewerProps {
  yearbook: YearbookWithRelations;
  mode?: "edit" | "preview";
  canEdit?: boolean;
}

function getSectionMedia(yearbook: YearbookWithRelations, sectionType: SectionType) {
  return yearbook.attachments
    .filter((a) => a.sectionType === sectionType)
    .map((a) => ({
      media: {
        id: a.media.id,
        type: a.media.type,
        title: a.media.title,
        width: a.media.width,
        height: a.media.height,
      },
    }));
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

function VideoSection({
  linkItems,
  mediaItems,
  canEdit,
  childId,
  yearbookId,
}: {
  linkItems: { id: string; title: string; description?: string | null }[];
  mediaItems: { id: string; title: string; media: { media: { id: string; type: string } }[] }[];
  canEdit: boolean;
  childId: string;
  yearbookId: string;
}) {
  return (
    <div className="space-y-6">
      {linkItems.length > 0 && <VideoLinks items={linkItems} />}
      {mediaItems.map((item) => (
        <div key={item.id} className="rounded-xl border border-border bg-card p-4">
          <p className="font-medium mb-3">{item.title}</p>
          <div className="space-y-4 max-w-3xl">
            {item.media.map(({ media: m }) =>
              m.type === "VIDEO" ? (
                <video
                  key={m.id}
                  src={`/api/media/${m.id}/file?variant=original`}
                  controls
                  className="w-full rounded-xl aspect-video object-contain bg-black"
                  preload="metadata"
                />
              ) : null
            )}
          </div>
        </div>
      ))}
      {canEdit && (
        <div className="space-y-3">
          <VideoAdd childId={childId} yearbookId={yearbookId} />
          <VideoFileAdd childId={childId} yearbookId={yearbookId} />
        </div>
      )}
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

  const manualSummary = yearbook.summaryContent as ManualSummaryContent | null;
  const derivedSummary = useMemo(() => deriveSummaryFromYearbook(yearbook), [yearbook]);
  const hasSummary = hasDerivedOrManualSummary(manualSummary, derivedSummary);
  const calendarYears = useMemo(() => {
    if (yearbook.periodStart && yearbook.periodEnd) {
      return formatYearbookYears(new Date(yearbook.periodStart), new Date(yearbook.periodEnd));
    }
    if (yearbook.yearNumber) {
      const period = computeYearbookPeriod(
        new Date(yearbook.child.birthDate),
        yearbook.yearNumber
      );
      return formatYearbookYears(period.periodStart, period.periodEnd);
    }
    return null;
  }, [yearbook]);
  const summaryMedia = getSectionMedia(yearbook, "SUMMARY");
  const musicMedia = getSectionMedia(yearbook, "MUSIC");
  const videosSectionMedia = getSectionMedia(yearbook, "VIDEOS");
  const milestonesSectionMedia = getSectionMedia(yearbook, "MILESTONES");
  const storiesSectionMedia = getSectionMedia(yearbook, "STORIES");
  const notesSectionMedia = getSectionMedia(yearbook, "PARENT_NOTES");
  const timelineSectionMedia = getSectionMedia(yearbook, "TIMELINE");

  const videos = filterTimeline(yearbook.timeline, ["VIDEO"]);
  const videoLinks = videos.filter((v) => v.description?.startsWith("http"));
  const videoUploads = videos.filter((v) => (v.media?.length ?? 0) > 0);
  const beforeBirth = filterTimeline(yearbook.timeline, ["PARENTS_BEFORE_BIRTH"]);
  const thisYear = filterTimeline(yearbook.timeline, ["PARENTS_DURING_YEAR", "GENERAL"]);

  const hasContent: Record<string, boolean> = {
    cover: true,
    summary: hasSummary || summaryMedia.length > 0,
    milestones: yearbook.milestones.length > 0,
    music: yearbook.music.length > 0 || musicMedia.length > 0,
    stories: yearbook.stories.length > 0,
    videos: videoLinks.length > 0 || videoUploads.length > 0 || videosSectionMedia.length > 0,
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
            <CoverHero yearbook={yearbook} immersive={isPreview} canEdit={canEdit} />
          </section>
        );

      case "summary":
        return (
          <section id="section-summary" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              <SummarySection
                manual={manualSummary}
                derived={derivedSummary}
                canEdit={canEdit}
                yearbookId={yearbookId}
                childId={childId}
              />
              {!canEdit && !hasSummary && summaryMedia.length === 0 && (
                <SectionEmpty hint={meta.emptyHint} />
              )}
              <SectionMediaBlock
                media={summaryMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="SUMMARY"
                canEdit={canEdit}
              />
            </FadeIn>
          </section>
        );

      case "milestones":
        return (
          <section id="section-milestones" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {yearbook.milestones.length > 0 && (
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
              )}
              {canEdit && (
                <div className={yearbook.milestones.length > 0 ? "mt-6" : ""}>
                  <MilestoneAdd childId={childId} yearbookId={yearbookId} />
                </div>
              )}
              {!canEdit && yearbook.milestones.length === 0 && milestonesSectionMedia.length === 0 && (
                <SectionEmpty hint={meta.emptyHint} />
              )}
              <SectionMediaBlock
                media={milestonesSectionMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="MILESTONES"
                canEdit={canEdit}
              />
            </FadeIn>
          </section>
        );

      case "music":
        return (
          <section id="section-music" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              <MusicSection
                tracks={yearbook.music}
                childId={childId}
                yearbookId={yearbookId}
                canEdit={canEdit}
              />
              <SectionMediaBlock
                media={musicMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="MUSIC"
                canEdit={canEdit}
              />
              {!canEdit && yearbook.music.length === 0 && musicMedia.length === 0 && (
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
              {yearbook.stories.length > 0 && (
                <div className="space-y-16">
                  {yearbook.stories.map((story) => (
                    <StoryReader
                      key={story.id}
                      id={story.id}
                      title={story.title}
                      content={story.content as Prisma.JsonValue}
                      media={story.attachments.map((a) => ({
                        media: {
                          id: a.media.id,
                          type: a.media.type,
                          title: a.media.title,
                          width: a.media.width,
                          height: a.media.height,
                        },
                      }))}
                      childId={childId}
                      yearbookId={yearbookId}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              )}
              {canEdit && (
                <div className={yearbook.stories.length > 0 ? "mt-8" : ""}>
                  <StoryAdd childId={childId} yearbookId={yearbookId} />
                </div>
              )}
              {!canEdit && yearbook.stories.length === 0 && storiesSectionMedia.length === 0 && (
                <SectionEmpty hint={meta.emptyHint} />
              )}
              <SectionMediaBlock
                media={storiesSectionMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="STORIES"
                canEdit={canEdit}
              />
            </FadeIn>
          </section>
        );

      case "videos":
        return (
          <section id="section-videos" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {(videoLinks.length > 0 || videoUploads.length > 0 || canEdit) ? (
                <VideoSection
                  linkItems={videoLinks}
                  mediaItems={videoUploads}
                  canEdit={canEdit}
                  childId={childId}
                  yearbookId={yearbookId}
                />
              ) : (
                <SectionEmpty hint={meta.emptyHint} />
              )}
              <SectionMediaBlock
                media={videosSectionMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="VIDEOS"
                canEdit={canEdit}
              />
            </FadeIn>
          </section>
        );

      case "notes":
        return (
          <section id="section-notes" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              {yearbook.parentNotes.length > 0 && (
                <ParentNotes
                  notes={yearbook.parentNotes.map((n) => ({
                    id: n.id,
                    author: n.author,
                    content: n.content,
                    noteDate: n.noteDate,
                    media: n.attachments.map((a) => ({
                      media: {
                        id: a.media.id,
                        type: a.media.type,
                        title: a.media.title,
                        width: a.media.width,
                        height: a.media.height,
                      },
                    })),
                  }))}
                  childId={childId}
                  yearbookId={yearbookId}
                  canEdit={canEdit}
                />
              )}
              {canEdit && (
                <div className={yearbook.parentNotes.length > 0 ? "mt-6" : ""}>
                  <ParentNoteAdd childId={childId} yearbookId={yearbookId} />
                </div>
              )}
              {!canEdit && yearbook.parentNotes.length === 0 && notesSectionMedia.length === 0 && (
                <SectionEmpty hint={meta.emptyHint} />
              )}
              <SectionMediaBlock
                media={notesSectionMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="PARENT_NOTES"
                canEdit={canEdit}
              />
            </FadeIn>
          </section>
        );

      case "before-birth":
        return (
          <section id="section-before-birth" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              <InteractiveTimeline
                items={beforeBirth}
                childId={childId}
                yearbookId={yearbookId}
                canEdit={canEdit}
                periodStart={yearbook.periodStart}
                periodEnd={yearbook.periodEnd}
                category="PARENTS_BEFORE_BIRTH"
              />
              <SectionMediaBlock
                media={timelineSectionMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="TIMELINE"
                canEdit={canEdit}
              />
            </FadeIn>
          </section>
        );

      case "this-year":
        return (
          <section id="section-this-year" className="book-page">
            <FadeIn>
              <SectionTitle subtitle={meta.subtitle}>{meta.label}</SectionTitle>
              <InteractiveTimeline
                items={thisYear}
                childId={childId}
                yearbookId={yearbookId}
                canEdit={canEdit}
                periodStart={yearbook.periodStart}
                periodEnd={yearbook.periodEnd}
                category="GENERAL"
              />
              <SectionMediaBlock
                media={timelineSectionMedia}
                childId={childId}
                yearbookId={yearbookId}
                sectionType="TIMELINE"
                canEdit={canEdit}
              />
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
        <HorizontalScroll className="mx-auto max-w-4xl px-4">
          <div className="flex gap-1 py-2 min-w-max">
            {calendarYears && isPreview && (
              <span className="shrink-0 self-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-dark mr-1">
                {calendarYears}
              </span>
            )}
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
        </HorizontalScroll>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-8 md:py-12 space-y-0">
        {visibleSections.map((s) => (
          <div key={s.id}>{renderSection(s.id)}</div>
        ))}
      </div>
    </div>
  );
}
