import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Zap,
  CreditCard,
  Receipt,
  History,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Image,
  Video,
  Wand2,
  ExternalLink,
  Filter,
  Calendar,
  Eye,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer, PageHeader, PageContent } from "@/components/ui/page-layout";
import { TrustSection } from "@/components/legal";
import { useTranslation } from "@/i18n";

// Mock data for credit ledger
const mockLedger = [
  { id: "1", date: "2024-01-09T14:30:00", type: "purchase", amount: 500, balance: 747, reference: "order_abc123" },
  { id: "2", date: "2024-01-09T12:15:00", type: "generation", amount: -8, balance: 247, reference: "gen_xyz789" },
  { id: "3", date: "2024-01-09T11:45:00", type: "generation", amount: -12, balance: 255, reference: "gen_xyz788" },
  { id: "4", date: "2024-01-08T16:20:00", type: "generation", amount: -5, balance: 267, reference: "gen_xyz787" },
  { id: "5", date: "2024-01-08T10:00:00", type: "refund", amount: 15, balance: 272, reference: "refund_001" },
  { id: "6", date: "2024-01-07T14:30:00", type: "generation", amount: -20, balance: 257, reference: "gen_xyz786" },
  { id: "7", date: "2024-01-06T09:00:00", type: "adjustment", amount: 50, balance: 277, reference: "promo_winter" },
  { id: "8", date: "2024-01-05T18:45:00", type: "generation", amount: -3, balance: 227, reference: "gen_xyz785" },
];

// Mock data for recent generations
const mockGenerations = [
  { id: "gen_001", thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop", mode: "image", feature: "Text to Image", model: "Flux Pro", cost: 8, status: "ready", date: "2024-01-09T14:30:00" },
  { id: "gen_002", thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop", mode: "video", feature: "Image to Video", model: "Runway Gen-3", cost: 25, status: "ready", date: "2024-01-09T12:15:00" },
  { id: "gen_003", thumbnail: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=100&h=100&fit=crop", mode: "image", feature: "Inpaint", model: "SDXL", cost: 5, status: "ready", date: "2024-01-08T16:20:00" },
  { id: "gen_004", thumbnail: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=100&h=100&fit=crop", mode: "image", feature: "Upscale", model: "Real-ESRGAN", cost: 3, status: "error", date: "2024-01-08T10:00:00" },
];

// Mock invoices
const mockInvoices = [
  { id: "inv_001", date: "2024-01-09", amount: "$49.99", status: "paid", credits: 500 },
  { id: "inv_002", date: "2024-01-01", amount: "$19.99", status: "paid", credits: 200 },
  { id: "inv_003", date: "2023-12-15", amount: "$99.99", status: "paid", credits: 1200 },
];

type LedgerType = "all" | "purchase" | "generation" | "refund" | "adjustment";

export default function AccountPage() {
  const { t } = useTranslation();
  const [ledgerFilter, setLedgerFilter] = useState<LedgerType>("all");

  const filteredLedger = ledgerFilter === "all" 
    ? mockLedger 
    : mockLedger.filter(item => item.type === ledgerFilter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "purchase": return <ArrowUpRight className="w-4 h-4 text-success" />;
      case "generation": return <ArrowDownRight className="w-4 h-4 text-destructive" />;
      case "refund": return <RefreshCw className="w-4 h-4 text-info" />;
      case "adjustment": return <Minus className="w-4 h-4 text-warning" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "purchase": return t.account.purchases;
      case "generation": return t.account.generations;
      case "refund": return t.account.refunds;
      case "adjustment": return t.account.adjustments;
      default: return type;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      purchase: "default",
      generation: "secondary",
      refund: "outline",
      adjustment: "outline",
    };
    return <Badge variant={variants[type] || "secondary"}>{getTypeLabel(type)}</Badge>;
  };

  const getModeIcon = (mode: string) => {
    return mode === "video" ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />;
  };

  return (
    <PageContainer>
      <PageHeader 
        title={t.account.title} 
        description={t.account.description}
      />

      <PageContent maxWidth="xl">
        <div className="space-y-6">

          {/* Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">John Creator</p>
                    <p className="text-sm text-muted-foreground truncate">john@example.com</p>
                  </div>
                  <Badge variant="glow" size="sm">Pro</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Credits Balance */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.account.creditBalance}</p>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-3xl font-bold gradient-text">247</span>
                    </div>
                  </div>
                  <Link to="/pricing">
                    <Button size="sm" className="gradient-brand">
                      {t.account.buyCredits}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">{t.account.quickActions}</p>
                <div className="flex gap-2">
                  <Link to="/pricing">
                    <Button variant="outline" size="sm">
                      <CreditCard className="w-4 h-4 mr-1" />
                      {t.account.billing}
                    </Button>
                  </Link>
                  <Link to="/library">
                    <Button variant="outline" size="sm">
                      <History className="w-4 h-4 mr-1" />
                      {t.account.history}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">{t.account.creditActivity}</TabsTrigger>
              <TabsTrigger value="usage">{t.account.usageHistory}</TabsTrigger>
              <TabsTrigger value="billing">{t.account.billingPayments}</TabsTrigger>
            </TabsList>

            {/* Credit Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t.account.creditLedger}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={ledgerFilter} onValueChange={(v) => setLedgerFilter(v as LedgerType)}>
                        <SelectTrigger className="w-[140px] h-8">
                          <Filter className="w-3 h-3 mr-2" />
                          <SelectValue placeholder={t.common.filter} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t.account.allTypes}</SelectItem>
                          <SelectItem value="purchase">{t.account.purchases}</SelectItem>
                          <SelectItem value="generation">{t.account.generations}</SelectItem>
                          <SelectItem value="refund">{t.account.refunds}</SelectItem>
                          <SelectItem value="adjustment">{t.account.adjustments}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.common.date}</TableHead>
                        <TableHead>{t.common.type}</TableHead>
                        <TableHead className="text-right">{t.common.credits}</TableHead>
                        <TableHead className="text-right">{t.account.balance}</TableHead>
                        <TableHead>{t.account.reference}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLedger.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              {getTypeBadge(item.type)}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${item.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                            {item.amount > 0 ? '+' : ''}{item.amount}
                          </TableCell>
                          <TableCell className="text-right">{item.balance}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {item.reference}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage History Tab */}
            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t.account.recentGenerations}</CardTitle>
                  <CardDescription>{t.account.yourLatestCreations}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockGenerations.map((gen) => (
                      <div key={gen.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                        <img 
                          src={gen.thumbnail} 
                          alt="" 
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getModeIcon(gen.mode)}
                            <span className="font-medium">{gen.feature}</span>
                            <Badge variant="outline" size="sm">{gen.model}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {gen.cost} {t.common.credits}
                            </span>
                            <span>{new Date(gen.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge 
                          variant={gen.status === "ready" ? "default" : "destructive"}
                        >
                          {gen.status === "ready" ? t.common.ready : t.common.error}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link to="/library">
                      <Button variant="outline">
                        {t.account.viewFullLibrary}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.account.paymentMethods}</CardTitle>
                    <CardDescription>{t.account.managePaymentOptions}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-center">
                      <CreditCard className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">{t.account.noPaymentMethods}</p>
                      <Button variant="outline" size="sm">{t.account.addPaymentMethod}</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t.account.currentPlan}</CardTitle>
                    <CardDescription>{t.account.subscriptionDetails}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Pro Plan</span>
                          <Badge variant="glow" size="sm">{t.account.active}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{t.account.nextBilling}: Feb 9, 2024</p>
                      </div>
                      <Link to="/pricing">
                        <Button variant="outline" size="sm">
                          {t.account.changePlan}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invoices */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t.account.invoiceHistory}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.common.date}</TableHead>
                        <TableHead>{t.account.invoiceId}</TableHead>
                        <TableHead>{t.common.credits}</TableHead>
                        <TableHead>{t.account.amount}</TableHead>
                        <TableHead>{t.common.status}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {invoice.credits}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{invoice.amount}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-success border-success/30">
                              {t.account.paid}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Receipt className="w-4 h-4 mr-1" />
                              {t.common.download}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Trust Section */}
              <TrustSection />
            </TabsContent>
          </Tabs>

        </div>
      </PageContent>
    </PageContainer>
  );
}