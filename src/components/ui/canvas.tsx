import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const canvasVariants = cva(
  "relative overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-surface-sunken border border-border rounded-xl",
        bordered: "bg-background border-2 border-dashed border-border rounded-xl",
        gradient:
          "bg-surface-sunken border border-border rounded-xl gradient-brand-subtle",
        glow: "bg-surface-sunken border border-primary/20 rounded-xl shadow-inner-glow",
      },
      size: {
        default: "aspect-video",
        square: "aspect-square",
        portrait: "aspect-[3/4]",
        wide: "aspect-[21/9]",
        auto: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CanvasProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof canvasVariants> {
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      empty = false,
      emptyMessage = "No content",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(canvasVariants({ variant, size, className }))}
        {...props}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : empty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <svg
                className="w-12 h-12 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">{emptyMessage}</span>
            </div>
          </div>
        ) : (
          children
        )}

        {/* Corner overlay for canvas controls */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Control buttons go here */}
        </div>
      </div>
    );
  }
);
Canvas.displayName = "Canvas";

// Canvas Toolbar
interface CanvasToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom" | "left" | "right";
}

const CanvasToolbar = React.forwardRef<HTMLDivElement, CanvasToolbarProps>(
  ({ className, position = "bottom", children, ...props }, ref) => {
    const positionClasses = {
      top: "top-0 left-0 right-0 flex-row border-b",
      bottom: "bottom-0 left-0 right-0 flex-row border-t",
      left: "top-0 bottom-0 left-0 flex-col border-r",
      right: "top-0 bottom-0 right-0 flex-col border-l",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "absolute bg-card/95 backdrop-blur-sm border-border p-2 flex gap-1",
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CanvasToolbar.displayName = "CanvasToolbar";

export { Canvas, CanvasToolbar, canvasVariants };
