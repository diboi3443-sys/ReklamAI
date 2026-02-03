import * as React from "react";
import {
  DollarSign,
  Zap,
  TrendingUp,
  Users,
  Image,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, PageContent, PageSection } from "@/components/ui/page-layout";
import { useTranslation } from "@/i18n";

// Mock KPI data
const kpis = [
  { 
    titleKey: "totalRevenue", 
    value: "$12,847", 
    change: "+12.5%", 
    trend: "up" as const,
    icon: DollarSign,
    descriptionKey: "thisMonth"
  },
  { 
    titleKey: "creditsSold", 
    value: "145,200", 
    change: "+8.2%", 
    trend: "up" as const,
    icon: Zap,
    descriptionKey: "thisMonth"
  },
  { 
    titleKey: "creditsSpent", 
    value: "98,450", 
    change: "+15.3%", 
    trend: "up" as const,
    icon: TrendingUp,
    descriptionKey: "byUsers"
  },
  { 
    titleKey: "profitEstimate", 
    value: "$4,128", 
    change: "+5.7%", 
    trend: "up" as const,
    icon: DollarSign,
    descriptionKey: "afterCosts"
  },
  { 
    titleKey: "activeUsers", 
    value: "1,247", 
    change: "+3.1%", 
    trend: "up" as const,
    icon: Users,
    descriptionKey: "last30Days"
  },
  { 
    titleKey: "generationsToday", 
    value: "3,891", 
    change: "-2.4%", 
    trend: "down" as const,
    icon: Image,
    descriptionKey: "allModes"
  },
];

// Mock recent activity
const recentActivity = [
  { type: "purchase", user: "john@example.com", amount: "$49.99", credits: 500, time: "2 min ago" },
  { type: "generation", user: "sarah@example.com", model: "Flux Pro", cost: 12, time: "5 min ago" },
  { type: "signup", user: "mike@example.com", plan: "Pro", time: "12 min ago" },
  { type: "generation", user: "anna@example.com", model: "Runway Gen-3", cost: 35, time: "15 min ago" },
  { type: "purchase", user: "david@example.com", amount: "$99.99", credits: 2000, time: "23 min ago" },
  { type: "generation", user: "lisa@example.com", model: "SDXL", cost: 5, time: "28 min ago" },
];

// Mock model usage stats
const modelUsage = [
  { name: "Flux Pro", usage: 35, revenue: "$1,245" },
  { name: "Runway Gen-3", usage: 28, revenue: "$2,890" },
  { name: "SDXL", usage: 20, revenue: "$456" },
  { name: "Midjourney v6", usage: 12, revenue: "$678" },
  { name: "Other", usage: 5, revenue: "$234" },
];

export default function AdminDashboard() {
  const { t } = useTranslation();

  const getKpiTitle = (key: string) => {
    switch (key) {
      case "totalRevenue": return t.admin.totalRevenue;
      case "creditsSold": return t.admin.creditsSold;
      case "creditsSpent": return t.admin.creditsSpent;
      case "profitEstimate": return t.admin.profitEstimate;
      case "activeUsers": return t.admin.activeUsers;
      case "generationsToday": return t.admin.totalGenerations;
      default: return key;
    }
  };

  const getDescription = (key: string) => {
    switch (key) {
      case "thisMonth": return t.admin.thisMonth;
      case "byUsers": return t.admin.byUsers;
      case "afterCosts": return t.admin.afterCosts;
      case "last30Days": return t.admin.last30Days;
      case "allModes": return t.admin.allModes;
      default: return key;
    }
  };

  const getActivityDescription = (activity: typeof recentActivity[0]) => {
    if (activity.type === 'purchase') {
      return `${t.admin.purchased} ${activity.credits} ${t.common.credits}`;
    }
    if (activity.type === 'generation') {
      return `${t.admin.generatedWith} ${activity.model}`;
    }
    if (activity.type === 'signup') {
      return `${t.admin.signedUpFor} ${activity.plan}`;
    }
    return '';
  };

  return (
    <PageContainer>
      <PageHeader 
        title={t.admin.dashboard} 
        description={t.admin.overview}
      >
        <Button variant="outline" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          {t.admin.last30Days}
        </Button>
        <Button size="sm">
          <Activity className="w-4 h-4 mr-2" />
          {t.admin.liveView}
        </Button>
      </PageHeader>

      <PageContent>
        <div className="space-y-6">
          {/* KPI Grid */}
          <PageSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map((kpi) => (
                <Card key={kpi.titleKey}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{getKpiTitle(kpi.titleKey)}</p>
                        <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                        <p className="text-xs text-muted-foreground">{getDescription(kpi.descriptionKey)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <kpi.icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge 
                          variant={kpi.trend === "up" ? "default" : "destructive"} 
                          size="sm"
                          className="flex items-center gap-0.5"
                        >
                          {kpi.trend === "up" ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {kpi.change}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </PageSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <PageSection title={t.admin.recentActivity}>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            activity.type === 'purchase' ? 'bg-success' :
                            activity.type === 'generation' ? 'bg-primary' :
                            'bg-info'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{activity.user}</p>
                            <p className="text-xs text-muted-foreground">
                              {getActivityDescription(activity)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-medium">
                            {activity.type === 'purchase' && activity.amount}
                            {activity.type === 'generation' && `${activity.cost} cr`}
                            {activity.type === 'signup' && t.common.new}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </PageSection>

            {/* Model Usage */}
            <PageSection title={t.admin.modelUsage}>
              <Card>
                <CardContent className="p-4 space-y-4">
                  {modelUsage.map((model) => (
                    <div key={model.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{model.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{model.usage}%</span>
                          <span className="font-medium w-16 text-right">{model.revenue}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full gradient-brand rounded-full transition-all"
                          style={{ width: `${model.usage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </PageSection>
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}