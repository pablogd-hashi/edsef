import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { yearbookService } from "@/lib/services";
import { redirect, notFound } from "next/navigation";
import { YearbookViewer } from "@/components/yearbook/yearbook-viewer";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Pencil, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function PreviewPage({
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
    <div className="min-h-screen bg-card preview-mode">
      {/* Minimal preview chrome */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-border/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/children/${childId}/yearbooks/${yearbookId}`}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream transition-colors"
            >
              <X className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-accent-dark">
                Preview
              </p>
              <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                {yearbook.customCoverTitle ?? yearbook.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/children/${childId}/yearbooks/${yearbookId}`}
              className={cn(buttonVariants("ghost", "sm"))}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
            <Link
              href={`/children/${childId}/yearbooks/${yearbookId}/export`}
              className={cn(buttonVariants("secondary", "sm"))}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <YearbookViewer yearbook={yearbook} mode="preview" />
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center pointer-events-none">
        <Link
          href={`/children/${childId}`}
          className={cn(
            buttonVariants("outline", "sm"),
            "pointer-events-auto shadow-[var(--warm-shadow-lg)] glass"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {yearbook.child.nickname ?? yearbook.child.fullName}
        </Link>
      </div>
    </div>
  );
}
