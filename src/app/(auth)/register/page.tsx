"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

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
        setError(data.error ?? "Error al registrarse");
        setLoading(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-accent-dark mb-4" />
          <h1 className="font-editorial text-3xl">Crear cuenta</h1>
          <p className="mt-2 text-muted">Empieza a conservar recuerdos</p>
        </div>

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
            <span className="text-sm font-medium">Tu nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <span className="mt-1 text-xs text-muted">Mínimo 8 caracteres</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-foreground py-2.5 font-medium text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-accent-dark hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
