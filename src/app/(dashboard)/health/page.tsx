import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { mediaService } from "@/lib/services";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { formatBytes } from "@/lib/utils";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, CheckCircle, AlertCircle, HardDrive, Shield } from "lucide-react";

export default async function HealthPage() {
  const session = await auth();
  if (!session?.user?.familyId) redirect("/login");

  const health = await mediaService.getHealthStats(session.user.familyId);
  const isHealthy = health.status === "healthy";

  return (
    <AppShell userName={session.user.name}>
      <main className="mx-auto max-w-4xl px-6 py-10 md:py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <FadeIn>
          <h1 className="font-display text-4xl font-light tracking-tight mb-2">
            Salud del archivo
          </h1>
          <p className="text-muted text-lg mb-10">
            Verificación de integridad y backups
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div
            className={`mb-10 flex items-center gap-4 rounded-2xl p-6 ${
              isHealthy
                ? "bg-emerald-50 border border-emerald-100"
                : "bg-amber-50 border border-amber-100"
            }`}
          >
            {isHealthy ? (
              <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-editorial text-xl">
                {isHealthy ? "Todo en orden" : "Requiere atención"}
              </p>
              <p className="text-sm text-muted mt-0.5">
                {isHealthy
                  ? "Todos los archivos tienen checksum y están procesados"
                  : "Hay archivos pendientes de verificación"}
              </p>
            </div>
          </div>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Archivos totales", value: String(health.totalFiles), icon: HardDrive },
            { label: "Espacio usado", value: formatBytes(health.totalSize), icon: HardDrive },
            {
              label: "Sin checksum",
              value: String(health.withoutChecksum),
              warn: health.withoutChecksum > 0,
            },
            { label: "En procesamiento", value: String(health.pendingProcessing) },
            {
              label: "Último backup",
              value: health.lastBackup
                ? new Date(health.lastBackup).toLocaleDateString("es")
                : "Nunca",
            },
            {
              label: "Última exportación",
              value: health.lastExport
                ? new Date(health.lastExport).toLocaleDateString("es")
                : "Nunca",
            },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={0.05 * i}>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wider text-muted mb-2">
                  {stat.label}
                </p>
                <p
                  className={`text-2xl font-editorial ${
                    stat.warn ? "text-amber-600" : ""
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <section className="mt-12 rounded-2xl border border-border bg-gradient-to-br from-cream to-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-accent-dark" />
              <h2 className="font-editorial text-xl">Estrategia 3-2-1</h2>
            </div>
            <div className="space-y-3">
              {[
                { done: true, text: "Copia en servidor (base de datos + almacenamiento)" },
                { done: false, text: "Copia secundaria S3 (configurable en producción)" },
                { done: false, text: "Copia offline (exportar ZIP manualmente)" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                      item.done
                        ? "bg-emerald-100 text-emerald-600"
                        : "border-2 border-border"
                    }`}
                  >
                    {item.done && <CheckCircle className="h-3.5 w-3.5" />}
                  </div>
                  <span className={item.done ? "text-foreground" : "text-muted"}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      </main>
    </AppShell>
  );
}
