"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginForm({ dbAvailable }: { dbAvailable: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered");
  const sessionReset = searchParams.get("session") === "reset";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        dbAvailable
          ? "Incorrect email or password"
          : "Cannot sign in — database is not running. Start Docker first."
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!dbAvailable && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Database is not running</p>
          <p className="mt-1">
            Run{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
              docker compose -f docker-compose.local.yml up -d
            </code>{" "}
            before signing in.
          </p>
        </div>
      )}
      {sessionReset && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900">
          Session cleared. Sign in again with your email and password.
        </div>
      )}
      {registered && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          Account created. You can sign in now.
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          placeholder="you@email.com"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium mb-1.5">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !dbAvailable}
        className={cn(buttonVariants("primary", "md"), "w-full")}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">
        First time here?{" "}
        <Link href="/register" className="text-accent-dark hover:underline font-medium">
          Create account
        </Link>
      </p>
      <p className="text-center text-xs text-muted-light">
        Auth errors or can&apos;t sign in?{" "}
        <a href="/api/auth/reset-session" className="hover:underline">
          Reset session
        </a>
      </p>
    </form>
  );
}
