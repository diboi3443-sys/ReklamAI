import * as React from "react";
import {
  Image,
  Video,
  Sparkles,
  ArrowRight,
  Play,
  Zap,
  Star,
  Clock,
  TrendingUp,
  Bell,
  Rocket,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HomePreviewProps {
  highlightSection?: string;
}

// Simplified mock data for preview
const previewNews = [
  { id: "1", title: "Cinema Studio 2.0 Released", type: "feature" },
  { id: "2", title: "New Flux Pro Model Available", type: "model" },
  { id: "3", title: "Academy Launch Announcement", type: "update" },
];

const previewFeatured = [
  { id: "1", src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop" },
  { id: "2", src: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop" },
  { id: "3", src: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=300&h=200&fit=crop" },
  { id: "4", src: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=200&fit=crop" },
];

const previewPresets = [
  { id: "1", name: "Cinematic Portrait", mode: "image" },
  { id: "2", name: "Product Showcase", mode: "video" },
  { id: "3", name: "UGC Style", mode: "video" },
];

export default function HomePreview({ highlightSection }: HomePreviewProps) {
  const isHighlighted = (sectionId: string) => highlightSection === sectionId;

  const sectionClasses = (sectionId: string) => cn(
    "relative rounded-lg transition-all",
    isHighlighted(sectionId) && "ring-2 ring-primary ring-offset-2 ring-offset-background"
  );

  return (
    <ScrollArea className="h-full">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Banner Preview */}
        <div className={sectionClasses("global-banners")}>
          <div className="p-3 rounded-lg gradient-brand-subtle border border-primary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">🎉 New Feature</span>
              <span className="text-sm">Cinema Studio 2.0 is now available!</span>
            </div>
            <Button size="sm" variant="secondary">Try Now</Button>
          </div>
          {isHighlighted("global-banners") && (
            <Badge className="absolute -top-2 -right-2">Editing</Badge>
          )}
        </div>

        {/* Hero Section */}
        <section className={sectionClasses("home-hero")}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground mt-1">What will you create today?</p>
            </div>
            <Badge variant="glow" size="lg" className="gap-1.5">
              <Zap className="w-4 h-4" />
              247 credits
            </Badge>
          </div>
          {isHighlighted("home-hero") && (
            <Badge className="absolute -top-2 -right-2">Editing</Badge>
          )}
        </section>

        {/* Quick Actions */}
        <section className={sectionClasses("home-actions")}>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Image, label: "Image", color: "from-blue-500 to-cyan-500" },
              { icon: Video, label: "Video", color: "from-purple-500 to-pink-500" },
              { icon: Sparkles, label: "Edit", color: "from-amber-500 to-orange-500" },
              { icon: Play, label: "Cinema", color: "from-indigo-500 to-violet-500" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card flex flex-col items-center gap-2">
                <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center", item.color)}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          {isHighlighted("home-actions") && (
            <Badge className="absolute -top-2 -right-2">Editing</Badge>
          )}
        </section>

        {/* News Section */}
        <section className={sectionClasses("home-news")}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              News & Updates
            </h2>
            <Button variant="ghost" size="sm">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {previewNews.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <Badge variant="outline" size="sm" className="mb-2">{item.type}</Badge>
                  <p className="font-medium text-sm">{item.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {isHighlighted("home-news") && (
            <Badge className="absolute -top-2 -right-2">Editing</Badge>
          )}
        </section>

        {/* Featured Creations */}
        <section className={sectionClasses("home-featured")}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Featured Creations
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {previewFeatured.map((item) => (
              <div key={item.id} className="aspect-video rounded-lg overflow-hidden bg-secondary">
                <img src={item.src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {isHighlighted("home-featured") && (
            <Badge className="absolute -top-2 -right-2">Editing</Badge>
          )}
        </section>

        {/* Presets */}
        <section className={sectionClasses("home-presets")}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Presets & Templates
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {previewPresets.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <Badge variant="outline" size="sm" className="mt-1">{item.mode}</Badge>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {isHighlighted("home-presets") && (
            <Badge className="absolute -top-2 -right-2">Editing</Badge>
          )}
        </section>
      </div>
    </ScrollArea>
  );
}
