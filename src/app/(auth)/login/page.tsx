"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-8 shadow-sm"
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <label className="block mb-4">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50"
          placeholder="tu@email.com"
        />
      </label>

      <label className="block mb-6">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-2.5 font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "Entrando..." : "Iniciar sesión"}
      </button>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Primera vez?{" "}
        <Link href="/register" className="text-accent-dark hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-accent-dark mb-4" />
          <h1 className="font-editorial text-3xl">Bienvenido de nuevo</h1>
          <p className="mt-2 text-muted">Conserva los años de tus hijos</p>
        </div>

        <Suspense fallback={<div className="text-center text-muted">Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
