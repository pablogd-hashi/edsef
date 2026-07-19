"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered");

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
      setError("Email o contraseña incorrectos");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {registered && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          Cuenta creada. Ya puedes iniciar sesión.
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(buttonVariants("primary", "md"), "w-full")}
      >
        {loading ? "Entrando..." : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿Primera vez?{" "}
        <Link href="/register" className="text-accent-dark hover:underline font-medium">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen warm-gradient hero-pattern flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <BookOpen className="h-6 w-6 text-accent-dark" />
            <span className="font-editorial text-xl">Memoria</span>
          </Link>
          <h1 className="font-display text-4xl font-light tracking-tight">
            Bienvenido
          </h1>
          <p className="mt-2 text-muted">Conserva los años de tus hijos</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-[var(--warm-shadow)]">
          <Suspense fallback={<div className="text-center text-muted py-8">Cargando...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-muted-light">
          Demo: demo@memoria.app · demo1234
        </p>
      </div>
    </div>
  );
}
