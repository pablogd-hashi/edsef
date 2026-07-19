import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { yearbookService } from "@/lib/services";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Eye, Download } from "lucide-react";

import type { YearbookWithRelations } from "@/lib/services/yearbook.service";

export default async function YearbookPage({
  params,
}: {
  params: Promise<{ id: string; yearbookId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.familyId) redirect("/login");

  const { id: childId, yearbookId } = await params;
  const yearbook = await yearbookService.getById(yearbookId, childId);
  if (!yearbook) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/children/${childId}`}
              className="text-muted hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-editorial text-xl">{yearbook.title}</h1>
              <p className="text-sm text-muted">
                {yearbook.child.fullName} · {yearbook.ageLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/children/${childId}/yearbooks/${yearbookId}/preview`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-card"
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Link>
            <Link
              href={`/children/${childId}/yearbooks/${yearbookId}/export`}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm text-white"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="w-56 shrink-0 border-r border-border p-4 hidden md:block">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
            Secciones
          </p>
          <nav className="space-y-1">
            {yearbook.sections.map((section) => (
              <a
                key={section.id}
                href={`#section-${section.type.toLowerCase()}`}
                className={`block rounded-lg px-3 py-2 text-sm hover:bg-card ${
                  !section.visible ? "opacity-40" : ""
                }`}
              >
                {section.title ?? section.type}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-10">
          <YearbookPreview yearbook={yearbook} />
        </main>
      </div>
    </div>
  );
}

function YearbookPreview({ yearbook }: { yearbook: YearbookWithRelations }) {
  return (
    <div className="prose-yearbook mx-auto">
      <section id="section-cover" className="mb-16 text-center">
        <div
          className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-2xl text-6xl font-editorial text-white"
          style={{ backgroundColor: yearbook.child.themeColor }}
        >
          {yearbook.child.nickname?.[0] ?? yearbook.child.fullName[0]}
        </div>
        <h1 className="font-editorial text-4xl">
          {yearbook.customCoverTitle ?? yearbook.title}
        </h1>
        <p className="mt-2 text-muted text-lg">{yearbook.ageLabel}</p>
      </section>

      {yearbook.summaryContent && (
        <section id="section-summary" className="mb-16">
          <h2 className="font-editorial text-2xl mb-6 border-b border-border pb-2">
            Resumen del año
          </h2>
          <div className="text-muted leading-relaxed">
            {/* Summary rendered from JSON in Phase 3 */}
            <p>Contenido del resumen (editor en Fase 3)</p>
          </div>
        </section>
      )}

      {yearbook.milestones?.length > 0 && (
        <section id="section-milestones" className="mb-16">
          <h2 className="font-editorial text-2xl mb-6 border-b border-border pb-2">
            Hitos
          </h2>
          <div className="space-y-6">
            {yearbook.milestones.map((m) => (
                <div key={m.id} className="border-l-2 border-accent pl-4">
                  {m.ageLabel && (
                    <p className="text-sm text-accent-dark font-medium">{m.ageLabel}</p>
                  )}
                  <h3 className="font-editorial text-xl">{m.title}</h3>
                  {m.description && (
                    <p className="mt-1 text-muted">{m.description}</p>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {yearbook.stories?.length > 0 && (
        <section id="section-stories" className="mb-16">
          <h2 className="font-editorial text-2xl mb-6 border-b border-border pb-2">
            Historias
          </h2>
          {yearbook.stories.map((s) => (
              <article key={s.id} className="mb-10">
                <h3 className="font-editorial text-2xl mb-4">{s.title}</h3>
              </article>
            ))}
        </section>
      )}

      {yearbook.timeline?.length > 0 && (
        <section id="section-timeline" className="mb-16">
          <h2 className="font-editorial text-2xl mb-6 border-b border-border pb-2">
            Línea temporal
          </h2>
          <div className="space-y-4">
            {yearbook.timeline.map((t) => (
                <div key={t.id} className="flex gap-4">
                  <time className="text-sm text-muted w-24 shrink-0">
                    {new Date(t.eventDate).toLocaleDateString("es", {
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  <div>
                    <p className="font-medium">{t.title}</p>
                    {t.description && (
                      <p className="text-sm text-muted">{t.description}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {yearbook.futureLetter && (
        <section id="section-future_letter" className="mb-16">
          <h2 className="font-editorial text-2xl mb-6 border-b border-border pb-2">
            Carta al futuro
          </h2>
          <div className="rounded-xl bg-card border border-border p-8 font-editorial italic leading-relaxed">
            {yearbook.futureLetter.content}
            {yearbook.futureLetter.signature && (
              <p className="mt-6 not-italic text-right text-muted">
                — {yearbook.futureLetter.signature}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
