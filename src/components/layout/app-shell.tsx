import Link from "next/link";
import { BookOpen, Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string | null;
  className?: string;
}

export function AppShell({ children, userName, className }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <BookOpen className="h-4 w-4 text-accent-dark" />
            </div>
            <span className="font-editorial text-lg tracking-tight">Memoria</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/health"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-cream transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Salud</span>
            </Link>
            {userName && (
              <span className="ml-2 hidden sm:inline text-sm text-muted border-l border-border pl-4">
                {userName}
              </span>
            )}
            <Link
              href="/api/auth/signout"
              className="ml-1 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-cream transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
