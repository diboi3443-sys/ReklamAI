import * as React from "react";
import { useTranslation } from "@/i18n";

export default function RefundPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          {t.legal.pages.refund}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.legal.refundSubtitle}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.creditRefunds}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Unused credits may be refunded within 14 days of purchase. Partially used credit 
          packs may be eligible for a prorated refund at our discretion. Refunds are processed 
          to the original payment method within 5-10 business days.
        </p>
        <div className="bg-secondary/30 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>{t.legal.note}:</strong> Credits obtained through promotions, bonuses, 
            or free trials are non-refundable.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.subscriptionRefunds}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Subscription cancellations are effective at the end of the current billing period. 
          We do not offer partial refunds for unused subscription time. You retain access to 
          premium features until your subscription period ends.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.failedGenerations}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Credits used for failed generations due to technical issues on our end will be 
          automatically refunded to your account. If you notice a discrepancy, please contact 
          support within 7 days.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.howToRequest}</h2>
        <p className="text-muted-foreground leading-relaxed">
          To request a refund, contact our support team through the Help panel or email 
          support@reklamai.com. Please include your account email and transaction details. 
          We aim to respond to all refund requests within 48 hours.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t.legal.sections.exceptions}</h2>
        <p className="text-muted-foreground leading-relaxed">
          Refunds may be denied if there is evidence of abuse, fraud, or violation of our 
          Terms of Service. Excessive refund requests may result in account restrictions.
        </p>
      </section>
    </div>
  );
}
