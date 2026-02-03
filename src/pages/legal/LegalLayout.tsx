import * as React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FileText, Shield, RotateCcw, AlertTriangle, Cookie } from "lucide-react";
import { PageContainer, PageContent } from "@/components/ui/page-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/i18n";

const legalPages = [
  { path: "/legal/terms", icon: FileText, key: "terms" },
  { path: "/legal/privacy", icon: Shield, key: "privacy" },
  { path: "/legal/refund", icon: RotateCcw, key: "refund" },
  { path: "/legal/content", icon: AlertTriangle, key: "content" },
  { path: "/legal/cookies", icon: Cookie, key: "cookies" },
] as const;

export default function LegalLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <PageContainer>
      <PageContent maxWidth="lg">
        <div className="py-8">
          {/* Navigation */}
          <nav className="flex flex-wrap gap-2 mb-8">
            {legalPages.map((page) => {
              const isActive = location.pathname === page.path;
              const Icon = page.icon;
              return (
                <Link key={page.path} to={page.path}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {t.legal.pages[page.key]}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Separator className="mb-8" />

          {/* Page Content */}
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <Outlet />
          </article>

          {/* Last Updated */}
          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t.legal.lastUpdated}: January 10, 2026
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t.legal.questions}{" "}
              <a href="mailto:legal@reklamai.com" className="text-primary hover:underline">
                legal@reklamai.com
              </a>
            </p>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
