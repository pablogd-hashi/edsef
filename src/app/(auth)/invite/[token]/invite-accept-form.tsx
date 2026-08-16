"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLookupError(data.error ?? "This invite is not valid");
          return;
        }
        setFamilyName(data.familyName);
      })
      .catch(() => {
        if (!cancelled) setLookupError("Could not load this invite");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not join family");
        setLoading(false);
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Connection error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen warm-gradient hero-pattern flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <BookOpen className="h-6 w-6 text-accent-dark" />
            <span className="font-editorial text-xl">Memoria</span>
          </Link>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Join your family
          </h1>
          <p className="mt-2 text-muted">
            {familyName
              ? `Create your parent account for ${familyName}`
              : "Create your parent account"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-[var(--warm-shadow)]">
          {lookupError ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {lookupError}
              </div>
              <Link href="/login" className={cn(buttonVariants("outline", "md"), "w-full")}>
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="invite-name" className="block text-sm font-medium mb-1.5">
                  Your name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              <div>
                <label htmlFor="invite-password" className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <input
                  id="invite-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
                <p className="mt-1.5 text-xs text-muted-light">At least 8 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading || !familyName}
                className={cn(buttonVariants("primary", "md"), "w-full")}
              >
                {loading ? "Joining..." : "Join family"}
              </button>

              <p className="text-center text-sm text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-accent-dark hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
