import * as React from "react";
import { useState } from "react";
import {
  Zap,
  Check,
  Sparkles,
  Star,
  Crown,
  X,
  CreditCard,
  Tag,
  Image,
  Video,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageContainer, PageHeader, PageContent } from "@/components/ui/page-layout";
import { ConsentCheckbox } from "@/components/legal";
import { useTranslation } from "@/i18n";
import { MotionDiv, MotionList, MotionItem, MotionSection } from "@/components/ui/motion";

// Mock credit packs
const creditPacks = [
  { id: "starter", name: "Starter", credits: 100, price: 9.99, perCredit: 0.10, popular: false, examples: "~12 images or 2 videos" },
  { id: "creator", name: "Creator", credits: 300, price: 24.99, perCredit: 0.083, popular: true, examples: "~40 images or 6 videos" },
  { id: "pro", name: "Pro Pack", credits: 750, price: 49.99, perCredit: 0.067, popular: false, examples: "~100 images or 15 videos" },
  { id: "studio", name: "Studio", credits: 2000, price: 99.99, perCredit: 0.05, popular: false, examples: "~270 images or 40 videos" },
];

// Mock subscription plans
const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    credits: 25,
    features: [
      "25 credits/month",
      "Basic image generation",
      "Standard quality",
      "Community support",
    ],
    limitations: [
      "No video generation",
      "Watermarked outputs",
      "Limited models",
    ],
    icon: Sparkles,
    current: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    period: "month",
    credits: 500,
    features: [
      "500 credits/month",
      "All generation modes",
      "HD quality outputs",
      "Priority processing",
      "No watermarks",
      "Email support",
    ],
    limitations: [],
    icon: Star,
    current: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: 99,
    period: "month",
    credits: 2500,
    features: [
      "2500 credits/month",
      "Everything in Pro",
      "4K video generation",
      "API access",
      "Custom models",
      "Priority support",
      "Team collaboration",
    ],
    limitations: [],
    icon: Crown,
    current: false,
  },
];

interface CheckoutPack {
  id: string;
  name: string;
  credits: number;
  price: number;
}

export default function PricingPage() {
  const { t } = useTranslation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<CheckoutPack | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [checkoutConsent, setCheckoutConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const handleBuyCredits = (pack: CheckoutPack) => {
    setSelectedPack(pack);
    setCheckoutOpen(true);
    setCheckoutConsent(false);
    setConsentError(false);
  };

  const applyPromo = () => {
    if (promoCode.toLowerCase() === "welcome10") {
      setPromoApplied(true);
    }
  };

  const finalPrice = selectedPack 
    ? promoApplied 
      ? selectedPack.price * 0.9 
      : selectedPack.price 
    : 0;

  const handleCompletePurchase = () => {
    if (!checkoutConsent) {
      setConsentError(true);
      return;
    }
    setCheckoutOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader 
        title={t.pricing.title} 
        description={t.pricing.description}
      />

      <PageContent maxWidth="xl">
        <div className="space-y-8">
          {/* Current Balance */}
          <MotionDiv delay={0.1}>
            <Card className="border-primary/20 max-w-md mx-auto">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.pricing.yourBalance}</p>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold gradient-text">247 {t.common.credits}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>≈ 30 {t.pricing.images}</p>
                    <p>≈ 5 {t.pricing.videos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          {/* Tabs */}
          <Tabs defaultValue="packs" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="packs">{t.pricing.creditPacks}</TabsTrigger>
              <TabsTrigger value="plans">{t.pricing.subscriptionPlans}</TabsTrigger>
            </TabsList>

            {/* Credit Packs Tab */}
            <TabsContent value="packs" className="space-y-6">
              <MotionList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPacks.map((pack) => (
                  <MotionItem key={pack.id}>
                    <Card 
                      className={`relative h-full overflow-visible ${pack.popular ? 'border-primary glow-primary-sm' : ''}`}
                    >
                      {pack.popular && (
                        <Badge 
                          variant="default" 
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground whitespace-nowrap"
                        >
                          {t.pricing.bestValue}
                        </Badge>
                      )}
                      <CardHeader className={`text-center pb-2 ${pack.popular ? 'pt-6' : ''}`}>
                        <CardTitle className="text-lg">{pack.name}</CardTitle>
                        <div className="flex items-center justify-center gap-1 text-3xl font-bold">
                          <Zap className="w-6 h-6 text-primary" />
                          {pack.credits}
                        </div>
                        <CardDescription>{t.common.credits}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                        <div>
                          <p className="text-2xl font-bold">${pack.price}</p>
                          <p className="text-xs text-muted-foreground">
                            ${pack.perCredit.toFixed(3)} {t.pricing.perCredit}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Image className="w-3 h-3" />
                          <Video className="w-3 h-3" />
                          {pack.examples}
                        </div>
                        <Button 
                          className={pack.popular ? 'w-full gradient-brand' : 'w-full'}
                          variant={pack.popular ? 'default' : 'outline'}
                          onClick={() => handleBuyCredits(pack)}
                        >
                          {t.pricing.buyNow}
                        </Button>
                      </CardContent>
                    </Card>
                  </MotionItem>
                ))}
              </MotionList>
            </TabsContent>

            {/* Subscription Plans Tab */}
            <TabsContent value="plans" className="space-y-6">
              <MotionList className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <MotionItem key={plan.id}>
                    <Card 
                      className={`relative h-full ${plan.current ? 'border-primary' : ''}`}
                    >
                      {plan.current && (
                        <Badge 
                          variant="outline" 
                          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-background"
                        >
                          {t.pricing.currentPlan}
                        </Badge>
                      )}
                      <CardHeader className="text-center pb-2">
                        <div className="w-10 h-10 rounded-full gradient-brand-subtle flex items-center justify-center mx-auto mb-2">
                          <plan.icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle>{plan.name}</CardTitle>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold">
                            {plan.price === 0 ? t.pricing.free : `$${plan.price}`}
                          </span>
                          {plan.price > 0 && (
                            <span className="text-muted-foreground">/{t.pricing.month}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          {plan.credits} {t.pricing.creditsMonth}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-success shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {plan.limitations.map((limitation, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <X className="w-4 h-4 text-destructive shrink-0" />
                              <span>{limitation}</span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          className="w-full"
                          variant={plan.current ? 'outline' : 'default'}
                          disabled={plan.current}
                        >
                          {plan.current ? t.pricing.currentPlan : plan.price === 0 ? t.pricing.getStarted : t.pricing.upgrade}
                        </Button>
                      </CardContent>
                    </Card>
                  </MotionItem>
                ))}
              </MotionList>
            </TabsContent>
          </Tabs>

          {/* Credit Usage Info */}
          <MotionSection delay={0.2}>
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-lg">{t.pricing.howCreditsWork}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <Image className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="font-medium">{t.pricing.imageGen}</p>
                    <p className="text-xs text-muted-foreground">3-15 {t.common.credits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <Video className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="font-medium">{t.pricing.videoGen}</p>
                    <p className="text-xs text-muted-foreground">20-50 {t.common.credits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <Sparkles className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="font-medium">{t.pricing.upscale}</p>
                    <p className="text-xs text-muted-foreground">2-5 {t.common.credits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="font-medium">{t.editor.inpaint}</p>
                    <p className="text-xs text-muted-foreground">5-10 {t.common.credits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionSection>
        </div>
      </PageContent>

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.pricing.completePurchase}</DialogTitle>
            <DialogDescription>
              {t.pricing.youArePurchasing} {selectedPack?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPack && (
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="p-4 rounded-lg bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span>{t.common.credits}</span>
                  <div className="flex items-center gap-1 font-medium">
                    <Zap className="w-4 h-4 text-primary" />
                    {selectedPack.credits}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span>{t.common.subtotal}</span>
                  <span>${selectedPack.price.toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div className="flex items-center justify-between text-success">
                    <span>Promo (10% off)</span>
                    <span>-${(selectedPack.price * 0.1).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>{t.common.total}</span>
                  <span>${finalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <Label>{t.pricing.promoCode}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder={t.pricing.enterCode} 
                      className="pl-9"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={applyPromo}
                    disabled={promoApplied || !promoCode}
                  >
                    {promoApplied ? t.pricing.applied : t.common.apply}
                  </Button>
                </div>
                {promoApplied && (
                  <p className="text-xs text-success">{t.pricing.promoSuccess}</p>
                )}
              </div>

              {/* Payment Method Placeholder */}
              <div className="space-y-2">
                <Label>{t.pricing.paymentMethod}</Label>
                <div className="p-4 rounded-lg border border-dashed border-border flex items-center justify-center">
                  <div className="text-center">
                    <CreditCard className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t.pricing.paymentPlaceholder}</p>
                  </div>
                </div>
              </div>

              {/* Consent Checkbox */}
              <ConsentCheckbox
                type="checkout"
                checked={checkoutConsent}
                onCheckedChange={(checked) => {
                  setCheckoutConsent(checked as boolean);
                  setConsentError(false);
                }}
                error={consentError}
              />

              {/* Confirm Button */}
              <Button 
                className="w-full gradient-brand" 
                onClick={handleCompletePurchase}
                disabled={!checkoutConsent}
              >
                {t.pricing.completePayment}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}