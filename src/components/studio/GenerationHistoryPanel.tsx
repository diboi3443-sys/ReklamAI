import * as React from "react";
import { useState, useEffect } from "react";
import {
  History,
  X,
  ChevronRight,
  Image,
  Video,
  Download,
  RefreshCw,
  Shuffle,
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Zap,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { generationsApi, type GenerationItem } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

// Types
interface HistoryItem {
  id: string;
  type: "image" | "video";
  thumbnail: string;
  prompt: string;
  preset: string;
  model: string;
  aspectRatio: string;
  credits: number;
  status: "done" | "processing" | "failed";
  progress?: number;
  createdAt: Date;
}

// Supabase data types
interface GenerationAsset {
  kind: string;
  storage_path: string;
  storage_bucket: string;
}

interface GenerationPreset {
  title_ru?: string;
  title_en?: string;
  type?: string;
}

interface GenerationModel {
  title?: string;
  provider?: string;
  key?: string;
}

interface GenerationRecord {
  id: string;
  status: string;
  modality: string;
  prompt: string;
  progress?: number;
  final_credits?: number;
  estimated_credits?: number;
  created_at: string;
  presets?: GenerationPreset;
  models?: GenerationModel;
  assets?: GenerationAsset[];
}

const mockHistoryData: HistoryItem[] = [
  {
    id: "gen-001",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
    prompt: "Futuristic city skyline at sunset with neon lights",
    preset: "Image Gen",
    model: "FLUX.1",
    aspectRatio: "16:9",
    credits: 1,
    status: "done",
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "gen-002",
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=200&fit=crop",
    prompt: "Product showcase with dynamic camera movement",
    preset: "Video Gen",
    model: "Runway Gen-3",
    aspectRatio: "9:16",
    credits: 5,
    status: "done",
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "gen-003",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
    prompt: "Abstract geometric pattern in vibrant colors",
    preset: "Image Gen",
    model: "SDXL",
    aspectRatio: "1:1",
    credits: 1,
    status: "done",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "gen-004",
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
    prompt: "Headphones floating with musical notes",
    preset: "Video Gen",
    model: "Pika",
    aspectRatio: "16:9",
    credits: 5,
    status: "done",
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: "gen-005",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&h=200&fit=crop",
    prompt: "Gradient background with soft blur effect",
    preset: "Image Gen",
    model: "FLUX.1",
    aspectRatio: "4:3",
    credits: 1,
    status: "failed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: "gen-006",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=200&h=200&fit=crop",
    prompt: "Minimal desk setup with tech accessories",
    preset: "Image Gen",
    model: "Midjourney",
    aspectRatio: "16:9",
    credits: 1,
    status: "done",
    createdAt: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    id: "gen-007",
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    prompt: "Fashion brand intro animation",
    preset: "Video Gen",
    model: "Kling",
    aspectRatio: "9:16",
    credits: 5,
    status: "done",
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: "gen-008",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200&fit=crop",
    prompt: "Corporate meeting room with modern design",
    preset: "Image Gen",
    model: "SDXL",
    aspectRatio: "16:9",
    credits: 1,
    status: "done",
    createdAt: new Date(Date.now() - 1000 * 60 * 180),
  },
];

// Current processing job mock
const mockCurrentJob: HistoryItem | null = {
  id: "gen-current",
  type: "video",
  thumbnail: "",
  prompt: "Epic cinematic drone shot over mountains at golden hour",
  preset: "Video Gen",
  model: "Runway Gen-3",
  aspectRatio: "16:9",
  credits: 5,
  status: "processing",
  progress: 65,
  createdAt: new Date(),
};

interface GenerationHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem?: (item: HistoryItem) => void;
}

export function GenerationHistoryPanel({
  open,
  onOpenChange,
  onSelectItem,
}: GenerationHistoryPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentJob, setCurrentJob] = useState<HistoryItem | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load generations from API
  useEffect(() => {
    async function loadGenerations() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await generationsApi.list({ limit: 20 });
        const records = data.items || [];

        // Find current processing job
        const processing = records.find((g) => g.status === 'queued' || g.status === 'processing');
        if (processing) {
          setCurrentJob({
            id: processing.id,
            type: (processing.modality === 'video' ? 'video' : 'image') as 'image' | 'video',
            thumbnail: processing.thumbnail_url || '',
            prompt: processing.prompt,
            preset: processing.preset?.title_en || processing.preset_slug || 'Generation',
            model: processing.model?.title || processing.model_slug || 'Unknown',
            aspectRatio: processing.input?.params?.aspect_ratio || '16:9',
            credits: Number(processing.credits_final || processing.credits_reserved || 0),
            status: 'processing',
            progress: processing.progress,
            createdAt: new Date(processing.created_at),
          });
        }

        // Convert to history items
        const items: HistoryItem[] = records.slice(0, 10).map((g) => ({
          id: g.id,
          type: (g.modality === 'video' ? 'video' : 'image') as 'image' | 'video',
          thumbnail: g.thumbnail_url || g.result_url || '',
          prompt: g.prompt,
          preset: g.preset?.title_en || g.preset_slug || 'Generation',
          model: g.model?.title || g.model_slug || 'Unknown',
          aspectRatio: '16:9',
          credits: Number(g.credits_final || g.credits_reserved || 0),
          status: g.status === 'succeeded' ? 'done' : g.status === 'failed' ? 'failed' : 'processing',
          progress: g.progress,
          createdAt: new Date(g.created_at),
        }));

        setHistoryItems(items);
      } catch (err) {
        console.error('Failed to load generation history:', err);
      }
      setLoading(false);
    }

    if (open) {
      loadGenerations();
    }
  }, [open, user]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t.time.justNow;
    if (diffMins < 60) return `${diffMins} ${t.time.min}`;
    if (diffHours < 24) return `${diffHours} ${t.time.hour}`;
    return `${diffDays} ${t.time.daysAgo}`;
  };

  const getStatusIcon = (status: HistoryItem["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "processing":
        return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
      case "failed":
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    }
  };

  const getStatusLabel = (status: HistoryItem["status"]) => {
    switch (status) {
      case "done":
        return t.common.ready;
      case "processing":
        return t.common.generating;
      case "failed":
        return t.common.error;
    }
  };

  const handleItemClick = (item: HistoryItem) => {
    if (item.status === "done" && onSelectItem) {
      onSelectItem(item);
    }
  };

  if (!open) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed right-4 top-20 z-40 shadow-lg bg-card border-border"
            onClick={() => onOpenChange(true)}
          >
            <History className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {t.history.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">{t.history.title}</h2>
          <Badge variant="secondary" size="sm">
            {historyItems.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Current Processing Job */}
          {currentJob && currentJob.status === "processing" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-xs font-medium text-primary">
                  {t.history.currentGeneration}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-md bg-secondary/50 flex items-center justify-center shrink-0">
                    {currentJob.type === "image" ? (
                      <Image className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Video className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {currentJob.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" size="sm">
                        {currentJob.model}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {currentJob.aspectRatio}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t.history.processing}</span>
                    <span className="text-primary font-medium">{currentJob.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full gradient-brand rounded-full transition-all duration-300"
                      style={{ width: `${currentJob.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {t.history.recentGenerations}
              </span>
            </div>

            {historyItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group p-2 rounded-lg border border-border bg-card/50 hover:bg-secondary/50 transition-colors cursor-pointer",
                  item.status === "failed" && "opacity-60"
                )}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0 bg-secondary">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === "image" ? (
                          <Image className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Video className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute bottom-1 left-1">
                      <Badge variant="secondary" size="sm" className="px-1 py-0 text-[10px]">
                        {item.type === "image" ? (
                          <Image className="w-2.5 h-2.5" />
                        ) : (
                          <Video className="w-2.5 h-2.5" />
                        )}
                      </Badge>
                    </div>
                    {/* Play button for video */}
                    {item.type === "video" && item.status === "done" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" size="sm" className="text-[10px] px-1.5">
                        {item.model}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {item.aspectRatio}
                      </span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        {item.credits}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-[10px] text-muted-foreground">
                        {getStatusLabel(item.status)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t.common.rerun}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shuffle className="w-4 h-4 mr-2" />
                        {t.common.remix}
                      </DropdownMenuItem>
                      {item.type === "image" && (
                        <DropdownMenuItem>
                          <Play className="w-4 h-4 mr-2" />
                          {t.history.useAsStartFrame}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        {t.common.download}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => window.location.href = "/library"}
        >
          {t.history.viewFullLibrary}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
