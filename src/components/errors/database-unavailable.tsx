import { Database, Terminal } from "lucide-react";
import Link from "next/link";

export function DatabaseUnavailable({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Database is not running</p>
        <p className="mt-1 text-amber-800">
          Start it with{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
            docker compose -f docker-compose.local.yml up -d
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full rounded-2xl border border-border bg-card p-8 shadow-[var(--warm-shadow)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 mb-5">
          <Database className="h-6 w-6 text-amber-700" />
        </div>
        <h1 className="font-display text-3xl font-light tracking-tight mb-2">
          Database not running
        </h1>
        <p className="text-muted leading-relaxed mb-6">
          Memoria needs PostgreSQL on your machine. Login may appear to work, but the app
          cannot load your family data until the database is started.
        </p>

        <div className="rounded-xl bg-cream/60 border border-border-light p-4 mb-6">
          <p className="text-sm font-medium flex items-center gap-2 mb-3">
            <Terminal className="h-4 w-4 text-accent-dark" />
            Run these commands in your project folder:
          </p>
          <pre className="text-xs leading-relaxed overflow-x-auto text-foreground/90">
{`docker compose -f docker-compose.local.yml up -d
npm run db:migrate:deploy`}
          </pre>
        </div>

        <ol className="text-sm text-muted space-y-2 mb-6 list-decimal list-inside">
          <li>Make sure Docker Desktop is open and running</li>
          <li>Run the commands above</li>
          <li>
            Check{" "}
            <a href="/api/ping" className="text-accent-dark hover:underline">
              /api/ping
            </a>{" "}
            — it should return <code className="text-xs">&#123; &quot;db&quot;: true &#125;</code>
          </li>
          <li>Refresh this page</li>
        </ol>

        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </a>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-cream transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
