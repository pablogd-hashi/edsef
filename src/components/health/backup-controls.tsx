"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import type { BackupStatus } from "@/lib/backup/status";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

export function BackupControls({
  status,
  isOwner,
}: {
  status: BackupStatus;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // While the script runs, refresh every few seconds so the new backup appears.
  useEffect(() => {
    if (!status.running) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [status.running, router]);

  async function createBackup() {
    setStarting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (res.status === 409) {
        setMessage({ type: "success", text: "Ya hay una copia en marcha." });
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error ?? "No se pudo iniciar la copia" });
        return;
      } else {
        setMessage({ type: "success", text: "Copia iniciada. Tarda unos minutos." });
      }
      router.refresh();
    } finally {
      setStarting(false);
    }
  }

  const latest = status.backups[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Última copia</p>
          <p className="font-medium">
            {status.lastBackupAt ? formatDate(status.lastBackupAt) : "Nunca"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Disco externo</p>
          <p className="font-medium">
            {!status.externalConfigured
              ? "No configurado"
              : status.externalCopiedAt
                ? formatDate(status.externalCopiedAt)
                : "Aún sin copia"}
          </p>
        </div>
      </div>

      {isOwner ? (
        <button
          type="button"
          onClick={createBackup}
          disabled={starting || status.running}
          className={cn(buttonVariants("primary", "sm"), "gap-2")}
        >
          {starting || status.running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {status.running ? "Haciendo copia…" : "Hacer copia ahora"}
        </button>
      ) : (
        <p className="text-sm text-muted">Solo la persona propietaria puede lanzar copias.</p>
      )}

      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-sm",
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
              : "bg-red-50 text-red-800 border border-red-100"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {status.backups.length > 0 && (
        <ul className="space-y-2">
          {status.backups.slice(0, 6).map((b) => (
            <li
              key={b.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">{formatDate(b.createdAt)}</span>
              <span className="text-muted">
                {b.fileCount} archivos · {formatBytes(BigInt(b.bytes))}
              </span>
            </li>
          ))}
        </ul>
      )}

      {latest && (
        <details className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium">Cómo restaurar una copia</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
            <li>Para la app en el Mac (Ctrl+C en su terminal).</li>
            <li>
              En la carpeta del proyecto, ejecuta:
              <code className="mt-1 block overflow-x-auto rounded bg-cream px-2 py-1 text-foreground">
                ./scripts/prod/restore.sh &quot;{status.root}/{latest.name}&quot;
              </code>
            </li>
            <li>Escribe RESTORE para confirmar y vuelve a arrancar la app.</li>
          </ol>
        </details>
      )}
    </div>
  );
}
