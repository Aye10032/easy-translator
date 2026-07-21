import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root ref={ref} className={cn("inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-[#cdd2da] p-0.5 outline-none transition data-[state=checked]:bg-[var(--primary)] focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
    <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
