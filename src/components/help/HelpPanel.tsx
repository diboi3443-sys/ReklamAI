import * as React from "react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Bug,
  Lightbulb,
  ExternalLink,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Image,
  Video,
  Wand2,
  ChevronRight,
  ThumbsUp,
  Send,
  Monitor,
  Globe,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useToast } from "@/hooks/use-toast";

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// FAQ data structure
const faqCategories = [
  {
    id: "getting-started",
    questions: [
      { id: "what-is", answer: "academy" },
      { id: "how-credits", answer: "pricing" },
      { id: "first-generation", answer: "academy" },
    ],
  },
  {
    id: "studio",
    questions: [
      { id: "best-prompts", answer: "academy" },
      { id: "aspect-ratio", answer: "inline" },
      { id: "models-difference", answer: "inline" },
    ],
  },
  {
    id: "billing",
    questions: [
      { id: "payment-methods", answer: "inline" },
      { id: "refund-policy", answer: "inline" },
      { id: "subscription-cancel", answer: "inline" },
    ],
  },
];

// Context tips based on current route/mode
const contextTips: Record<string, Array<{ icon: React.ElementType; tipKey: string }>> = {
  "/studio": [
    { icon: Sparkles, tipKey: "promptTip" },
    { icon: Image, tipKey: "aspectTip" },
    { icon: Wand2, tipKey: "modelTip" },
  ],
  "/library": [
    { icon: Video, tipKey: "libraryTip" },
  ],
  "/boards": [
    { icon: Info, tipKey: "boardsTip" },
  ],
};

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState("faq");
  const [faqSearch, setFaqSearch] = useState("");
  
  // Contact form state
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  
  // Bug report state
  const [bugSteps, setBugSteps] = useState("");
  const [bugSeverity, setBugSeverity] = useState("");
  const [bugSubmitting, setBugSubmitting] = useState(false);
  
  // Feature request state
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [featureSubmitting, setFeatureSubmitting] = useState(false);

  // Get context tips for current route
  const currentTips = contextTips[location.pathname] || [];

  // Filter FAQ based on search
  const filteredFaq = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => {
      const questionText = t.help.faq.questions[q.id as keyof typeof t.help.faq.questions]?.question || "";
      return questionText.toLowerCase().includes(faqSearch.toLowerCase());
    }),
  })).filter(category => category.questions.length > 0);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) return;
    
    setContactSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setContactSubmitting(false);
    
    toast({
      title: t.help.contact.successTitle,
      description: t.help.contact.successMessage,
    });
    
    setContactSubject("");
    setContactMessage("");
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugSteps.trim() || !bugSeverity) return;
    
    setBugSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBugSubmitting(false);
    
    toast({
      title: t.help.bug.successTitle,
      description: t.help.bug.successMessage,
    });
    
    setBugSteps("");
    setBugSeverity("");
  };

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim() || !featureDescription.trim()) return;
    
    setFeatureSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setFeatureSubmitting(false);
    
    toast({
      title: t.help.feature.successTitle,
      description: t.help.feature.successMessage,
    });
    
    setFeatureTitle("");
    setFeatureDescription("");
  };

  // Mock metadata
  const metadata = {
    browser: "Chrome 120",
    os: "macOS 14.2",
    appVersion: "2.1.0",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle>{t.help.title}</SheetTitle>
              <p className="text-sm text-muted-foreground">{t.help.subtitle}</p>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid grid-cols-4 shrink-0">
            <TabsTrigger value="faq" className="text-xs gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.help.tabs.faq}</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.help.tabs.contact}</span>
            </TabsTrigger>
            <TabsTrigger value="bug" className="text-xs gap-1">
              <Bug className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.help.tabs.bug}</span>
            </TabsTrigger>
            <TabsTrigger value="feature" className="text-xs gap-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.help.tabs.feature}</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* Context Tips */}
            {currentTips.length > 0 && activeTab === "faq" && (
              <Card className="mb-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{t.help.contextTips.title}</span>
                  </div>
                  <div className="space-y-2">
                    {currentTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <tip.icon className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{t.help.contextTips[tip.tipKey as keyof typeof t.help.contextTips]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FAQ Tab */}
            <TabsContent value="faq" className="mt-0 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.help.faq.searchPlaceholder}
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredFaq.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredFaq.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t.help.faq.categories[category.id as keyof typeof t.help.faq.categories]}
                      </h4>
                      {category.questions.map((q) => {
                        const questionData = t.help.faq.questions[q.id as keyof typeof t.help.faq.questions];
                        return (
                          <AccordionItem key={q.id} value={q.id} className="border rounded-lg px-4">
                            <AccordionTrigger className="text-sm text-left hover:no-underline py-3">
                              {questionData?.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground pb-3">
                              {questionData?.answer}
                              {q.answer === "academy" && (
                                <Button variant="link" size="sm" className="mt-2 p-0 h-auto gap-1">
                                  {t.help.faq.learnMore}
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </div>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t.help.faq.noResults}</p>
                </div>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="mt-0">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t.help.contact.responseTime}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">{t.help.contact.subject}</Label>
                  <Input
                    id="subject"
                    placeholder={t.help.contact.subjectPlaceholder}
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    maxLength={100}
                  />
                  {contactSubject.length > 0 && contactSubject.trim().length === 0 && (
                    <p className="text-xs text-destructive">{t.help.validation.required}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t.help.contact.message}</Label>
                  <Textarea
                    id="message"
                    placeholder={t.help.contact.messagePlaceholder}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="min-h-[120px]"
                    maxLength={2000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {contactMessage.length > 0 && contactMessage.trim().length === 0 ? (
                      <span className="text-destructive">{t.help.validation.required}</span>
                    ) : (
                      <span />
                    )}
                    <span>{contactMessage.length}/2000</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t.help.contact.attachScreenshot}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t.help.contact.dropOrClick}</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full gap-2"
                  disabled={!contactSubject.trim() || !contactMessage.trim() || contactSubmitting}
                >
                  {contactSubmitting ? (
                    <>{t.common.loading}...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t.help.contact.send}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Bug Report Tab */}
            <TabsContent value="bug" className="mt-0">
              <form onSubmit={handleBugSubmit} className="space-y-4">
                {/* Auto-collected metadata */}
                <Card className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium">{t.help.bug.autoCollected}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        {metadata.browser}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-3 h-3" />
                        {metadata.os}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3" />
                        v{metadata.appVersion}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="severity">{t.help.bug.severity}</Label>
                  <Select value={bugSeverity} onValueChange={setBugSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.help.bug.selectSeverity} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          {t.help.bug.severityLow}
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          {t.help.bug.severityMedium}
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          {t.help.bug.severityHigh}
                        </div>
                      </SelectItem>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          {t.help.bug.severityCritical}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steps">{t.help.bug.stepsToReproduce}</Label>
                  <Textarea
                    id="steps"
                    placeholder={t.help.bug.stepsPlaceholder}
                    value={bugSteps}
                    onChange={(e) => setBugSteps(e.target.value)}
                    className="min-h-[120px]"
                    maxLength={2000}
                  />
                  {bugSteps.length > 0 && bugSteps.trim().length === 0 && (
                    <p className="text-xs text-destructive">{t.help.validation.required}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t.help.bug.attachScreenshot}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t.help.contact.dropOrClick}</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full gap-2"
                  disabled={!bugSteps.trim() || !bugSeverity || bugSubmitting}
                >
                  {bugSubmitting ? (
                    <>{t.common.loading}...</>
                  ) : (
                    <>
                      <Bug className="w-4 h-4" />
                      {t.help.bug.submit}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Feature Request Tab */}
            <TabsContent value="feature" className="mt-0">
              <form onSubmit={handleFeatureSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="featureTitle">{t.help.feature.title}</Label>
                  <Input
                    id="featureTitle"
                    placeholder={t.help.feature.titlePlaceholder}
                    value={featureTitle}
                    onChange={(e) => setFeatureTitle(e.target.value)}
                    maxLength={100}
                  />
                  {featureTitle.length > 0 && featureTitle.trim().length === 0 && (
                    <p className="text-xs text-destructive">{t.help.validation.required}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featureDesc">{t.help.feature.description}</Label>
                  <Textarea
                    id="featureDesc"
                    placeholder={t.help.feature.descriptionPlaceholder}
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    className="min-h-[120px]"
                    maxLength={2000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {featureDescription.length > 0 && featureDescription.trim().length === 0 ? (
                      <span className="text-destructive">{t.help.validation.required}</span>
                    ) : (
                      <span />
                    )}
                    <span>{featureDescription.length}/2000</span>
                  </div>
                </div>

                {/* Popular requests voting placeholder */}
                <div className="space-y-3">
                  <Label>{t.help.feature.popularRequests}</Label>
                  <div className="space-y-2">
                    {[
                      { id: 1, title: t.help.feature.requests.batchProcessing, votes: 234 },
                      { id: 2, title: t.help.feature.requests.apiAccess, votes: 189 },
                      { id: 3, title: t.help.feature.requests.teamWorkspaces, votes: 156 },
                    ].map((request) => (
                      <Card key={request.id} className="cursor-pointer hover:bg-secondary/50 transition-colors">
                        <CardContent className="p-3 flex items-center justify-between">
                          <span className="text-sm">{request.title}</span>
                          <Button variant="ghost" size="sm" className="gap-1.5 h-7">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="text-xs">{request.votes}</span>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full gap-2"
                  disabled={!featureTitle.trim() || !featureDescription.trim() || featureSubmitting}
                >
                  {featureSubmitting ? (
                    <>{t.common.loading}...</>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      {t.help.feature.submit}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
