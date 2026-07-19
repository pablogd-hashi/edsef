import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { mediaService } from "@/lib/services";
import { redirect } from "next/navigation";
import { formatBytes } from "@/lib/utils";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default async function HealthPage() {
  const session = await auth();
  if (!session?.user?.familyId) redirect("/login");

  const health = await mediaService.getHealthStats(session.user.familyId);
  const isHealthy = health.status === "healthy";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Link href="/dashboard" className="text-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-editorial text-xl">Salud del archivo</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div
          className={`mb-8 flex items-center gap-3 rounded-xl p-5 ${
            isHealthy ? "bg-green-50" : "bg-amber-50"
          }`}
        >
          {isHealthy ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              Estado general: {isHealthy ? "Saludable" : "Requiere atención"}
            </p>
            <p className="text-sm text-muted">
              Verificación de integridad y backups
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Archivos totales" value={String(health.totalFiles)} />
          <StatCard
            label="Espacio usado"
            value={formatBytes(health.totalSize)}
          />
          <StatCard
            label="Sin checksum"
            value={String(health.withoutChecksum)}
            warn={health.withoutChecksum > 0}
          />
          <StatCard
            label="En procesamiento"
            value={String(health.pendingProcessing)}
          />
          <StatCard
            label="Último backup"
            value={
              health.lastBackup
                ? new Date(health.lastBackup).toLocaleDateString("es")
                : "Nunca"
            }
          />
          <StatCard
            label="Última exportación"
            value={
              health.lastExport
                ? new Date(health.lastExport).toLocaleDateString("es")
                : "Nunca"
            }
          />
        </div>

        <section className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="font-editorial text-lg mb-4">Estrategia 3-2-1</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Copia en servidor (base de datos + almacenamiento)
            </li>
            <li className="flex items-center gap-2 text-muted">
              <span className="h-4 w-4 rounded-full border-2 border-border" />
              Copia secundaria S3 (configurable en producción)
            </li>
            <li className="flex items-center gap-2 text-muted">
              <span className="h-4 w-4 rounded-full border-2 border-border" />
              Copia offline (exportar ZIP manualmente)
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-medium ${warn ? "text-amber-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}
