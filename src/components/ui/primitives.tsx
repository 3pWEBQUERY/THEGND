"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Dialog ──────────────────────────────────────────────────────────────── */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none",
          "max-h-[90dvh] overflow-y-auto",
          "data-[state=open]:dialog-pop",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="size-4" />
            <span className="sr-only">Schliessen</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5 pr-8", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/* ── Dropdown ────────────────────────────────────────────────────────────── */

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item> & { inset?: boolean }) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
        "focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground",
        inset && "pl-9",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn("px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator className={cn("-mx-1.5 my-1.5 h-px bg-border", className)} {...props} />;
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
        "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  forceMount,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      forceMount={forceMount}
      className={cn(
        "mt-6 outline-none",
        // Mit `forceMount` bleibt der Inhalt im DOM — Radix blendet ihn dann
        // aber nicht mehr aus. Das übernehmen wir hier, damit Formularfelder
        // aus inaktiven Tabs weiterhin mitgeschickt werden.
        forceMount && "data-[state=inactive]:hidden",
        className,
      )}
      {...props}
    />
  );
}

/* ── Switch / Checkbox / Radio ───────────────────────────────────────────── */

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-lg border-2 border-transparent transition-colors",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:ring-2 focus-visible:ring-ring/50 outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-md bg-white shadow-lg transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}

export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer size-5 shrink-0 rounded-md border border-border bg-card transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export const RadioGroup = RadioPrimitive.Root;
export function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioPrimitive.Item>) {
  return (
    <RadioPrimitive.Item
      className={cn(
        "size-5 shrink-0 rounded-md border border-border bg-card outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=checked]:border-primary",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="flex size-full items-center justify-center">
        <span className="size-2.5 rounded-xs bg-primary" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Item>
  );
}

/* ── Slider ──────────────────────────────────────────────────────────────── */

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const count = props.value?.length ?? props.defaultValue?.length ?? 1;
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-xs bg-input">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: count }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-4.5 rounded-md border-2 border-primary bg-background shadow-md transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/50 outline-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

/* ── Misc ────────────────────────────────────────────────────────────────── */

export function Separator({ className, ...props }: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      className={cn("shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px", className)}
      {...props}
    />
  );
}

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-64 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export function PopoverContent({ className, sideOffset = 8, align = "start", ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-xl border border-border bg-card p-4 shadow-xl outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export const Accordion = AccordionPrimitive.Root;
export function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b border-border last:border-0", className)} {...props} />;
}
export function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "flex flex-1 items-center justify-between gap-4 py-5 text-left text-base font-medium transition-colors hover:text-primary [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-300" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}
export function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("pb-5 leading-relaxed", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export const Avatar = AvatarPrimitive.Root;
export function AvatarRoot({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-xl bg-muted", className)}
      {...props}
    />
  );
}
export function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image className={cn("aspect-square size-full object-cover", className)} {...props} />;
}
export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center brand-surface text-xs font-bold text-white",
        className,
      )}
      {...props}
    />
  );
}

export function Progress({ value = 0, className, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-2 w-full overflow-hidden rounded-xs bg-input", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-xs brand-surface transition-transform duration-500"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-lg", className)} {...props} />;
}
