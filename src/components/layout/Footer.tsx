import * as React from "react";
import { Link } from "react-router-dom";
import { ReklamAILogo } from "@/components/brand/ReklamAILogo";
import { useTranslation } from "@/i18n";

export function Footer() {
  const { t } = useTranslation();

  const legalLinks = [
    { path: "/legal/terms", label: t.legal.pages.terms },
    { path: "/legal/privacy", label: t.legal.pages.privacy },
    { path: "/legal/refund", label: t.legal.pages.refund },
    { path: "/legal/content", label: t.legal.pages.content },
    { path: "/legal/cookies", label: t.legal.pages.cookies },
  ];

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-4">
            <ReklamAILogo size="md" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ReklamAI. All rights reserved.
            </span>
          </div>

          {/* Legal Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
