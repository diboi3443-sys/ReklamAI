import * as React from "react";
import { ArrowRight, Sparkles, Video, Image as ImageIcon, Play, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Feature, ModeId } from "@/lib/features";
import { Preset, getPresetBadgeVariant } from "@/lib/presets";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

// Mock thumbnails for features (when no preset selected)
const featureThumbnails: Record<string, string> = {
  "create-video": "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=225&fit=crop",
  "image-to-video": "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=225&fit=crop",
  "video-extend": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
  "create-image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop",
  "cinema-image": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=225&fit=crop",
  "relight": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop",
  default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop",
};

interface SelectedPresetCardProps {
  feature: Feature | null;
  preset: Preset | null;
  model: string;
  mode: ModeId;
  onChangePresetClick: () => void;
  onChangeFeatureClick: () => void;
  className?: string;
}

export function SelectedPresetCard({
  feature,
  preset,
  model,
  mode,
  onChangePresetClick,
  onChangeFeatureClick,
  className,
}: SelectedPresetCardProps) {
  const { t } = useTranslation();

  // No feature selected - show prompt to select feature
  if (!feature) {
    return (
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 cursor-pointer hover:border-primary/50 transition-colors",
          className
        )}
        onClick={onChangeFeatureClick}
      >
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{t.studio.selectFeature}</p>
            <p className="text-sm text-muted-foreground">{t.studio.chooseFeature}</p>
          </div>
        </div>
      </div>
    );
  }

  // Feature selected - show feature card with optional preset overlay
  const thumbnail = preset?.thumbnail || featureThumbnails[feature.id] || featureThumbnails.default;
  const FeatureIcon = feature.icon;
  const isVideo = mode === "video" || feature.id.includes("video");

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border border-border bg-card group",
        className
      )}
    >
      {/* Thumbnail with aspect ratio 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={thumbnail}
          alt={preset?.name || feature.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Play icon on hover (for video) */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Feature badge with settings button - top left */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge
            variant="secondary"
            size="sm"
            className="backdrop-blur-sm bg-black/40 text-white/90 border-white/20"
          >
            <FeatureIcon className="w-3 h-3 mr-1" />
            {feature.name}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onChangeFeatureClick}
            className="backdrop-blur-sm bg-black/40 hover:bg-black/60 text-white/90 border-white/20 w-6 h-6"
          >
            <Settings2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Change Preset button - top right */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onChangePresetClick}
          className="absolute top-3 right-3 backdrop-blur-sm bg-black/40 hover:bg-black/60 text-white/90 border-white/20"
        >
          {t.studio.changePreset}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>

        {/* Media type indicator */}
        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          {isVideo ? (
            <Video className="w-4 h-4 text-white" />
          ) : (
            <ImageIcon className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Preset/Feature info - bottom left */}
        <div className="absolute bottom-3 left-3 right-14">
          {preset ? (
            <>
              {/* Preset name and badges */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white text-base leading-tight truncate">
                  {preset.name}
                </h3>
                {preset.badges?.slice(0, 2).map((badge) => (
                  <Badge
                    key={badge}
                    variant={getPresetBadgeVariant(badge)}
                    size="sm"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-white/70 line-clamp-1">
                {preset.defaultModel || model} • {preset.description}
              </p>
            </>
          ) : (
            <>
              {/* No preset - show hint */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white text-base leading-tight truncate">
                  {t.presets?.noPreset || "No Preset"}
                </h3>
              </div>
              <p className="text-xs text-white/70 line-clamp-1">
                {model} • {t.presets?.selectPresetHint || "Select a preset for quick styling"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
