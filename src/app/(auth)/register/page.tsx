"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
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
          <h1 className="font-display text-4xl font-light tracking-tight">Create account</h1>
          <p className="mt-2 text-muted">Start preserving memories</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-[var(--warm-shadow)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="register-name" className="block text-sm font-medium mb-1.5">Your name</label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium mb-1.5">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium mb-1.5">Password</label>
              <input
                id="register-password"
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
              disabled={loading}
              className={cn(buttonVariants("primary", "md"), "w-full")}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-center text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-accent-dark hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
