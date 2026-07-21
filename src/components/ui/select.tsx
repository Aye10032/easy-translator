import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn("flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-left text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate", className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn("z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-1.5 text-[var(--foreground)] shadow-[0_18px_55px_rgba(25,29,36,.16)] data-[state=closed]:animate-out data-[state=open]:animate-in", position === "popper" && "w-[var(--radix-select-trigger-width)]", className)}
      {...props}
    >
      <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn("relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-[var(--primary-soft)] data-[highlighted]:text-[var(--primary-strong)] data-[disabled]:opacity-50", className)}
    {...props}
  >
    <span className="absolute left-3 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
