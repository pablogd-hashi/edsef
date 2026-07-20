import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import { formatDate } from "@/lib/age";
import { MapPin } from "lucide-react";

interface SummaryContent {
  location?: string;
  context?: string;
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
}: {
  yearbook: YearbookWithRelations;
  immersive?: boolean;
}) {
  const { child } = yearbook;

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

        <p className="text-sm uppercase tracking-[0.2em] text-accent-dark mb-3">
          {child.fullName}
        </p>

        <h1
          className={`font-display font-light tracking-tight text-balance ${
            immersive ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"
          }`}
        >
          {yearbook.customCoverTitle ?? yearbook.title}
        </h1>

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
    { label: "Dónde vivíamos", value: content.location, icon: MapPin },
    { label: "Contexto", value: content.context },
    { label: "Viajes", value: content.trips?.join(" · ") },
    { label: "Música favorita", value: content.favoriteMusic },
    { label: "Le gustaba", value: content.likes },
    { label: "Miedos", value: content.fears },
  ].filter((i) => i.value);

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

      {content.quotes && content.quotes.length > 0 && (
        <div className="sm:col-span-2 rounded-xl border border-border-light bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3">
            Frases del año
          </p>
          <div className="flex flex-wrap gap-2">
            {content.quotes.map((q) => (
              <span
                key={q}
                className="rounded-full bg-accent/10 px-4 py-1.5 font-editorial italic text-accent-dark"
              >
                &ldquo;{q}&rdquo;
              </span>
            ))}
          </div>
        </div>
      )}

      {content.importantPeople && content.importantPeople.length > 0 && (
        <div className="sm:col-span-2 rounded-xl border border-border-light bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-accent-dark mb-3">
            Personas importantes
          </p>
          <div className="flex flex-wrap gap-2">
            {content.importantPeople.map((p) => (
              <span
                key={p}
                className="rounded-full border border-border px-4 py-1.5 text-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
