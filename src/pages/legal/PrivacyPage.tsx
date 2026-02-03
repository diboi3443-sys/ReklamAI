import * as React from "react";
import { useTranslation } from "@/i18n";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          {t.legal.pages.privacy}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.legal.privacySubtitle}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.dataCollection}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We collect information you provide directly to us, including account information 
          (email, name), payment details, and content you create or upload. We also collect 
          usage data automatically through cookies and similar technologies.
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li>Account registration information</li>
          <li>Payment and billing information</li>
          <li>Generated content and prompts</li>
          <li>Usage analytics and preferences</li>
          <li>Device and browser information</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.dataUse}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We use your information to provide and improve our services, process transactions, 
          communicate with you, and ensure the security of our platform. We may use aggregated, 
          anonymized data for research and service improvement.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.dataSharing}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We do not sell your personal information. We may share data with service providers 
          who help us operate our business, or when required by law. AI model providers may 
          process your prompts to generate content, subject to their privacy policies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.dataSecurity}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We implement industry-standard security measures to protect your data, including 
          encryption in transit and at rest, secure authentication, and regular security audits. 
          However, no system is completely secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.userRights}</h2>
        <p className="text-muted-foreground leading-relaxed">
          You have the right to access, correct, or delete your personal data. You may also 
          request a copy of your data or object to certain processing activities. Contact us 
          to exercise these rights.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.retention}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We retain your data for as long as your account is active or as needed to provide 
          services. Generated content is stored according to your plan's retention period. 
          You may delete your account and associated data at any time.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.children}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Our services are not intended for users under 16 years of age. We do not knowingly 
          collect personal information from children.
        </p>
      </section>
    </div>
  );
}
