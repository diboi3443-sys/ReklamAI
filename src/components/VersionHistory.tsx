import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  Shuffle,
  Copy,
  Play,
  Check,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Crop,
  Sun,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export type VersionType = "generated" | "edited" | "variation" | "upscaled" | "relit" | "cropped";

export interface Version {
  id: string;
  thumbnail: string;
  timestamp: Date;
  isActive: boolean;
  parentId?: string;
  type?: VersionType;
  editLabel?: string;
}

interface VersionHistoryProps {
  versions: Version[];
  activeVersionId: string;
  onSelectVersion: (versionId: string) => void;
  onAction: (action: "rerun" | "remix" | "variation" | "startframe" | "edit", versionId: string) => void;
}

const typeIcons: Record<VersionType, React.ElementType> = {
  generated: Sparkles,
  edited: Wand2,
  variation: Shuffle,
  upscaled: TrendingUp,
  relit: Sun,
  cropped: Crop,
};

export function VersionHistory({
  versions,
  activeVersionId,
  onSelectVersion,
  onAction,
}: VersionHistoryProps) {
  const { t } = useTranslation();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const typeLabels: Record<VersionType, string> = {
    generated: t.studio.generated,
    edited: t.studio.edited,
    variation: t.common.variation,
    upscaled: t.studio.upscaled,
    relit: t.studio.relit,
    cropped: t.studio.cropped,
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -150 : 150;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Auto-scroll to active version
  React.useEffect(() => {
    if (scrollRef.current && activeVersionId) {
      const activeElement = scrollRef.current.querySelector(`[data-version-id="${activeVersionId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeVersionId]);

  if (versions.length === 0) return null;

  return (
    <div className="border-t border-border bg-card shrink-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.studio.versionHistory}
          </h3>
          <Badge variant="secondary" size="sm">
            {versions.length} {t.studio.versions}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => scroll("left")}
            disabled={versions.length <= 4}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => scroll("right")}
            disabled={versions.length <= 4}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 p-3 overflow-x-auto scrollbar-thin scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {versions.map((version, index) => {
          const isActive = version.id === activeVersionId;
          const isOriginal = index === 0;
          const versionType = version.type || "generated";
          const TypeIcon = typeIcons[versionType];

          return (
            <div
              key={version.id}
              data-version-id={version.id}
              className={cn(
                "group relative shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all",
                "w-24 border-2",
                isActive
                  ? "border-primary shadow-glow-sm"
                  : "border-transparent hover:border-border"
              )}
              onClick={() => onSelectVersion(version.id)}
            >
              {/* Thumbnail */}
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={version.thumbnail}
                  alt={`Version ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Version type indicator */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    size="sm"
                    className="text-[10px] px-1.5 gap-0.5"
                  >
                    <TypeIcon className="w-2.5 h-2.5" />
                    V{index + 1}
                  </Badge>
                </div>

                {/* Original badge */}
                {isOriginal && (
                  <div className="absolute top-1.5 right-1.5">
                    <Badge variant="outline" size="sm" className="text-[10px] px-1 bg-background/80">
                      {t.editor.original}
                    </Badge>
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction("rerun", version.id);
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.common.rerun}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction("variation", version.id);
                          }}
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.common.variation}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction("edit", version.id);
                          }}
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.common.edit}</TooltipContent>
                    </Tooltip>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-white hover:bg-white/20 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAction("startframe", version.id);
                        }}
                      >
                        <Play className="w-3 h-3" />
                        {t.studio.useAsStartFrame}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.studio.useAsStartFrame}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Version info */}
              <div className="p-1.5 bg-secondary/30">
                <p className="text-[10px] text-muted-foreground truncate">
                  {version.editLabel || typeLabels[versionType]}
                </p>
                <p className="text-[9px] text-muted-foreground/60">
                  {version.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}