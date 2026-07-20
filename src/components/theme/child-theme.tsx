import type { CSSProperties } from "react";
import { themeToCssVars } from "@/lib/theme/colors";
import { cn } from "@/lib/utils";

export function ChildTheme({
  themeColor,
  className,
  children,
}: {
  themeColor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("child-theme", className)}
      style={themeToCssVars(themeColor) as CSSProperties}
    >
      {children}
    </div>
  );
}
