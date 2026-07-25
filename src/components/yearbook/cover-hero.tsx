"use client";

import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { formatDate } from "@/lib/age";
import { MapPin, Music, BookOpen, Film, Loader2 } from "lucide-react";
import type { DerivedSummaryContent, ManualSummaryContent } from "@/lib/yearbook/derive-summary";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { EditableField } from "@/components/ui/editable-field";
import { SummaryLocationMaps } from "@/components/yearbook/summary-location-map";
import { richTextToPlain } from "@/lib/rich-text";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  canEdit = false,
  yearbookId,
  childId,
}: {
  manual: ManualSummaryContent | null;
  derived: DerivedSummaryContent;
  canEdit?: boolean;
  yearbookId?: string;
  childId?: string;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<ManualSummaryContent>(manual ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(manual ?? {});
  }, [manual]);

  const derivedLocation =
    derived.locations.length > 0 ? derived.locations.join(" · ") : undefined;

  const manualFields = [
    { key: "location" as const, label: "Where you lived", placeholder: "City, country…" },
    { key: "context" as const, label: "Context of the year", placeholder: "What was happening this year?" },
    { key: "trips" as const, label: "Trips & adventures", placeholder: "Places you visited…" },
    { key: "likes" as const, label: "Likes", placeholder: "Favourite things…" },
    { key: "fears" as const, label: "Fears", placeholder: "What worried you…" },
  ];

  async function saveField(key: keyof ManualSummaryContent, value: string) {
    if (!yearbookId || !childId) return;
    const next = { ...local, [key]: value || undefined };
    setLocal(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/yearbooks/${yearbookId}?childId=${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryContent: next }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const hasDerived =
    derived.highlights.length > 0 ||
    derived.favoriteMusic.length > 0 ||
    derived.stories.length > 0 ||
    derived.videos.length > 0;

  const hasManual = manualFields.some((f) => local[f.key] || (f.key === "location" && derivedLocation));

  if (!canEdit && !hasManual && !hasDerived) return null;

  return (
    <div className="space-y-4">
      {canEdit && (
        <p className="text-sm text-muted flex items-center gap-2">
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Milestones, music, stories, and videos appear below automatically as you add them.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {manualFields.map(({ key, label, placeholder }) => {
          const value = (local[key] as string) ?? (key === "location" ? derivedLocation ?? "" : "");
          if (!canEdit && !value) return null;
          const plainValue = richTextToPlain(value);
          const showLocationMap = key === "location" && (plainValue || derived.mapPoints.length > 0);
          const showTripsMap = key === "trips" && plainValue;
          return (
            <div
              key={key}
              className={`rounded-xl border border-border-light bg-cream/50 p-5 ${
                key === "trips" ? "sm:col-span-2" : ""
              }`}
            >
              <p className="text-xs uppercase tracking-wider text-accent-dark mb-2 flex items-center gap-1.5">
                {key === "location" && <MapPin className="h-3.5 w-3.5" />}
                {label}
                {key === "location" && derivedLocation && !local.location && (
                  <span className="text-muted-light font-normal normal-case ml-1">(from milestones)</span>
                )}
              </p>
              {canEdit ? (
                <RichTextEditor
                  value={value}
                  canEdit
                  placeholder={placeholder}
                  onSave={async (v) => saveField(key, v as string)}
                />
              ) : (
                <RichTextContent value={value} />
              )}
              {showLocationMap && (
                <SummaryLocationMaps
                  childId={childId}
                  text={plainValue}
                  knownPoints={derived.mapPoints}
                />
              )}
              {showTripsMap && (
                <SummaryLocationMaps childId={childId} text={plainValue} />
              )}
            </div>
          );
        })}
      </div>

      {derived.highlights.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <a
            href="#section-milestones"
            className="text-xs uppercase tracking-wider text-accent-dark mb-3 inline-flex items-center gap-1 hover:underline"
          >
            Highlights
            <span className="text-muted-light font-normal normal-case">from milestones →</span>
          </a>
          <ul className="space-y-3 text-foreground leading-relaxed">
            {derived.highlights.map((h) => (
              <li key={h.id}>
                <a
                  href={`#milestone-${h.id}`}
                  className="group flex gap-2 rounded-lg -mx-2 px-2 py-1.5 hover:bg-cream/60 transition-colors"
                >
                  <span className="text-accent-dark shrink-0">·</span>
                  <span>
                    <span className="font-medium group-hover:text-accent-dark transition-colors">
                      {h.title}
                    </span>
                    {h.description && (
                      <span className="block text-sm text-muted mt-0.5 line-clamp-2">
                        {richTextToPlain(h.description)}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {derived.favoriteMusic.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <a
            href="#section-music"
            className="text-xs uppercase tracking-wider text-accent-dark mb-3 flex items-center gap-2 hover:underline w-fit"
          >
            <Music className="h-3.5 w-3.5" />
            Music you loved
            <span className="text-muted-light font-normal normal-case">from music section →</span>
          </a>
          <p className="text-foreground leading-relaxed">{derived.favoriteMusic}</p>
        </div>
      )}

      {derived.stories.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <a
            href="#section-stories"
            className="text-xs uppercase tracking-wider text-accent-dark mb-3 flex items-center gap-2 hover:underline w-fit"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Stories
            <span className="text-muted-light font-normal normal-case">from stories section →</span>
          </a>
          <ul className="space-y-1 text-foreground leading-relaxed">
            {derived.stories.map((s) => (
              <li key={s}>
                <a href="#section-stories" className="hover:text-accent-dark hover:underline">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {derived.videos.length > 0 && (
        <div className="rounded-xl border border-border-light bg-card p-6">
          <a
            href="#section-videos"
            className="text-xs uppercase tracking-wider text-accent-dark mb-3 flex items-center gap-2 hover:underline w-fit"
          >
            <Film className="h-3.5 w-3.5" />
            Videos
            <span className="text-muted-light font-normal normal-case">from videos section →</span>
          </a>
          <ul className="space-y-1 text-foreground leading-relaxed">
            {derived.videos.map((v) => (
              <li key={v}>
                <a href="#section-videos" className="hover:text-accent-dark hover:underline">
                  {v}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CoverTitleEditor({
  yearbookId,
  childId,
  title,
  canEdit,
}: {
  yearbookId: string;
  childId: string;
  title: string;
  canEdit: boolean;
}) {
  const router = useRouter();

  if (!canEdit) return null;

  return (
    <EditableField
      value={title}
      canEdit
      as="span"
      className="font-display text-4xl md:text-5xl font-light tracking-tight"
      inputClassName="font-display text-3xl text-center"
      onSave={async (customCoverTitle) => {
        const res = await fetch(`/api/yearbooks/${yearbookId}?childId=${childId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customCoverTitle }),
        });
        if (!res.ok) throw new Error("Failed to save");
        router.refresh();
      }}
    />
  );
}
