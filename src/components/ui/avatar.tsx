import { cn } from "@/lib/utils";

export function Avatar({
  name,
  color = "#C4A77D",
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initial = name.charAt(0).toUpperCase();
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
    xl: "h-28 w-28 text-4xl",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl font-editorial text-white shadow-[var(--warm-shadow)]",
        sizes[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
