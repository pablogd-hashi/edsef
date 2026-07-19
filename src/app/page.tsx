import Link from "next/link";
import { BookOpen, Heart, Shield, Download } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent-dark" />
            <span className="font-editorial text-xl">Memoria</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="font-editorial text-5xl md:text-6xl leading-tight tracking-tight">
            Los años de tus hijos,
            <br />
            <span className="text-accent-dark">conservados para siempre</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted leading-relaxed">
            Un diario familiar digital con fotos, videos, hitos e historias.
            Exporta todo en formatos abiertos que podrás abrir dentro de 30 años.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-foreground px-8 py-3 text-background font-medium hover:opacity-90 transition-opacity"
            >
              Empezar gratis
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-8 py-3 font-medium hover:bg-card transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
            <Feature
              icon={<Heart className="h-8 w-8 text-accent-dark" />}
              title="Diario por años"
              description="Crea un libro digital por cada año de vida con secciones, hitos y línea temporal mensual."
            />
            <Feature
              icon={<Shield className="h-8 w-8 text-accent-dark" />}
              title="Privado y seguro"
              description="Tu contenido familiar es solo tuyo. Sin URLs públicas, con backups y checksums de integridad."
            />
            <Feature
              icon={<Download className="h-8 w-8 text-accent-dark" />}
              title="Exportación completa"
              description="PDF, HTML offline, JSON y ZIP con archivos originales. Tus datos nunca quedan encerrados."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        Memoria — Archivo digital familiar de largo plazo
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center md:text-left">
      <div className="mb-4 flex justify-center md:justify-start">{icon}</div>
      <h3 className="font-editorial text-xl mb-2">{title}</h3>
      <p className="text-muted leading-relaxed">{description}</p>
    </div>
  );
}
