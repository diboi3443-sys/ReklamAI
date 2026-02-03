import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge Component - ReklamAI Design System
 * 
 * Restrained, functional badges.
 * Fewer variants, cleaner look.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground bg-transparent",
        success:
          "border-transparent bg-success/12 text-success",
        warning:
          "border-transparent bg-warning/12 text-warning",
        info: "border-transparent bg-info/12 text-info",
        gradient:
          "border-transparent gradient-brand text-primary-foreground",
        glow: "border-primary/20 bg-primary/8 text-primary",
      },
      size: {
        sm: "h-5 px-2 text-[10px]",
        default: "h-5.5 px-2.5 text-xs",
        lg: "h-6 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
