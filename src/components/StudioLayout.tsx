import * as React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { HelpButton } from "@/components/help";
import { Footer } from "@/components/layout";
import { UserMenu } from "@/components/user";
import {
  Sparkles,
  Library,
  Settings,
  HelpCircle,
  Zap,
  Home,
  CreditCard,
  User,
  Shield,
  GraduationCap,
  LayoutGrid,
  FolderOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  StudioSidebarProvider,
  StudioSidebar,
  StudioSidebarSpacer,
  StudioSidebarHeader,
  StudioSidebarContent,
  StudioSidebarSection,
  StudioSidebarItem,
  StudioSidebarFooter,
  StudioSidebarTrigger,
  useStudioSidebar,
} from "@/components/ui/studio-sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReklamAILogo, ReklamAIIcon } from "@/components/brand/ReklamAILogo";
import { ThemeToggle } from "@/components/theme";
import { LanguageToggle, useTranslation } from "@/i18n";
import { useState, useEffect } from "react";



import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { MobileNav } from "@/components/layout/MobileNav";

export function StudioLayout() {
  const isMobile = useIsMobile();

  return (
    <StudioSidebarProvider>
      <div className="min-h-screen flex w-full bg-background pb-16 md:pb-0">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <>
            <StudioSidebar>
              <SidebarNav />
            </StudioSidebar>
            <StudioSidebarSpacer />
          </>
        )}

        {/* Mobile Nav */}
        {isMobile && <MobileNav />}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header with User Menu */}
          <header className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-4 shrink-0">
            {/* Show Logo on mobile only */}
            {isMobile ? (
              <div className="flex items-center gap-2">
                <ReklamAILogo size="sm" />
              </div>
            ) : <div />}
            <UserMenu />
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
          {/* Hide Footer on mobile to save space, or keep it small */}
          {!isMobile && <Footer />}
        </div>
        <HelpButton />
      </div>
    </StudioSidebarProvider>
  );
}
