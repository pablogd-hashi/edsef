import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const variants = {
  primary: "bg-foreground text-background hover:opacity-90 shadow-sm",
  secondary: "bg-accent text-white hover:bg-accent-dark shadow-sm",
  ghost: "hover:bg-cream text-foreground",
  outline:
    "border border-border bg-card hover:bg-card-hover hover:border-accent-light",
};

const sizes = {
  sm: "rounded-full px-4 py-2 text-sm",
  md: "rounded-full px-6 py-2.5 text-sm",
  lg: "rounded-full px-8 py-3.5 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function buttonVariants(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2",
    variants[variant],
    sizes[size],
    className
  );
}
