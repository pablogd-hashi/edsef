import { Lock } from "lucide-react";
import { formatDate } from "@/lib/age";

export function FutureLetter({
  content,
  signature,
  letterDate,
  hiddenUntilAge,
}: {
  content: string;
  signature?: string | null;
  letterDate: Date | string;
  hiddenUntilAge?: number | null;
}) {
  return (
    <div className="relative">
      {hiddenUntilAge && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Lock className="h-4 w-4" />
          Visible a partir de los {hiddenUntilAge} años
        </div>
      )}
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-b from-cream to-card p-8 md:p-12 shadow-[var(--warm-shadow)]">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-dark mb-6">
          Carta al futuro · {formatDate(new Date(letterDate), "d MMMM yyyy")}
        </p>
        <div className="font-editorial text-lg md:text-xl leading-[1.9] text-foreground/90 whitespace-pre-line">
          {content}
        </div>
        {signature && (
          <p className="mt-10 text-right font-editorial text-xl text-accent-dark">
            — {signature}
          </p>
        )}
      </div>
    </div>
  );
}
