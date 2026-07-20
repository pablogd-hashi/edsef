import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { yearbookService } from "@/lib/services";
import { redirect, notFound } from "next/navigation";
import { ExportPanel } from "@/components/yearbook/export-panel";
import { ArrowLeft } from "lucide-react";

export default async function ExportPage({
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link
            href={`/children/${childId}/yearbooks/${yearbookId}`}
            className="text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-editorial text-xl">Export</h1>
            <p className="text-sm text-muted">
              {yearbook.title} · {yearbook.child.fullName}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <ExportPanel
          yearbookId={yearbookId}
          childId={childId}
          childName={yearbook.child.fullName}
          yearTitle={yearbook.title}
        />
      </main>
    </div>
  );
}
