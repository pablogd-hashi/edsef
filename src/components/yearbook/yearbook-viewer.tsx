"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { CoverHero, SummarySection } from "./cover-hero";
import { MilestoneGrid } from "./milestone-grid";
import { InteractiveTimeline } from "./interactive-timeline";
import { StoryReader } from "./story-reader";
import { MusicPlaylist } from "./music-playlist";
import { ParentNotes } from "./parent-notes";
import { FutureLetter } from "./future-letter";
import { FadeIn, SectionTitle } from "@/components/ui/motion";
import type { Prisma } from "@prisma/client";

const SECTIONS = [
  { id: "cover", label: "Portada" },
  { id: "summary", label: "Resumen" },
  { id: "milestones", label: "Hitos" },
  { id: "stories", label: "Historias" },
  { id: "music", label: "Música" },
  { id: "notes", label: "Notas" },
  { id: "timeline", label: "Timeline" },
  { id: "letter", label: "Carta" },
] as const;

interface YearbookViewerProps {
  yearbook: YearbookWithRelations;
  mode?: "edit" | "preview";
}

export function YearbookViewer({ yearbook, mode = "edit" }: YearbookViewerProps) {
  const [activeSection, setActiveSection] = useState("cover");

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

    for (const s of SECTIONS) {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const summary = yearbook.summaryContent as Record<string, unknown> | null;
  const hasSummary = summary && Object.keys(summary).length > 0;

  return (
    <div className={cn(mode === "preview" && "preview-mode")}>
      {/* Sticky section nav */}
      <nav className="sticky top-[57px] z-40 border-b border-border/60 glass">
        <div className="mx-auto max-w-4xl overflow-x-auto timeline-scroll px-4">
          <div className="flex gap-1 py-2">
            {SECTIONS.map((s) => {
              const hasContent =
                s.id === "cover" ||
                (s.id === "summary" && hasSummary) ||
                (s.id === "milestones" && yearbook.milestones.length > 0) ||
                (s.id === "stories" && yearbook.stories.length > 0) ||
                (s.id === "music" && yearbook.music.length > 0) ||
                (s.id === "notes" && yearbook.parentNotes.length > 0) ||
                (s.id === "timeline" && yearbook.timeline.length > 0) ||
                (s.id === "letter" && yearbook.futureLetter);

              if (!hasContent) return null;

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
        {/* Cover */}
        <section id="section-cover">
          <CoverHero yearbook={yearbook} immersive={mode === "preview"} />
        </section>

        {/* Summary */}
        {hasSummary && (
          <section id="section-summary">
            <FadeIn>
              <SectionTitle subtitle="Un vistazo al año">
                Resumen
              </SectionTitle>
              <SummarySection content={summary} />
            </FadeIn>
          </section>
        )}

        {/* Milestones */}
        {yearbook.milestones.length > 0 && (
          <section id="section-milestones">
            <FadeIn>
              <SectionTitle subtitle="Los momentos que marcaron el camino">
                Hitos
              </SectionTitle>
              <MilestoneGrid
                milestones={yearbook.milestones.map((m) => ({
                  id: m.id,
                  title: m.title,
                  description: m.description,
                  ageLabel: m.ageLabel,
                  location: m.location,
                }))}
              />
            </FadeIn>
          </section>
        )}

        {/* Stories */}
        {yearbook.stories.length > 0 && (
          <section id="section-stories">
            <FadeIn>
              <SectionTitle subtitle="Las historias que contar">
                Historias
              </SectionTitle>
              <div className="space-y-16">
                {yearbook.stories.map((story) => (
                  <StoryReader
                    key={story.id}
                    title={story.title}
                    content={story.content as Prisma.JsonValue}
                  />
                ))}
              </div>
            </FadeIn>
          </section>
        )}

        {/* Music */}
        {yearbook.music.length > 0 && (
          <section id="section-music">
            <FadeIn>
              <SectionTitle subtitle="La banda sonora del año">
                Música
              </SectionTitle>
              <MusicPlaylist tracks={yearbook.music} />
            </FadeIn>
          </section>
        )}

        {/* Parent notes */}
        {yearbook.parentNotes.length > 0 && (
          <section id="section-notes">
            <FadeIn>
              <SectionTitle subtitle="Palabras del corazón">
                Notas de mamá y papá
              </SectionTitle>
              <ParentNotes notes={yearbook.parentNotes} />
            </FadeIn>
          </section>
        )}

        {/* Timeline */}
        {yearbook.timeline.length > 0 && (
          <section id="section-timeline">
            <FadeIn>
              <SectionTitle subtitle="Mes a mes, paso a paso">
                Línea temporal
              </SectionTitle>
              <InteractiveTimeline
                items={yearbook.timeline.map((t) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description,
                  eventDate: t.eventDate,
                  month: t.month,
                  ageLabel: t.ageLabel,
                  location: t.location,
                }))}
              />
            </FadeIn>
          </section>
        )}

        {/* Future letter */}
        {yearbook.futureLetter && (
          <section id="section-letter">
            <FadeIn>
              <SectionTitle subtitle="Para cuando seas mayor">
                Carta al futuro
              </SectionTitle>
              <FutureLetter
                content={yearbook.futureLetter.content}
                signature={yearbook.futureLetter.signature}
                letterDate={yearbook.futureLetter.letterDate}
                hiddenUntilAge={yearbook.futureLetter.hiddenUntilAge}
              />
            </FadeIn>
          </section>
        )}
      </div>
    </div>
  );
}
