import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Input Component - ReklamAI Design System
 * 
 * Design tokens:
 * - Height: 32px (sm), 40px (default), 44px (lg)
 * - Border radius: rounded-lg (10px)
 * - Border: 1px solid border
 * - Focus: ring-2 with primary/15
 */
const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-foreground transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15",
        ghost:
          "border-transparent bg-secondary focus-visible:bg-background focus-visible:border-border focus-visible:ring-2 focus-visible:ring-primary/15",
        glow: "border-primary/25 focus-visible:border-primary focus-visible:shadow-glow-sm focus-visible:ring-0",
      },
      inputSize: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-3 text-sm",
        lg: "h-11 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
