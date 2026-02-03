import * as React from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

interface ConsentCheckboxProps {
  type: "signup" | "checkout";
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: boolean;
  className?: string;
}

export function ConsentCheckbox({
  type,
  checked,
  onCheckedChange,
  error,
  className,
}: ConsentCheckboxProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Checkbox
        id={`consent-${type}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "mt-0.5",
          error && !checked && "border-destructive"
        )}
      />
      <Label
        htmlFor={`consent-${type}`}
        className={cn(
          "text-sm text-muted-foreground font-normal leading-relaxed cursor-pointer",
          error && !checked && "text-destructive"
        )}
      >
        {type === "signup" ? (
          <>
            {t.legal.consent.signupPrefix}{" "}
            <Link
              to="/legal/terms"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t.legal.pages.terms}
            </Link>
            {" "}{t.legal.consent.and}{" "}
            <Link
              to="/legal/privacy"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t.legal.pages.privacy}
            </Link>
          </>
        ) : (
          <>
            {t.legal.consent.checkoutPrefix}{" "}
            <Link
              to="/legal/refund"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t.legal.pages.refund}
            </Link>
            {" "}{t.legal.consent.and}{" "}
            <Link
              to="/legal/terms"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t.legal.pages.terms}
            </Link>
          </>
        )}
      </Label>
    </div>
  );
}
