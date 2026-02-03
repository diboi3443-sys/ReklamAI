import * as React from "react";
import { cn } from "@/lib/utils";

// Top Navigation Bar
interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "transparent" | "bordered";
}

export const TopNav = React.forwardRef<HTMLElement, TopNavProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-card border-b border-border",
      transparent: "bg-transparent",
      bordered: "bg-background border-b border-border",
    };

    return (
      <header
        ref={ref}
        className={cn(
          "h-14 flex items-center px-4 shrink-0",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </header>
    );
  }
);
TopNav.displayName = "TopNav";

// Nav Brand/Logo area
interface TopNavBrandProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TopNavBrand = React.forwardRef<HTMLDivElement, TopNavBrandProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-3 shrink-0", className)}
      {...props}
    >
      {children}
    </div>
  )
);
TopNavBrand.displayName = "TopNavBrand";

// Nav Section (for grouping items)
interface TopNavSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
}

export const TopNavSection = React.forwardRef<HTMLDivElement, TopNavSectionProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    const alignClasses = {
      start: "justify-start",
      center: "justify-center flex-1",
      end: "justify-end ml-auto",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", alignClasses[align], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TopNavSection.displayName = "TopNavSection";

// Nav Item
interface TopNavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export const TopNavItem = React.forwardRef<HTMLDivElement, TopNavItemProps>(
  ({ className, active, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors",
        "hover:bg-secondary hover:text-foreground",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
TopNavItem.displayName = "TopNavItem";

// Nav Separator
export const TopNavSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-px h-6 bg-border mx-2", className)}
    {...props}
  />
));
TopNavSeparator.displayName = "TopNavSeparator";

// Nav Actions (right side actions)
interface TopNavActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TopNavActions = React.forwardRef<HTMLDivElement, TopNavActionsProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 ml-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
);
TopNavActions.displayName = "TopNavActions";
