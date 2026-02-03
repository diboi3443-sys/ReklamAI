import * as React from "react";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpPanel } from "./HelpPanel";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

interface HelpButtonProps {
  variant?: "floating" | "inline";
  className?: string;
}

export function HelpButton({ variant = "floating", className }: HelpButtonProps) {
  const { t } = useTranslation();
  const [helpOpen, setHelpOpen] = useState(false);

  if (variant === "inline") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHelpOpen(true)}
          className={className}
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
        <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
      </>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHelpOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
              "bg-background/95 backdrop-blur-sm border-border/50",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              "transition-all duration-200 hover:scale-105",
              className
            )}
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {t.common.help}
        </TooltipContent>
      </Tooltip>
      <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
