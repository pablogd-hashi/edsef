import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { childrenService } from "@/lib/services";
import { redirect } from "next/navigation";
import { BookOpen, Plus, Heart, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.familyId) redirect("/login");

  const children = await childrenService.listByFamily(session.user.familyId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent-dark" />
            <span className="font-editorial text-lg">Memoria</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/health"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
            >
              <Activity className="h-4 w-4" />
              Salud del archivo
            </Link>
            <span className="text-sm text-muted">{session.user.name}</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-editorial text-3xl">Mis hijos</h1>
            <p className="mt-1 text-muted">
              Cada hijo tiene su propio espacio y sus años de vida
            </p>
          </div>
          <Link
            href="/children/new"
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Añadir hijo
          </Link>
        </div>

        {children.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/children/${child.id}`}
                className="group rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-editorial text-white"
                  style={{ backgroundColor: child.themeColor }}
                >
                  {child.nickname?.[0] ?? child.fullName[0]}
                </div>
                <h2 className="font-editorial text-xl group-hover:text-accent-dark transition-colors">
                  {child.nickname ?? child.fullName}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {child.yearbooks.length}{" "}
                  {child.yearbooks.length === 1 ? "año" : "años"} creados
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
      <Heart className="mx-auto h-12 w-12 text-accent/60 mb-4" />
      <h2 className="font-editorial text-2xl mb-2">Aún no hay hijos</h2>
      <p className="text-muted mb-6 max-w-md mx-auto">
        Crea el perfil de tu primer hijo para empezar su diario anual.
        Podrás añadir fotos, hitos, historias y exportar todo cuando quieras.
      </p>
      <Link
        href="/children/new"
        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background"
      >
        <Plus className="h-4 w-4" />
        Crear primer hijo
      </Link>
    </div>
  );
}
