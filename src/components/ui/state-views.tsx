import * as React from "react";
import { 
  Inbox, 
  AlertCircle, 
  Loader2, 
  Search, 
  FileX,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Empty State
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "compact" | "inline";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = "default",
}: EmptyStateProps) {
  const iconSize = variant === "compact" ? "w-10 h-10" : "w-12 h-12";
  const textSize = variant === "compact" ? "text-sm" : "text-base";
  const padding = variant === "inline" ? "py-8" : variant === "compact" ? "py-10" : "py-16";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        padding,
        className
      )}
    >
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center mb-4",
        iconSize
      )}>
        {icon || <Inbox className="w-5 h-5 text-muted-foreground" />}
      </div>
      <h3 className={cn("font-semibold", textSize)}>{title}</h3>
      {description && (
        <p className={cn(
          "text-muted-foreground mt-1 max-w-sm",
          variant === "compact" ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-4">
          {action && (
            <Button onClick={action.onClick} size={variant === "compact" ? "sm" : "default"}>
              {action.icon || <Plus className="w-4 h-4 mr-1" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              variant="ghost" 
              onClick={secondaryAction.onClick}
              size={variant === "compact" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// No Results State - now accepts translated strings
interface NoResultsStateProps {
  query?: string;
  onClear?: () => void;
  className?: string;
  title?: string;
  description?: string;
  clearLabel?: string;
}

export function NoResultsState({ 
  query, 
  onClear, 
  className,
  title = "No results found",
  description,
  clearLabel = "Clear filters"
}: NoResultsStateProps) {
  return (
    <EmptyState
      icon={<Search className="w-5 h-5 text-muted-foreground" />}
      title={title}
      description={description || (query ? `No matches for "${query}"` : "Try adjusting your search or filters")}
      action={onClear ? { label: clearLabel, onClick: onClear, icon: <RefreshCw className="w-4 h-4 mr-1" /> } : undefined}
      variant="compact"
      className={className}
    />
  );
}

// Loading State - now accepts translated strings
interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: "default" | "compact" | "inline";
}

export function LoadingState({
  title = "Loading...",
  description,
  className,
  variant = "default",
}: LoadingStateProps) {
  const padding = variant === "inline" ? "py-8" : variant === "compact" ? "py-10" : "py-16";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        padding,
        className
      )}
    >
      <Loader2 className={cn(
        "text-primary animate-spin mb-4",
        variant === "compact" ? "w-6 h-6" : "w-8 h-8"
      )} />
      <p className={cn(
        "text-muted-foreground",
        variant === "compact" ? "text-sm" : "text-base"
      )}>
        {title}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

// Error State - now accepts translated strings
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: "default" | "compact" | "inline";
}

export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content.",
  onRetry,
  retryLabel = "Try again",
  className,
  variant = "default",
}: ErrorStateProps) {
  const iconSize = variant === "compact" ? "w-10 h-10" : "w-12 h-12";
  const padding = variant === "inline" ? "py-8" : variant === "compact" ? "py-10" : "py-16";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        padding,
        className
      )}
    >
      <div className={cn(
        "rounded-full bg-destructive/10 flex items-center justify-center mb-4",
        iconSize
      )}>
        <AlertCircle className="w-5 h-5 text-destructive" />
      </div>
      <h3 className={cn(
        "font-semibold",
        variant === "compact" ? "text-sm" : "text-base"
      )}>
        {title}
      </h3>
      <p className={cn(
        "text-muted-foreground mt-1 max-w-sm",
        variant === "compact" ? "text-xs" : "text-sm"
      )}>
        {description}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry} 
          className="mt-4"
          size={variant === "compact" ? "sm" : "default"}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// Not Found State - now accepts translated strings
interface NotFoundStateProps {
  title?: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export function NotFoundState({
  title = "Not found",
  description = "The content you're looking for doesn't exist or has been removed.",
  onBack,
  backLabel = "Go back",
  className,
}: NotFoundStateProps) {
  return (
    <EmptyState
      icon={<FileX className="w-5 h-5 text-muted-foreground" />}
      title={title}
      description={description}
      action={onBack ? { label: backLabel, onClick: onBack, icon: null } : undefined}
      className={className}
    />
  );
}

// Skeleton components for loading states
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 animate-pulse", className)}>
      <div className="h-32 bg-muted rounded-lg mb-3" />
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 animate-pulse", className)}>
      <div className="w-12 h-12 bg-muted rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
      <div className="h-6 bg-muted rounded w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}