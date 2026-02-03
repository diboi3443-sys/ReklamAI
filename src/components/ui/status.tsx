import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const statusVariants = cva(
  "inline-flex items-center gap-2 rounded-lg font-medium transition-all",
  {
    variants: {
      variant: {
        loading: "text-muted-foreground",
        success: "text-success",
        error: "text-destructive",
        warning: "text-warning",
        info: "text-info",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "loading",
      size: "default",
    },
  }
);

const statusDotVariants = cva("rounded-full animate-pulse", {
  variants: {
    variant: {
      loading: "bg-muted-foreground",
      success: "bg-success",
      error: "bg-destructive",
      warning: "bg-warning",
      info: "bg-info",
    },
    size: {
      default: "w-2 h-2",
      sm: "w-1.5 h-1.5",
      lg: "w-2.5 h-2.5",
    },
  },
  defaultVariants: {
    variant: "loading",
    size: "default",
  },
});

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  showIcon?: boolean;
  showDot?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  (
    { className, variant, size, showIcon = true, showDot = false, children, ...props },
    ref
  ) => {
    const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

    const icons = {
      loading: <Loader2 size={iconSize} className="animate-spin" />,
      success: <CheckCircle2 size={iconSize} />,
      error: <XCircle size={iconSize} />,
      warning: <AlertCircle size={iconSize} />,
      info: <Info size={iconSize} />,
    };

    return (
      <div
        ref={ref}
        className={cn(statusVariants({ variant, size, className }))}
        {...props}
      >
        {showDot && (
          <span className={cn(statusDotVariants({ variant, size }))} />
        )}
        {showIcon && !showDot && icons[variant || "loading"]}
        {children}
      </div>
    );
  }
);
StatusIndicator.displayName = "StatusIndicator";

// Spinner Component
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Loader2
          className={cn(sizeClasses[size], "animate-spin text-primary")}
        />
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

// Progress Bar Component
interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "gradient" | "glow";
  size?: "sm" | "default" | "lg";
  showValue?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = "default",
      size = "default",
      showValue = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-1",
      default: "h-2",
      lg: "h-3",
    };

    const fillClasses = {
      default: "bg-primary",
      gradient: "gradient-brand",
      glow: "bg-primary shadow-glow-sm",
    };

    return (
      <div ref={ref} className={cn("w-full space-y-1", className)} {...props}>
        <div
          className={cn(
            "w-full rounded-full bg-secondary overflow-hidden",
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              fillClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showValue && (
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

export { StatusIndicator, Spinner, ProgressBar, statusVariants };
