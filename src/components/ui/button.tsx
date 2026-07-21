import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all outline-none disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-4 focus-visible:ring-[var(--ring)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white shadow-[0_8px_20px_rgba(53,104,212,.20)] hover:bg-[var(--primary-strong)] hover:-translate-y-px",
        secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm hover:border-[var(--border-strong)] hover:bg-[var(--muted-surface)]",
        ghost: "text-[var(--muted-foreground)] hover:bg-[var(--muted-surface)] hover:text-[var(--foreground)]",
        destructive: "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[#f8dfdc]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 px-6",
        icon: "size-10 p-0",
        "icon-sm": "size-8 rounded-lg p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
