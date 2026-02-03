import * as React from "react";
import { cn } from "@/lib/utils";
import logoSvg from "@/assets/reklamai-logo-cropped.svg";

interface ReklamAILogoProps {
  /**
   * Logo size variants:
   * - sm: 32px height - for compact placements
   * - md: 48px height - default for sidebar header
   * - lg: 72px height - for footer/brand zone
   * - xl: 96px height - for hero sections
   */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ReklamAILogo({ size = "md", className }: ReklamAILogoProps) {
  // Fixed integer pixel heights - no fractional values
  const heights: Record<string, number> = {
    sm: 32,
    md: 64,
    lg: 72,
    xl: 96,
  };

  const height = heights[size];

  return (
    <img 
      src={logoSvg} 
      alt="ReklamAI" 
      className={cn("select-none mt-5", className)}
      style={{
        height: `${height}px`,
        width: 'auto',
        display: 'block',
      }}
      draggable={false}
    />
  );
}

// Alias for backwards compatibility
export function ReklamAIIcon({ size = "md", className }: ReklamAILogoProps) {
  return <ReklamAILogo size={size} className={className} />;
}
