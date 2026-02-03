import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Textarea Component - ReklamAI Design System
 * 
 * Design tokens:
 * - Border radius: rounded-lg (10px)
 * - Border: 1px solid border
 * - Padding: consistent with Input
 * - Focus: ring-2 with primary/15
 */
const textareaVariants = cva(
  "flex w-full rounded-lg border bg-background text-foreground transition-all duration-150 placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default:
          "border-border focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15",
        ghost:
          "border-transparent bg-secondary focus-visible:bg-background focus-visible:border-border focus-visible:ring-2 focus-visible:ring-primary/15",
        glow: "border-primary/25 focus-visible:border-primary focus-visible:shadow-glow-sm focus-visible:ring-0",
      },
      textareaSize: {
        sm: "min-h-[80px] px-3 py-2 text-xs",
        default: "min-h-[100px] px-3 py-2.5 text-sm leading-relaxed",
        lg: "min-h-[140px] px-4 py-3 text-sm leading-relaxed",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, textareaSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
