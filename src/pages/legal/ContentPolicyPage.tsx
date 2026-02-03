import * as React from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function ContentPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          {t.legal.pages.content}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.legal.contentSubtitle}
        </p>
      </header>

      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          {t.legal.contentWarning}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.prohibited}</h2>
        <p className="text-muted-foreground leading-relaxed">
          The following types of content are strictly prohibited on our platform:
        </p>
        <div className="space-y-2">
          {[
            "Illegal content or content promoting illegal activities",
            "Content depicting or promoting violence, harm, or abuse",
            "Sexually explicit content involving minors",
            "Content promoting hatred, discrimination, or harassment",
            "Misleading deepfakes or content intended to deceive",
            "Content infringing on intellectual property rights",
            "Personal information without consent (doxxing)",
            "Malware, phishing, or harmful code",
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-muted-foreground">
              <X className="w-4 h-4 text-destructive shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.permitted}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We encourage creative, respectful, and lawful use of our tools:
        </p>
        <div className="space-y-2">
          {[
            "Commercial advertising and marketing content",
            "Artistic and creative expression",
            "Educational and informational content",
            "Product demonstrations and showcases",
            "Entertainment and storytelling",
            "Personal and portfolio projects",
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-success shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.moderation}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We use automated systems and human review to enforce content policies. Content may 
          be flagged, removed, or result in account action without prior notice. We may 
          report illegal content to appropriate authorities.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.reporting}</h2>
        <p className="text-muted-foreground leading-relaxed">
          If you encounter content that violates our policies, please report it through the 
          Help panel or email abuse@reklamai.com. Include relevant details and we will 
          investigate promptly.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.consequences}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Violations may result in content removal, account warnings, temporary suspension, 
          or permanent termination depending on severity. Repeated or severe violations may 
          be reported to law enforcement.
        </p>
      </section>
    </div>
  );
}
