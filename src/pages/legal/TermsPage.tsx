import * as React from "react";
import { useTranslation } from "@/i18n";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          {t.legal.pages.terms}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.legal.termsSubtitle}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.acceptance}</h2>
        <p className="text-muted-foreground leading-relaxed">
          By accessing or using ReklamAI services, you agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use our services. We reserve the right 
          to modify these terms at any time, and your continued use of the service constitutes 
          acceptance of any changes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.services}</h2>
        <p className="text-muted-foreground leading-relaxed">
          ReklamAI provides AI-powered content generation tools including but not limited to 
          image generation, video generation, and editing capabilities. We strive to provide 
          reliable services but cannot guarantee uninterrupted access or specific results from 
          AI-generated content.
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li>Image and video generation using AI models</li>
          <li>Content editing and enhancement tools</li>
          <li>Asset management and organization features</li>
          <li>Academy learning resources</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.userConduct}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Users agree to use our services responsibly and in compliance with all applicable laws. 
          You must not use the service to generate content that is illegal, harmful, threatening, 
          abusive, harassing, defamatory, or otherwise objectionable.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.intellectualProperty}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Content you create using our tools belongs to you, subject to our Content Policy. 
          You grant us a limited license to use, store, and process your content as necessary 
          to provide the service. Our platform, including its design, code, and AI models, 
          remains our intellectual property.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.credits}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Credits are used to access generation features. Credits are non-transferable and 
          expire according to the terms of your subscription plan. Unused credits may be 
          refunded according to our Refund Policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.limitation}</h2>
        <p className="text-muted-foreground leading-relaxed">
          To the maximum extent permitted by law, ReklamAI shall not be liable for any 
          indirect, incidental, special, consequential, or punitive damages resulting from 
          your use of or inability to use the service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.termination}</h2>
        <p className="text-muted-foreground leading-relaxed">
          We may suspend or terminate your access to the service at any time for violations 
          of these terms or for any other reason. Upon termination, your right to use the 
          service ceases immediately.
        </p>
      </section>
    </div>
  );
}
