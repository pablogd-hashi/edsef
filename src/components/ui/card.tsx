import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card",
        hover && "transition-all duration-300 hover:shadow-[var(--warm-shadow)] hover:border-accent-light/50 hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
