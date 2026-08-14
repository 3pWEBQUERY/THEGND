import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border font-medium transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary",
        neutral: "border-border bg-muted/70 text-muted-foreground",
        outline: "border-border text-foreground",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/18 text-warning",
        danger: "border-transparent bg-danger/15 text-danger",
        gold: "border-transparent bg-accent/18 text-accent",
        solid: "border-transparent bg-primary text-primary-foreground",
        glass: "border-white/20 bg-black/45 text-white backdrop-blur-md",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
