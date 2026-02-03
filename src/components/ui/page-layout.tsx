import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Page Layout Components - ReklamAI Design System
 * 
 * Consistent page structure with proper spacing rhythm.
 */

// Page Container - Full page wrapper
interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 flex flex-col overflow-hidden bg-background", className)}
      {...props}
    >
      {children}
    </div>
  )
);
PageContainer.displayName = "PageContainer";

// Page Header - Consistent header with optional actions
interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: "default" | "compact";
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, variant = "default", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "shrink-0 border-b border-border bg-card/50",
        variant === "default" ? "px-6 py-4" : "px-6 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 min-w-0">
          <h1 className={cn(
            "font-semibold tracking-tight",
            variant === "default" ? "text-lg" : "text-base"
          )}>
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  )
);
PageHeader.displayName = "PageHeader";

// Page Content - Scrollable content area with consistent padding
interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  noPadding?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-none",
};

export const PageContent = React.forwardRef<HTMLDivElement, PageContentProps>(
  ({ className, children, maxWidth = "2xl", noPadding = false, ...props }, ref) => (
    <ScrollArea className="flex-1">
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          maxWidthClasses[maxWidth],
          !noPadding && "px-6 py-5",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ScrollArea>
  )
);
PageContent.displayName = "PageContent";

// Page Section - Consistent section spacing
interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(
  ({ className, title, description, actions, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-sm font-semibold">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
);
PageSection.displayName = "PageSection";

// Stats Grid - Common pattern for KPIs
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
}

export const StatCard = ({ title, value, description, icon, trend }: StatCardProps) => (
  <div className="p-4 rounded-lg border border-border bg-card">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold tracking-tight font-numeric">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {icon && (
        <div className="w-8 h-8 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
    </div>
    {trend && (
      <div className={cn(
        "mt-2 text-xs font-medium inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
        trend.direction === "up" && "text-success bg-success/10",
        trend.direction === "down" && "text-destructive bg-destructive/10",
        trend.direction === "neutral" && "text-muted-foreground bg-secondary"
      )}>
        {trend.value}
      </div>
    )}
  </div>
);
