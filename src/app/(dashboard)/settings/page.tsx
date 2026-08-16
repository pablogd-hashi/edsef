import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { InviteParentCard } from "@/components/settings/invite-parent-card";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.familyId) redirect("/login");

  return (
    <AppShell userName={session.user.name}>
      <main className="mx-auto max-w-2xl px-6 py-10 md:py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="font-display text-4xl font-light tracking-tight mb-2">
          Family
        </h1>
        <p className="text-muted mb-8">
          Invite your partner to the same family. Keep registration closed after that.
        </p>
        <InviteParentCard />
      </main>
    </AppShell>
  );
}
