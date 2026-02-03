import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { PanelLeftClose, PanelLeft } from "lucide-react";

interface StudioSidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

const StudioSidebarContext = React.createContext<StudioSidebarContextValue | null>(null);

export const useStudioSidebar = () => {
  const context = React.useContext(StudioSidebarContext);
  if (!context) {
    throw new Error("useStudioSidebar must be used within a StudioSidebarProvider");
  }
  return context;
};

interface StudioSidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export const StudioSidebarProvider: React.FC<StudioSidebarProviderProps> = ({
  children,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <StudioSidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </StudioSidebarContext.Provider>
  );
};

// Main Sidebar Container
interface StudioSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
}

export const StudioSidebar = React.forwardRef<HTMLDivElement, StudioSidebarProps>(
  ({ className, side = "left", children, ...props }, ref) => {
    const { collapsed } = useStudioSidebar();

    return (
      <aside
        ref={ref}
        className={cn(
          "fixed top-0 bottom-0 z-40 flex flex-col bg-sidebar border-sidebar-border transition-all duration-300 ease-in-out overflow-hidden",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          className
        )}
        style={{ 
          height: '100vh',
          width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        }}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
StudioSidebar.displayName = "StudioSidebar";

// Spacer to offset main content from fixed sidebar
interface StudioSidebarSpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
}

export const StudioSidebarSpacer = React.forwardRef<HTMLDivElement, StudioSidebarSpacerProps>(
  ({ className, side = "left", ...props }, ref) => {
    const { collapsed } = useStudioSidebar();

    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 transition-all duration-300 ease-in-out",
          className
        )}
        style={{
          width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        }}
        {...props}
      />
    );
  }
);
StudioSidebarSpacer.displayName = "StudioSidebarSpacer";

// Sidebar Header
export const StudioSidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { collapsed } = useStudioSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 shrink-0 border-b border-sidebar-border h-16",
        collapsed ? "justify-center px-2" : "justify-between px-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
StudioSidebarHeader.displayName = "StudioSidebarHeader";

// Sidebar Toggle Button
export const StudioSidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { collapsed, toggle } = useStudioSidebar();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      className={cn("shrink-0", className)}
      {...props}
    >
      {collapsed ? (
        <PanelLeft className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );
});
StudioSidebarTrigger.displayName = "StudioSidebarTrigger";

// Sidebar Content - Scrollable area
export const StudioSidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto py-2 min-h-0", className)}
    {...props}
  />
));
StudioSidebarContent.displayName = "StudioSidebarContent";

// Sidebar Section
interface StudioSidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const StudioSidebarSection = React.forwardRef<
  HTMLDivElement,
  StudioSidebarSectionProps
>(({ className, title, children, ...props }, ref) => {
  const { collapsed } = useStudioSidebar();

  return (
    <div ref={ref} className={cn("px-2 py-2", className)} {...props}>
      {title && !collapsed && (
        <div className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
});
StudioSidebarSection.displayName = "StudioSidebarSection";

// Sidebar Item
interface StudioSidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
}

export const StudioSidebarItem = React.forwardRef<
  HTMLDivElement,
  StudioSidebarItemProps
>(({ className, icon, active, badge, children, ...props }, ref) => {
  const { collapsed } = useStudioSidebar();

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-primary",
        collapsed && "justify-center",
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn("shrink-0", active && "text-sidebar-primary")}>
          {icon}
        </span>
      )}
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-sm">{children}</span>
          {badge}
        </>
      )}
    </div>
  );
});
StudioSidebarItem.displayName = "StudioSidebarItem";

// Sidebar Footer - Fixed at bottom, never scrolls
export const StudioSidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-3 border-t border-sidebar-border shrink-0 bg-sidebar",
      className
    )}
    {...props}
  />
));
StudioSidebarFooter.displayName = "StudioSidebarFooter";
