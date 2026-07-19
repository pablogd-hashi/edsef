import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { childrenService, yearbookService } from "@/lib/services";
import { redirect, notFound } from "next/navigation";
import { formatDate, calculateAge } from "@/lib/age";
import { Plus, ArrowLeft } from "lucide-react";

export default async function ChildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.familyId) redirect("/login");

  const { id } = await params;
  const child = await childrenService.getById(id, session.user.familyId);
  if (!child) notFound();

  const yearbooks = await yearbookService.listByChild(id);
  const age = calculateAge(child.birthDate);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-editorial text-xl">{child.fullName}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-10 flex items-start gap-6">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-3xl font-editorial text-white"
            style={{ backgroundColor: child.themeColor }}
          >
            {child.nickname?.[0] ?? child.fullName[0]}
          </div>
          <div>
            <h2 className="font-editorial text-3xl">
              {child.nickname ?? child.fullName}
            </h2>
            <p className="mt-1 text-muted">
              Nacida el {formatDate(child.birthDate)} · {age.label}
            </p>
            {child.description && (
              <p className="mt-3 text-muted leading-relaxed max-w-lg">
                {child.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-editorial text-xl">Años de vida</h3>
          <Link
            href={`/children/${id}/yearbooks/new`}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-card transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo año
          </Link>
        </div>

        {yearbooks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted mb-4">Aún no hay años creados</p>
            <Link
              href={`/children/${id}/yearbooks/new`}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm text-white"
            >
              <Plus className="h-4 w-4" />
              Crear primer año
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {yearbooks.map((yearbook) => (
              <Link
                key={yearbook.id}
                href={`/children/${id}/yearbooks/${yearbook.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow"
              >
                <div>
                  <h4 className="font-editorial text-lg">{yearbook.title}</h4>
                  <p className="text-sm text-muted">
                    {yearbook.ageLabel ?? `Año ${yearbook.yearNumber}`}
                    {" "}
                    · {yearbook._count.milestones} hitos ·{" "}
                    {yearbook._count.mediaAssets} archivos
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    yearbook.status === "PUBLISHED"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {yearbook.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
