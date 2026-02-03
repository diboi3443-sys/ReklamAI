import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Image,
  Video,
  Sparkles,
  Library,
  ArrowRight,
  Play,
  Zap,
  Star,
  Clock,
  TrendingUp,
  Bell,
  Rocket,
  Cpu,
  Wand2,
  ExternalLink,
  RefreshCw,
  Shuffle,
  ChevronRight,
  X,
  Clapperboard,
  UserCircle,
  Paintbrush,
  LayoutGrid,
  Plus,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ModeId } from "@/lib/features";
import { mockBoards } from "@/lib/boards";
import { useTranslation } from "@/i18n";
import { OnboardingModal, type OnboardingData } from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";

// Mock data for news & updates
const newsItems = [
  {
    id: "1",
    type: "feature",
    title: "Cinema Studio 2.0 Released",
    description: "Create cinematic videos with enhanced motion control and new camera presets.",
    date: "2024-01-15",
    isNew: true,
  },
  {
    id: "2",
    type: "model",
    title: "FLUX.1 Pro Now Available",
    description: "Experience the next generation of image generation with improved quality.",
    date: "2024-01-14",
    isNew: true,
  },
  {
    id: "3",
    type: "update",
    title: "Faster Video Generation",
    description: "Video processing is now 40% faster with our infrastructure upgrade.",
    date: "2024-01-12",
  },
  {
    id: "4",
    type: "announcement",
    title: "New Pricing Plans",
    description: "More credits, better value. Check out our updated pricing.",
    date: "2024-01-10",
  },
];

// Mock featured creations
const featuredCreations = [
  {
    id: "f1",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    title: "Alpine Majesty",
    creator: "Studio Team",
    type: "image",
    likes: 1247,
  },
  {
    id: "f2",
    thumbnail: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop",
    title: "Neon Dreams",
    creator: "Featured Artist",
    type: "image",
    likes: 892,
  },
  {
    id: "f3",
    thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop",
    title: "Morning Mist",
    creator: "Nature Collection",
    type: "video",
    likes: 2103,
  },
  {
    id: "f4",
    thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop",
    title: "Starlit Peaks",
    creator: "Night Sky Series",
    type: "image",
    likes: 1567,
  },
  {
    id: "f5",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
    title: "Dramatic Heights",
    creator: "Adventure Collection",
    type: "image",
    likes: 743,
  },
  {
    id: "f6",
    thumbnail: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop",
    title: "Cascade Flow",
    creator: "Water Elements",
    type: "video",
    likes: 1821,
  },
];

// Mock recent library items
const recentLibrary = [
  {
    id: "r1",
    thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop",
    prompt: "Serene lake with mountain reflection",
    mode: "image" as ModeId,
    feature: "Create Image",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "r2",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    prompt: "Professional portrait with studio lighting",
    mode: "character" as ModeId,
    feature: "Create Character",
    createdAt: "2024-01-14T15:45:00Z",
  },
  {
    id: "r3",
    thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop",
    prompt: "Futuristic cityscape at dusk",
    mode: "video" as ModeId,
    feature: "Create Video",
    createdAt: "2024-01-13T09:00:00Z",
  },
  {
    id: "r4",
    thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
    prompt: "Sunset over rolling hills",
    mode: "image" as ModeId,
    feature: "Relight",
    createdAt: "2024-01-12T20:15:00Z",
  },
];

// Mock presets & templates
const featuredPresets = [
  {
    id: "p1",
    name: "Cinematic Portrait",
    description: "Professional headshots with film-like quality",
    mode: "image" as ModeId,
    feature: "cinema-image",
    uses: 12500,
    trending: true,
  },
  {
    id: "p2",
    name: "Product Showcase",
    description: "Clean, commercial product photography",
    mode: "image" as ModeId,
    feature: "create-image",
    uses: 8300,
  },
  {
    id: "p3",
    name: "Motion Loop",
    description: "Seamless looping video animations",
    mode: "video" as ModeId,
    feature: "create-video",
    uses: 6700,
    trending: true,
  },
  {
    id: "p4",
    name: "Face Swap Pro",
    description: "High-fidelity face replacement",
    mode: "character" as ModeId,
    feature: "face-swap",
    uses: 4200,
  },
];

// Mode icons for quick actions
const modeConfig = {
  image: { icon: Image, label: "Create Image", color: "from-blue-500 to-cyan-500" },
  video: { icon: Video, label: "Create Video", color: "from-purple-500 to-pink-500" },
  edit: { icon: Wand2, label: "AI Edit", color: "from-amber-500 to-orange-500" },
  character: { icon: UserCircle, label: "Character", color: "from-green-500 to-emerald-500" },
  inpaint: { icon: Paintbrush, label: "Inpaint", color: "from-rose-500 to-red-500" },
  cinema: { icon: Clapperboard, label: "Cinema", color: "from-indigo-500 to-violet-500" },
};

// News type icons
const newsTypeIcons = {
  feature: Rocket,
  model: Cpu,
  update: TrendingUp,
  announcement: Bell,
};

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [previewItem, setPreviewItem] = React.useState<typeof featuredCreations[0] | null>(null);
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding();

  const handleModeClick = (mode: ModeId) => {
    navigate(`/studio?mode=${mode}`);
  };

  const handleOpenLibrary = (itemId: string) => {
    navigate(`/studio?load=${itemId}`);
  };

  const handleUsePreset = (preset: typeof featuredPresets[0]) => {
    navigate(`/studio?mode=${preset.mode}&feature=${preset.feature}`);
  };

  // Mode config with translations
  const modeConfigTranslated = {
    image: { icon: Image, label: t.modes.createImage, color: "from-blue-500 to-cyan-500" },
    video: { icon: Video, label: t.modes.createVideo, color: "from-purple-500 to-pink-500" },
    edit: { icon: Wand2, label: t.modes.aiEdit, color: "from-amber-500 to-orange-500" },
    character: { icon: UserCircle, label: t.modes.createCharacter, color: "from-green-500 to-emerald-500" },
    inpaint: { icon: Paintbrush, label: t.modes.inpaint, color: "from-rose-500 to-red-500" },
    cinema: { icon: Clapperboard, label: t.modes.cinema, color: "from-indigo-500 to-violet-500" },
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
          {/* Welcome Header */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {t.home.welcomeBack}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t.home.whatWillYouCreate}
                </p>
              </div>
              <Badge variant="glow" size="lg" className="gap-1.5">
                <Zap className="w-4 h-4" />
                247 {t.common.credits}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(Object.entries(modeConfigTranslated) as [ModeId, typeof modeConfigTranslated.image][]).map(([mode, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeClick(mode)}
                    className={cn(
                      "group relative p-4 rounded-xl border border-border bg-card",
                      "hover:border-primary/50 hover:shadow-glow-sm transition-all duration-200",
                      "flex flex-col items-center gap-2 text-center"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                      config.color
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="lg" onClick={() => navigate("/studio")}>
                <Sparkles className="w-4 h-4" />
                {t.home.openStudio}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/library")}>
                <Library className="w-4 h-4" />
                {t.home.viewLibrary}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/boards")}>
                <LayoutGrid className="w-4 h-4" />
                {t.boards.title}
              </Button>
            </div>
          </section>

          {/* Your Boards Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{t.boards.yourBoards}</h2>
                <Badge variant="outline" size="sm">
                  <LayoutGrid className="w-3 h-3" />
                  {mockBoards.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/boards")}>
                  {t.common.viewAll}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockBoards.slice(0, 4).map((board) => (
                <Card
                  key={board.id}
                  variant="interactive"
                  className="overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/boards/${board.id}`)}
                >
                  <div className="relative aspect-video">
                    {board.thumbnail ? (
                      <img
                        src={board.thumbnail}
                        alt={board.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <LayoutGrid className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {board.isPinned && (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 bg-black/60 border-0"
                      >
                        <Pin className="w-3 h-3" />
                      </Badge>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="font-medium text-white truncate">{board.name}</h3>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {board.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {board.itemsCount} {t.boards.items}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(board.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* News & Updates */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.home.newsAndUpdates}</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {t.common.viewAll}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {newsItems.map((item) => {
                const TypeIcon = newsTypeIcons[item.type as keyof typeof newsTypeIcons];
                return (
                  <Card key={item.id} variant="interactive" className="cursor-pointer group">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          item.type === "feature" && "bg-primary/10 text-primary",
                          item.type === "model" && "bg-purple-500/10 text-purple-500",
                          item.type === "update" && "bg-green-500/10 text-green-500",
                          item.type === "announcement" && "bg-amber-500/10 text-amber-500"
                        )}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        {item.isNew && (
                          <Badge variant="info" size="sm">{t.common.new}</Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <span className="text-xs text-muted-foreground/60">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Featured Creations */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{t.home.featuredCreations}</h2>
                <Badge variant="secondary" size="sm">{t.home.inspiration}</Badge>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {t.common.exploreMore}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {featuredCreations.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.type === "video" && (
                        <Badge variant="secondary" size="sm" className="bg-black/50 border-0">
                          <Play className="w-3 h-3" />
                          {t.common.video}
                        </Badge>
                      )}
                      <span className="text-xs text-white/70 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {item.likes.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Your Library - Quick Access */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{t.home.yourLibrary}</h2>
                <Badge variant="outline" size="sm">
                  <Clock className="w-3 h-3" />
                  {t.common.recent}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
                {t.common.viewAll}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentLibrary.map((item) => {
                const ModeIcon = modeConfig[item.mode]?.icon || Image;
                return (
                  <Card key={item.id} variant="interactive" className="overflow-hidden group">
                    <div className="relative aspect-square">
                      <img
                        src={item.thumbnail}
                        alt={item.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLibrary(item.id);
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t.common.open}
                        </Button>
                      </div>
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 bg-black/60 border-0"
                      >
                        <ModeIcon className="w-3 h-3" />
                        {item.feature}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm truncate">{item.prompt}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                            <Shuffle className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Presets & Templates */}
          <section className="space-y-4 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{t.home.presetsAndTemplates}</h2>
                <Badge variant="gradient" size="sm">
                  <TrendingUp className="w-3 h-3" />
                  {t.common.popular}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {t.common.browseAll}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredPresets.map((preset) => {
                const ModeIcon = modeConfig[preset.mode]?.icon || Sparkles;
                return (
                  <Card key={preset.id} variant="interactive" className="group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                          modeConfig[preset.mode]?.color || "from-gray-500 to-gray-600"
                        )}>
                          <ModeIcon className="w-5 h-5 text-white" />
                        </div>
                        {preset.trending && (
                          <Badge variant="warning" size="sm" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {t.home.trending}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{preset.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {preset.uses.toLocaleString()} {t.home.uses}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUsePreset(preset)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t.common.apply}
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Preview Modal for Featured Creations */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
          {previewItem && (
            <>
              <div className="relative aspect-video">
                <img
                  src={previewItem.thumbnail}
                  alt={previewItem.title}
                  className="w-full h-full object-cover"
                />
                {previewItem.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{previewItem.title}</h3>
                    <p className="text-sm text-muted-foreground">by {previewItem.creator}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Star className="w-3 h-3" />
                      {previewItem.likes.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {previewItem.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  );
}
