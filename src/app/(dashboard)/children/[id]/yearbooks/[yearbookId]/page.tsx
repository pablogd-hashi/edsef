import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { yearbookService } from "@/lib/services";
import { redirect, notFound } from "next/navigation";
import { YearbookViewer } from "@/components/yearbook/yearbook-viewer";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Download, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {/* Editor toolbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/children/${childId}`}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-lg truncate">
                  {yearbook.title}
                </h1>
                <Badge
                  variant={yearbook.status === "PUBLISHED" ? "success" : "warning"}
                >
                  {yearbook.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                </Badge>
              </div>
              <p className="text-xs text-muted truncate">
                {yearbook.child.fullName} · {yearbook.ageLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/children/${childId}/yearbooks/${yearbookId}/preview`}
              className={cn(buttonVariants("outline", "sm"), "hidden sm:inline-flex")}
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Link>
            <Link
              href={`/children/${childId}/yearbooks/${yearbookId}/export`}
              className={cn(buttonVariants("secondary", "sm"))}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Edit mode banner */}
      <div className="border-b border-border-light bg-cream/50">
        <div className="mx-auto max-w-5xl px-6 py-2.5 flex items-center justify-center gap-2 text-sm text-muted">
          <Pencil className="h-3.5 w-3.5" />
          Modo edición — los cambios se guardan automáticamente
        </div>
      </div>

      <YearbookViewer yearbook={yearbook} mode="edit" />
    </div>
  );
}
