import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-light active:brightness-95 focus-visible:ring-primary",
  secondary:
    "bg-surface-elevated text-text border border-border hover:bg-border/40 focus-visible:ring-primary",
  outline:
    "bg-transparent text-text border border-border hover:bg-surface focus-visible:ring-primary",
  ghost: "bg-transparent text-text hover:bg-surface focus-visible:ring-primary",
  destructive:
    "bg-error text-primary-foreground hover:brightness-110 active:brightness-95 focus-visible:ring-error",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-small rounded-md gap-1.5",
  md: "h-10 px-4 text-body rounded-md gap-2",
  lg: "h-12 px-6 text-body rounded-lg gap-2",
  icon: "h-10 w-10 rounded-md p-0",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

export interface ButtonVariantsOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

// Shared with any element that needs to look like a Button but isn't one —
// e.g. a Next.js <Link> navigating to a URL, where correct semantics require
// a real <a>, not a <button> (and never an <a> nested inside a <button>).
export function buttonVariants({ variant = "primary", size = "md", className }: ButtonVariantsOptions = {}) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
