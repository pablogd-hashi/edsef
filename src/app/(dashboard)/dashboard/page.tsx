import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { accessService, childrenService } from "@/lib/services";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import { Plus, Heart, BookOpen, ArrowRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkDatabaseConnection } from "@/lib/db/health";
import { DatabaseUnavailable } from "@/components/errors/database-unavailable";
import { currentLifeYearNumber } from "@/lib/yearbook/period";
import { listRecentInboxImports } from "@/lib/inbox/recent";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.familyId) redirect("/login");

  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    return (
      <AppShell userName={session.user.name}>
        <DatabaseUnavailable />
      </AppShell>
    );
  }

  const [children, parents, inboxImports] = await Promise.all([
    childrenService.listByFamily(session.user.familyId),
    accessService.listParents(session.user.familyId),
    listRecentInboxImports(session.user.familyId),
  ]);
  const needsPartner = parents.length < 2;

  return (
    <AppShell userName={session.user.name}>
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-accent-dark mb-2">
                Your family
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight">
                My children
              </h1>
              <p className="mt-2 text-muted text-lg">
                Each child has their own space and life years
              </p>
            </div>
            <Link href="/children/new" className={buttonVariants("secondary", "md")}>
              <Plus className="h-4 w-4" />
              Add child
            </Link>
          </div>
        </FadeIn>

        {children.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="rounded-3xl border border-dashed border-border bg-card/50 px-8 py-20 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Heart className="h-8 w-8 text-accent-dark" />
              </div>
              <h2 className="font-editorial text-2xl mb-3">No children yet</h2>
              <p className="text-muted mb-8 max-w-md mx-auto leading-relaxed">
                Create your first child&apos;s profile to start their annual diary with
                photos, milestones, stories, and an interactive timeline.
              </p>
              <Link href="/children/new" className={buttonVariants("primary", "md")}>
                <Plus className="h-4 w-4" />
                Create first child
              </Link>
            </div>
          </FadeIn>
        ) : (
          <StaggerChildren className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const photoUrl = child.profilePhoto
                ? `/api/media/${child.profilePhoto.id}/file?variant=thumbnail`
                : null;
              const currentYear = currentLifeYearNumber(child.birthDate);
              const currentBook = child.yearbooks.find((y) => y.yearNumber === currentYear);
              const childInbox = inboxImports.filter((i) => i.childId === child.id);

              return (
              <StaggerItem key={child.id}>
                <div className="group h-full rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-[var(--warm-shadow-lg)] hover:border-accent-light/50">
                  <Link href={`/children/${child.id}`} className="flex items-start gap-4">
                    <Avatar
                      name={child.nickname ?? child.fullName}
                      color={child.themeColor}
                      size="lg"
                      src={photoUrl}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-editorial text-xl group-hover:text-accent-dark transition-colors">
                        {child.nickname ?? child.fullName}
                      </h2>
                      <p className="text-sm text-muted mt-0.5 truncate">
                        {child.fullName}
                      </p>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <Badge variant="accent">
                          Year {currentYear}
                        </Badge>
                        <Badge>
                          {child.yearbooks.length}{" "}
                          {child.yearbooks.length === 1 ? "year" : "years"}
                        </Badge>
                        {childInbox.length > 0 && (
                          <Badge variant="accent">
                            {childInbox.length} new from iCloud
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="mt-5">
                    <Link
                      href={
                        currentBook
                          ? `/children/${child.id}/yearbooks/${currentBook.id}?section=timeline`
                          : `/children/${child.id}/yearbooks/current`
                      }
                      className={cn(buttonVariants("secondary", "sm"), "w-full")}
                    >
                      Open this year
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </StaggerItem>
              );
            })}

            <StaggerItem>
              <Link
                href="/children/new"
                className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-cream/30 p-6 text-muted hover:border-accent-light hover:text-accent-dark hover:bg-cream/50 transition-all duration-300"
              >
                <Plus className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Add child</span>
              </Link>
            </StaggerItem>
          </StaggerChildren>
        )}

        {inboxImports.length > 0 && (
          <FadeIn delay={0.15}>
            <div className="mt-10 rounded-2xl border border-accent/30 bg-gradient-to-r from-cream to-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-accent-dark" />
                <div>
                  <p className="font-medium">
                    {inboxImports.length} new from iCloud
                  </p>
                  <p className="text-sm text-muted">
                    Photos landed on this year&apos;s timeline. Open a year to title them.
                  </p>
                </div>
              </div>
              <Link
                href={`/children/${inboxImports[0].childId}/yearbooks/${inboxImports[0].yearbookId}?section=timeline`}
                className={cn(buttonVariants("outline", "sm"))}
              >
                Review
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        )}

        {needsPartner && (
          <FadeIn delay={0.2}>
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-accent-dark" />
                <div>
                  <p className="font-medium">Invite the other parent</p>
                  <p className="text-sm text-muted">
                    One-time link. They join this family — registration stays closed.
                  </p>
                </div>
              </div>
              <Link href="/settings" className={cn(buttonVariants("outline", "sm"))}>
                Family settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        )}
      </main>
    </AppShell>
  );
}
