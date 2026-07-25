import { Suspense } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { checkDatabaseConnection } from "@/lib/db/health";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const dbAvailable = await checkDatabaseConnection();

  return (
    <div className="min-h-screen warm-gradient hero-pattern flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <BookOpen className="h-6 w-6 text-accent-dark" />
            <span className="font-editorial text-xl">Memoria</span>
          </Link>
          <h1 className="font-display text-4xl font-light tracking-tight">Welcome</h1>
          <p className="mt-2 text-muted">Preserve your children&apos;s years</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-[var(--warm-shadow)]">
          <Suspense fallback={<div className="text-center text-muted py-8">Loading...</div>}>
            <LoginForm dbAvailable={dbAvailable} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
