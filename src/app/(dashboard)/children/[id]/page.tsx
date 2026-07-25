import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { childrenService, yearbookService } from "@/lib/services";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfilePhotoUpload } from "@/components/children/profile-photo-upload";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { calculateAge, formatDate } from "@/lib/age";
import { ArrowLeft, Plus, Eye, BookOpen, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChildTheme } from "@/components/theme/child-theme";
import { ChildThemePicker } from "@/components/children/child-theme-picker";
import { DeleteYearbookButton } from "@/components/children/delete-yearbook-button";

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

  const isParent =
    session.user.role === "OWNER" || session.user.role === "PARENT";

  const profilePhotoUrl = child.profilePhoto
    ? `/api/media/${child.profilePhoto.id}/file?variant=web`
    : null;

  return (
    <AppShell userName={session.user.name}>
      <ChildTheme themeColor={child.themeColor}>
      {/* Hero */}
      <div
        className="relative border-b border-border overflow-hidden"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${child.themeColor} 12%, var(--background)), var(--background))`,
        }}
      >
        <div className="absolute inset-0 hero-pattern opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 py-12 md:py-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            My children
          </Link>

          <FadeIn>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <ProfilePhotoUpload
                childId={child.id}
                name={child.nickname ?? child.fullName}
                themeColor={child.themeColor}
                currentPhotoUrl={profilePhotoUrl}
                canEdit={isParent}
                size="xl"
              />
              <div className="flex-1">
                <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight">
                  {child.nickname ?? child.fullName}
                </h1>
                <p className="mt-2 text-muted text-lg">
                  {child.fullName}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-accent-dark" />
                    Born {formatDate(child.birthDate)}
                  </span>
                  <span className="text-muted-light">·</span>
                  <span>{age.label}</span>
                </div>
                {child.description && (
                  <p className="mt-5 text-muted leading-relaxed max-w-xl">
                    {child.description}
                  </p>
                )}
                <ChildThemePicker
                  childId={child.id}
                  currentColor={child.themeColor}
                  canEdit={isParent}
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-10 md:py-14">
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-editorial text-2xl">Life years</h2>
              <p className="text-sm text-muted mt-1">
                Each year is an independent digital book
              </p>
            </div>
            <Link
              href={`/children/${id}/yearbooks/new`}
              className={buttonVariants("outline", "sm")}
            >
              <Plus className="h-4 w-4" />
              New year
            </Link>
          </div>
        </FadeIn>

        {yearbooks.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-accent/40 mb-4" />
              <p className="text-muted mb-6">No years created yet</p>
              <Link
                href={`/children/${id}/yearbooks/new`}
                className={buttonVariants("secondary", "md")}
              >
                <Plus className="h-4 w-4" />
                Create first year
              </Link>
            </div>
          </FadeIn>
        ) : (
          <StaggerChildren className="space-y-4">
            {yearbooks.map((yearbook) => (
              <StaggerItem key={yearbook.id}>
                <div className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-[var(--warm-shadow)] hover:border-accent-light/50">
                  <div className="flex flex-col sm:flex-row">
                    {/* Color accent bar */}
                    <div
                      className="h-2 sm:h-auto sm:w-1.5 shrink-0"
                      style={{ backgroundColor: child.themeColor }}
                    />
                    <div className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-editorial text-xl group-hover:text-accent-dark transition-colors">
                            {yearbook.title}
                          </h3>
                          <Badge
                            variant={
                              yearbook.status === "PUBLISHED" ? "success" : "warning"
                            }
                          >
                            {yearbook.status === "PUBLISHED" ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted">
                          {yearbook.ageLabel ?? `Year ${yearbook.yearNumber}`}
                          {" · "}
                          {yearbook._count.milestones} milestones ·{" "}
                          {yearbook._count.stories} stories ·{" "}
                          {yearbook._count.timeline} events
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isParent && (
                          <DeleteYearbookButton
                            childId={id}
                            yearbookId={yearbook.id}
                            yearbookTitle={yearbook.title}
                          />
                        )}
                        <Link
                          href={`/children/${id}/yearbooks/${yearbook.id}/preview`}
                          className={cn(buttonVariants("ghost", "sm"))}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Link>
                        <Link
                          href={`/children/${id}/yearbooks/${yearbook.id}`}
                          className={cn(buttonVariants("primary", "sm"))}
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}
      </main>
      </ChildTheme>
    </AppShell>
  );
}
