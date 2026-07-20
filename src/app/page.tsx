import Link from "next/link";
import { BookOpen, Heart, Shield, Download, Sparkles, Clock, Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-accent-dark" />
            <span className="font-editorial text-lg">Memoria</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link href="/register" className={cn(buttonVariants("primary", "sm"))}>
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center justify-center warm-gradient hero-pattern pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center py-20">
          <FadeIn>
            <p className="text-sm uppercase tracking-[0.25em] text-accent-dark mb-6">
              Family digital yearbooks
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[1.05] text-balance">
              Your children&apos;s years,
              <br />
              <span className="italic text-accent-dark">forever</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-muted leading-relaxed">
              Photos, videos, milestones, and stories in a beautiful digital book.
              Export everything in open formats you can still open 30 years from now.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className={buttonVariants("primary", "lg")}>
                Get started free
              </Link>
              <Link href="/login" className={buttonVariants("outline", "lg")}>
                View demo
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="mt-8 text-sm text-muted-light">
              Private family archive — your data stays on your server
            </p>
          </FadeIn>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-16 w-px bg-gradient-to-b from-accent/50 to-transparent" />
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <p className="text-center text-sm uppercase tracking-[0.2em] text-accent-dark mb-4">
              Built to last
            </p>
            <h2 className="text-center font-editorial text-3xl md:text-4xl mb-16 text-balance">
              More than an app. A family archive.
            </h2>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Year-by-year diary",
                desc: "A digital book for each year of life with milestones, stories, and an interactive timeline.",
              },
              {
                icon: Shield,
                title: "Private and secure",
                desc: "Your family only. No public URLs. Backups with integrity checksums.",
              },
              {
                icon: Download,
                title: "Full export",
                desc: "PDF, offline HTML, JSON, and ZIP with original files. Your data is never locked in.",
              },
              {
                icon: Sparkles,
                title: "Beautiful to read",
                desc: "Warm editorial design. Preview like a family magazine on any device.",
              },
              {
                icon: Clock,
                title: "Timeline",
                desc: "Interactive month-by-month chronology. Every moment with age, place, and context.",
              },
              {
                icon: Lock,
                title: "Family access",
                desc: "Parents and children with their own permissions. Future letters with reveal dates.",
              },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.05}>
                <div className="group rounded-2xl border border-border bg-card p-8 h-full transition-all duration-300 hover:shadow-[var(--warm-shadow)] hover:border-accent-light/50">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <f.icon className="h-5 w-5 text-accent-dark" />
                  </div>
                  <h3 className="font-editorial text-xl mb-2">{f.title}</h3>
                  <p className="text-muted leading-relaxed text-sm">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-foreground text-background">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-6">
            Start your child&apos;s diary today
          </h2>
          <p className="text-background/70 text-lg mb-10">
            Free to start. Your memories, your rules, forever.
          </p>
          <Link
            href="/register"
            className={cn(
              buttonVariants("primary", "lg"),
              "bg-background text-foreground hover:bg-background/90"
            )}
          >
            Create my family
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted">
        Memoria — Long-term family digital archive
      </footer>
    </div>
  );
}
