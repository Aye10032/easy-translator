import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ children, ...props }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content sideOffset={7} className="z-50 rounded-lg bg-[#20242c] px-2.5 py-1.5 text-xs text-white shadow-lg" {...props}>
        {children}<TooltipPrimitive.Arrow className="fill-[#20242c]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
