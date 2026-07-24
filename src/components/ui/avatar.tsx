import { cn } from "@/lib/utils";

export function Avatar({
  name,
  color = "#D946EF",
  size = "md",
  src,
  className,
}: {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  src?: string | null;
  className?: string;
}) {
  const initial = name.charAt(0).toUpperCase();
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
    xl: "h-28 w-28 text-4xl",
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          "shrink-0 rounded-2xl object-cover shadow-[var(--warm-shadow)]",
          sizes[size],
          className
        )}
      />
    );
  }

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
