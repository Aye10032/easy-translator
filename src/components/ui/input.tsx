import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--muted-surface)] disabled:opacity-60", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
