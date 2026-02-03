import * as React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language } from "./LanguageProvider";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  variant?: "icon" | "dropdown" | "compact";
  className?: string;
}

const languageLabels: Record<Language, { short: string; full: string; flag: string }> = {
  ru: { short: "RU", full: "Русский", flag: "🇷🇺" },
  en: { short: "EN", full: "English", flag: "🇺🇸" },
};

export function LanguageToggle({ variant = "dropdown", className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === "icon") {
    // Simple toggle between RU and EN
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
        className={cn("relative", className)}
        aria-label="Toggle language"
      >
        <span className="text-xs font-semibold">{languageLabels[language].short}</span>
      </Button>
    );
  }

  if (variant === "compact") {
    // Compact toggle showing RU/EN
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
        className={cn("gap-1 px-2", className)}
        aria-label="Toggle language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{languageLabels[language].short}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("relative", className)}
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setLanguage("ru")}
          className={cn(language === "ru" && "bg-accent")}
        >
          <span className="mr-2">{languageLabels.ru.flag}</span>
          <span>Русский</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={cn(language === "en" && "bg-accent")}
        >
          <span className="mr-2">{languageLabels.en.flag}</span>
          <span>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
