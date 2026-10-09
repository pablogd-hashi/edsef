import { cn } from "@/lib/utils";

/** CSS-only entrance; globals.css limits it to mouse devices (JS animation flickered on iOS). */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("motion-fade-in", className)}
      style={{ "--motion-delay": `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function StaggerChildren({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <div
      className={cn("motion-stagger-item", className)}
      style={{ "--motion-delay": `${Math.min(index, 10) * 0.05}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  subtitle,
  className,
}: {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-10", className)}>
      <h2 className="font-editorial text-3xl md:text-4xl tracking-tight text-balance">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-2 text-muted text-lg">{subtitle}</p>
      )}
      <div className="mt-4 h-px w-16 bg-accent" />
    </div>
  );
}
