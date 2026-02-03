import * as React from "react";
import { useTranslation } from "@/i18n";

export default function CookiesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          {t.legal.pages.cookies}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.legal.cookiesSubtitle}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.whatAreCookies}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Cookies are small text files stored on your device when you visit our website. 
          They help us remember your preferences, understand how you use our service, and 
          improve your experience.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.typesOfCookies}</h2>
        
        <div className="space-y-4">
          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-2">{t.legal.cookieTypes.essential}</h3>
            <p className="text-sm text-muted-foreground">
              Required for the website to function properly. These cannot be disabled and 
              include authentication tokens, session management, and security features.
            </p>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-2">{t.legal.cookieTypes.functional}</h3>
            <p className="text-sm text-muted-foreground">
              Remember your preferences like language, theme, and display settings to 
              provide a personalized experience.
            </p>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-2">{t.legal.cookieTypes.analytics}</h3>
            <p className="text-sm text-muted-foreground">
              Help us understand how visitors interact with our website by collecting 
              anonymous usage statistics. This helps us improve the service.
            </p>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-2">{t.legal.cookieTypes.marketing}</h3>
            <p className="text-sm text-muted-foreground">
              Used to deliver relevant advertisements and track campaign effectiveness. 
              These are optional and can be disabled.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.manageCookies}</h2>
        <p className="text-muted-foreground leading-relaxed">
          You can manage cookie preferences through your browser settings. Note that 
          disabling certain cookies may affect website functionality. Most browsers allow 
          you to block or delete cookies, but this may prevent you from using all features 
          of our service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.thirdParty}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We use third-party services that may set their own cookies, including analytics 
          providers and payment processors. These are governed by their respective privacy 
          policies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.updates}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We may update this Cookie Notice periodically. Significant changes will be 
          communicated through the website or email notification.
        </p>
      </section>
    </div>
  );
}
