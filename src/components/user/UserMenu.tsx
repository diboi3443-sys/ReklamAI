import * as React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, CreditCard, LogOut, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/lib/AuthContext";
import { AuthModal } from "@/components/AuthModal";

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const name = user?.full_name || user?.email?.split('@')[0] || '';
  const initials = name.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Not logged in - show login button
  if (!user && !loading) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setAuthModalOpen(true)}>
          <LogIn className="mr-2 h-4 w-4" />
          {t.nav.login || 'Login'}
        </Button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" disabled>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="gradient-brand text-primary-foreground text-sm">
            ...
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar_url || undefined} alt={name} />
              <AvatarFallback className="gradient-brand text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{name}</p>
              <p className="text-xs text-muted-foreground leading-none">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/account" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              {t.nav.account}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              {t.settings.title}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/pricing" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              {t.account.billing}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            {t.settings.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
