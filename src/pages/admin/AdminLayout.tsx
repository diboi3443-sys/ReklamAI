import * as React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  Cpu,
  Layers,
  Users,
  FileText,
  ArrowLeft,
  PanelLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export default function AdminLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  const adminNavItems = [
    { title: t.admin.dashboard, path: "/admin", icon: LayoutDashboard, end: true },
    { title: t.admin.contentDesign, path: "/admin/content", icon: PanelLeft },
    { title: t.admin.pricingControl, path: "/admin/pricing", icon: DollarSign },
    { title: t.admin.models, path: "/admin/models", icon: Cpu },
    { title: t.admin.featuresPresets, path: "/admin/features", icon: Layers },
    { title: t.admin.usersCredits, path: "/admin/users", icon: Users },
    { title: t.admin.logs, path: "/admin/logs", icon: FileText },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Admin Sidebar */}
      <div className="w-56 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.admin.backToApp}
            </Button>
          </Link>
        </div>
        <div className="p-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            {t.admin.adminPanel}
          </h2>
        </div>
        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = item.end 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <NavLink key={item.path} to={item.path} end={item.end} className="block">
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* Admin Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}