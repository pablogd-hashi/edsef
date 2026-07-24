import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { formatDate } from "@/lib/age";
import { MapPin } from "lucide-react";
import { CoverTitleEditor } from "./summary-editor";

interface SummaryContent {
  subtitle?: string;
  location?: string;
  context?: string;
  highlights?: string[];
  trips?: string[];
  favoriteMusic?: string;
  likes?: string;
  fears?: string;
  quotes?: string[];
  importantPeople?: string[];
}

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

        {(yearbook.summaryContent as SummaryContent | null)?.subtitle && (
          <p className="mt-3 text-xl text-muted italic font-editorial">
            {(yearbook.summaryContent as SummaryContent).subtitle}
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
  content,
}: {
  content: SummaryContent | null;
}) {
  if (!content) return null;

  const items = [
    { label: "Where we lived", value: content.location, icon: MapPin },
    { label: "Context", value: content.context },
    { label: "Trips", value: content.trips?.join(" · ") },
    { label: "Favorite music", value: content.favoriteMusic },
    { label: "Likes", value: content.likes },
    { label: "Fears", value: content.fears },
  ].filter((i) => i.value);

  if (!items.length && !content.highlights?.length) return null;

  return (
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

      {content.highlights && content.highlights.length > 0 && (
        <div className="sm:col-span-2 rounded-xl border border-border-light bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3">
            Highlights
          </p>
          <ul className="space-y-2 text-foreground leading-relaxed">
            {content.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span className="text-accent-dark">·</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
