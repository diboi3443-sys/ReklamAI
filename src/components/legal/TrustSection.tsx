import * as React from "react";
import { Link } from "react-router-dom";
import { Shield, ExternalLink, Mail, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/i18n";

export function TrustSection() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          {t.legal.trust.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Note */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t.legal.trust.security}</h4>
          <p className="text-sm text-muted-foreground">
            {t.legal.trust.securityDescription}
          </p>
        </div>

        <Separator />

        {/* Quick Links */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t.legal.trust.links}</h4>
          <div className="flex flex-wrap gap-2">
            <Link to="/legal/terms">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {t.legal.pages.terms}
              </Button>
            </Link>
            <Link to="/legal/privacy">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {t.legal.pages.privacy}
              </Button>
            </Link>
            <Link to="/legal/refund">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {t.legal.pages.refund}
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        {/* Status & Contact */}
        <div className="space-y-3">
          <a
            href="https://status.reklamai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-success" />
              <span className="text-sm">{t.legal.trust.status}</span>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>

          <a
            href="mailto:support@reklamai.com"
            className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm">support@reklamai.com</span>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
