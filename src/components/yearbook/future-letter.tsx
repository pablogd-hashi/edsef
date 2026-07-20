"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { formatDate } from "@/lib/age";
import { EditableField } from "@/components/ui/editable-field";

export function FutureLetter({
  id,
  content,
  signature,
  letterDate,
  hiddenUntilAge,
  canEdit = false,
}: {
  id: string;
  content: string;
  signature?: string | null;
  letterDate: Date | string;
  hiddenUntilAge?: number | null;
  canEdit?: boolean;
}) {
  const router = useRouter();

  async function patchLetter(data: Record<string, string | null>) {
    const res = await fetch(`/api/future-letters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to save");
    }
  }

  return (
    <div className="relative">
      {hiddenUntilAge && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Lock className="h-4 w-4" />
          Visible from age {hiddenUntilAge}
        </div>
      )}
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-b from-cream to-card p-8 md:p-12 shadow-[var(--warm-shadow)]">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-dark mb-6">
          Future letter · {formatDate(new Date(letterDate), "d MMMM yyyy")}
        </p>
        <EditableField
          value={content}
          canEdit={canEdit}
          multiline
          as="p"
          placeholder="Write the letter..."
          className="font-editorial text-lg md:text-xl leading-[1.9] text-foreground/90 whitespace-pre-line"
          inputClassName="font-editorial text-base"
          onSave={async (newContent) => {
            await patchLetter({ content: newContent });
            router.refresh();
          }}
        />
        <div className="mt-10 text-right font-editorial text-xl text-accent-dark">
          {canEdit ? (
            <EditableField
              value={signature ?? ""}
              canEdit
              placeholder="Signature (e.g. Mom & Dad)"
              className="text-right"
              onSave={async (newSignature) => {
                await patchLetter({ signature: newSignature || null });
                router.refresh();
              }}
            />
          ) : (
            signature && <p>— {signature}</p>
          )}
        </div>
      </div>
    </div>
  );
}
