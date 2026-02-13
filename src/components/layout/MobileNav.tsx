
import { Home, Sparkles, Zap, Menu, LayoutGrid } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { StudioSidebarProvider } from "@/components/ui/studio-sidebar";

export function MobileNav() {
    const location = useLocation();
    const { t } = useTranslation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-around p-2 pb-safe">
            <Link
                to="/"
                className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                    isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t.nav.home}</span>
            </Link>

            <Link
                to="/boards"
                className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                    isActive("/boards") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t.nav.boards}</span>
            </Link>

            <Link to="/create">
                <div className="relative -top-5">
                    <div className="w-14 h-14 rounded-full gradient-brand shadow-glow-sm flex items-center justify-center border-4 border-background">
                        <Zap className="w-6 h-6 text-white fill-white" />
                    </div>
                </div>
            </Link>

            <Link
                to="/studio"
                className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                    isActive("/studio") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Sparkles className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t.nav.studio}</span>
            </Link>

            <Sheet>
                <SheetTrigger asChild>
                    <div className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors cursor-pointer",
                        "text-muted-foreground hover:text-foreground"
                    )}>
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{t.nav.navigation}</span>
                    </div>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 pt-10">
                    <StudioSidebarProvider>
                        {/* Reuse SidebarNav logic but adapted for Sheet */}
                        {/* Note: We will need to export SidebarNav from StudioLayout or recreate it */}
                        <div className="h-full overflow-y-auto">
                            <SidebarNav />
                        </div>
                    </StudioSidebarProvider>
                </SheetContent>
            </Sheet>
        </div>
    );
}
