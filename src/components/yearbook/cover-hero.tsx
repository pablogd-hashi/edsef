import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { formatDate } from "@/lib/age";
import { MapPin, Music, BookOpen, Film } from "lucide-react";
import { CoverTitleEditor } from "./summary-editor";
import type { DerivedSummaryContent, ManualSummaryContent } from "@/lib/yearbook/derive-summary";

export function CoverHero({
  yearbook,
  immersive = false,
  canEdit = false,
}: {
  yearbook: YearbookWithRelations;
  immersive?: boolean;
  canEdit?: boolean;
}) {
  const { child } = yearbook;
  const photo =
    yearbook.coverPhoto ??
    (child as { profilePhoto?: { id: string } | null }).profilePhoto;
  const photoUrl = photo ? `/api/media/${photo.id}/file?variant=web` : null;

  return (
    <section
      className={`relative overflow-hidden text-center ${
        immersive ? "min-h-[85vh] flex flex-col justify-center" : "py-16"
      }`}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${child.themeColor} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10 px-6">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={child.fullName}
            className={`mx-auto mb-8 rounded-3xl object-cover shadow-[var(--warm-shadow-lg)] ${
              immersive ? "h-40 w-40" : "h-28 w-28"
            }`}
          />
        ) : (
          <div
            className={`mx-auto mb-8 flex items-center justify-center rounded-3xl font-editorial text-white shadow-[var(--warm-shadow-lg)] ${
              immersive ? "h-40 w-40 text-6xl" : "h-28 w-28 text-4xl"
            }`}
            style={{
              background: `linear-gradient(135deg, ${child.themeColor}, color-mix(in srgb, ${child.themeColor} 70%, #000))`,
            }}
          >
            {child.nickname?.[0] ?? child.fullName[0]}
          </div>
        )}

        <p className="text-sm uppercase tracking-[0.2em] text-accent-dark mb-3">
          {child.fullName}
        </p>

        {canEdit ? (
          <CoverTitleEditor
            yearbookId={yearbook.id}
            childId={yearbook.childId}
            title={yearbook.customCoverTitle ?? yearbook.title}
            canEdit
          />
        ) : (
          <h1
            className={`font-display font-light tracking-tight text-balance ${
              immersive ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"
            }`}
          >
            {yearbook.customCoverTitle ?? yearbook.title}
          </h1>
        )}

        {(yearbook.summaryContent as ManualSummaryContent | null)?.subtitle && (
          <p className="mt-3 text-xl text-muted italic font-editorial">
            {(yearbook.summaryContent as ManualSummaryContent).subtitle}
          </p>
        )}

        <p className="mt-4 text-lg text-muted">
          {yearbook.ageLabel}
          {yearbook.periodStart && yearbook.periodEnd && (
            <span className="text-muted-light">
              {" "}
              · {formatDate(yearbook.periodStart, "yyyy")}–
              {formatDate(yearbook.periodEnd, "yyyy")}
            </span>
          )}
        </p>

        {immersive && (
          <div className="mt-12 flex justify-center">
            <div className="h-12 w-px bg-gradient-to-b from-accent to-transparent animate-float" />
          </div>
        )}
      </div>
    </section>
  );
}

export function SummarySection({
  manual,
  derived,
}: {
  manual: ManualSummaryContent | null;
  derived: DerivedSummaryContent;
}) {
  const location =
    manual?.location ?? (derived.locations.length > 0 ? derived.locations.join(" · ") : undefined);

  const items = [
    { label: "Where we lived", value: location, icon: MapPin },
    { label: "Context", value: manual?.context },
    { label: "Trips", value: manual?.trips },
    { label: "Likes", value: manual?.likes },
    { label: "Fears", value: manual?.fears },
  ].filter((i) => i.value);

  const hasDerived =
    derived.highlights.length > 0 ||
    derived.favoriteMusic.length > 0 ||
    derived.stories.length > 0 ||
    derived.videos.length > 0;

  if (!items.length && !hasDerived) return null;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border-light bg-cream/50 p-5"
            >
              <p className="text-xs uppercase tracking-wider text-accent-dark mb-1.5">
                {item.label}
              </p>
              <p className="text-foreground leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {derived.highlights.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3">
            Highlights
            <span className="ml-2 text-muted-light font-normal normal-case">from milestones</span>
          </p>
          <ul className="space-y-2 text-foreground leading-relaxed">
            {derived.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span className="text-accent-dark">·</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {derived.favoriteMusic.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3 flex items-center gap-2">
            <Music className="h-3.5 w-3.5" />
            Music you loved
            <span className="text-muted-light font-normal normal-case">from music section</span>
          </p>
          <p className="text-foreground leading-relaxed">{derived.favoriteMusic}</p>
        </div>
      )}

      {derived.stories.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            Stories
            <span className="text-muted-light font-normal normal-case">from stories section</span>
          </p>
          <ul className="space-y-1 text-foreground leading-relaxed">
            {derived.stories.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {derived.videos.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3 flex items-center gap-2">
            <Film className="h-3.5 w-3.5" />
            Videos
            <span className="text-muted-light font-normal normal-case">from videos section</span>
          </p>
          <ul className="space-y-1 text-foreground leading-relaxed">
            {derived.videos.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
