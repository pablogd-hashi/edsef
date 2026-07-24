"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackupJob {
  id: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  resultSize: string | null;
  error: string | null;
}

export function BackupControls({
  jobs,
  isOwner,
}: {
  jobs: BackupJob[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [backingUp, setBackingUp] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const lastCompleted = jobs.find((j) => j.status === "COMPLETED");

  async function createBackup() {
    setBackingUp(true);
    setMessage(null);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Backup failed" });
        return;
      }
      setMessage({
        type: "success",
        text: `Backup created (${data.fileCount} files)`,
      });
      router.refresh();
    } finally {
      setBackingUp(false);
    }
  }

  async function restoreBackup(backupId: string) {
    if (
      !confirm(
        "Restore from this backup? Current archive data will be overwritten with the backup contents."
      )
    ) {
      return;
    }
    setRestoringId(backupId);
    setMessage(null);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Restore failed" });
        return;
      }
      setMessage({
        type: "success",
        text: `Restored ${data.restoredChildren} children, ${data.restoredYearbooks} yearbooks, ${data.restoredFiles} files`,
      });
      router.refresh();
    } finally {
      setRestoringId(null);
    }
  }

  if (!isOwner) {
    return (
      <p className="text-sm text-muted">
        Only the family owner can create or restore backups.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={createBackup}
          disabled={backingUp}
          className={cn(buttonVariants("primary", "sm"), "gap-2")}
        >
          {backingUp ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Create backup
        </button>

        {lastCompleted && (
          <a
            href={`/api/backup/download?backupId=${lastCompleted.id}`}
            className={cn(buttonVariants("outline", "sm"), "gap-2")}
          >
            <Download className="h-4 w-4" />
            Download latest
          </a>
        )}
      </div>

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

      {jobs.length > 0 && (
        <ul className="space-y-2">
          {jobs.slice(0, 5).map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {new Date(job.createdAt).toLocaleString("en-US")}
                </p>
                <p className="text-xs text-muted capitalize">{job.status.toLowerCase()}</p>
              </div>
              <div className="flex gap-2">
                {job.status === "COMPLETED" && (
                  <>
                    <a
                      href={`/api/backup/download?backupId=${job.id}`}
                      className={cn(buttonVariants("ghost", "sm"))}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => restoreBackup(job.id)}
                      disabled={restoringId === job.id}
                      className={cn(buttonVariants("outline", "sm"), "gap-1")}
                    >
                      {restoringId === job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Restore
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
