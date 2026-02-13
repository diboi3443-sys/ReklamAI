
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Sparkles,
    Library,
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
    StudioSidebarHeader,
    StudioSidebarContent,
    StudioSidebarSection,
    StudioSidebarItem,
    StudioSidebarFooter,
    StudioSidebarTrigger,
    useStudioSidebar,
} from "@/components/ui/studio-sidebar";
import { Badge } from "@/components/ui/badge";
import { ReklamAILogo } from "@/components/brand/ReklamAILogo";
import { ThemeToggle } from "@/components/theme";
import { LanguageToggle, useTranslation } from "@/i18n";
import { useState, useEffect } from "react";
import { creditsApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

function CreditsDisplay({ collapsed }: { collapsed: boolean }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        if (!user) return;
        creditsApi.getBalance()
            .then((data) => setBalance(data.balance))
            .catch(() => setBalance(0));
    }, [user]);

    if (collapsed) return null;

    return (
        <div className="p-3 rounded-lg bg-secondary/50 mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{t.common.credits}</span>
                <Badge variant="glow" size="sm" className="gap-1">
                    <span className="font-semibold">{balance !== null ? balance.toFixed(0) : '...'}</span>
                    <Zap className="w-3 h-3" />
                </Badge>
            </div>
            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full w-2/3 gradient-brand rounded-full" />
            </div>
            <Link to="/pricing" className="text-xs text-primary hover:underline mt-2 block text-center">
                {t.nav.buyMoreCredits}
            </Link>
        </div>
    );
}

export function SidebarNav() {
    const location = useLocation();
    const { collapsed } = useStudioSidebar();
    const { t } = useTranslation();

    const isActive = (path: string) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { title: t.nav.home, path: "/", icon: Home },
        { title: t.nav.studio, path: "/studio", icon: Sparkles },
        { title: t.common.generate, path: "/create", icon: Zap },
        { title: t.nav.boards, path: "/boards", icon: LayoutGrid },
        { title: t.nav.assets, path: "/assets", icon: FolderOpen },
        { title: t.nav.library, path: "/library", icon: Library },
        { title: t.nav.academy, path: "/academy", icon: GraduationCap },
    ];

    const accountItems = [
        { title: t.nav.pricing, path: "/pricing", icon: CreditCard },
        { title: t.nav.account, path: "/account", icon: User },
    ];

    // Mock: In real app, this would come from auth context
    const isAdmin = true;

    return (
        <>
            <StudioSidebarHeader className="h-16">
                <Link
                    to="/"
                    className="flex items-center hover:opacity-80 transition-opacity animate-fade-in"
                >
                    <ReklamAILogo size={collapsed ? "sm" : "md"} />
                </Link>
                <StudioSidebarTrigger />
            </StudioSidebarHeader>

            <StudioSidebarContent>
                <StudioSidebarSection title={t.nav.navigation}>
                    {navItems.map((item) => (
                        <NavLink key={item.path} to={item.path} className="block">
                            <StudioSidebarItem
                                icon={<item.icon className="w-4 h-4" />}
                                active={isActive(item.path)}
                            >
                                {item.title}
                            </StudioSidebarItem>
                        </NavLink>
                    ))}
                </StudioSidebarSection>

                <StudioSidebarSection title={t.nav.account}>
                    {accountItems.map((item) => (
                        <NavLink key={item.path} to={item.path} className="block">
                            <StudioSidebarItem
                                icon={<item.icon className="w-4 h-4" />}
                                active={isActive(item.path)}
                            >
                                {item.title}
                            </StudioSidebarItem>
                        </NavLink>
                    ))}
                </StudioSidebarSection>

                {isAdmin && (
                    <StudioSidebarSection title={t.nav.admin}>
                        <NavLink to="/admin" className="block">
                            <StudioSidebarItem
                                icon={<Shield className="w-4 h-4" />}
                                active={isActive("/admin")}
                            >
                                {t.nav.admin}
                            </StudioSidebarItem>
                        </NavLink>
                    </StudioSidebarSection>
                )}
            </StudioSidebarContent>

            <StudioSidebarFooter>
                <CreditsDisplay collapsed={collapsed} />
                <div className="space-y-2">
                    <div className={`flex items-center h-9 ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
                        {!collapsed && <span className="text-sm text-muted-foreground">{t.common.theme}</span>}
                        <ThemeToggle variant={collapsed ? "icon" : "dropdown"} />
                    </div>
                    <div className={`flex items-center h-9 ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
                        {!collapsed && <span className="text-sm text-muted-foreground">{t.common.language}</span>}
                        <LanguageToggle variant={collapsed ? "icon" : "dropdown"} />
                    </div>
                </div>
            </StudioSidebarFooter>
        </>
    );
}
