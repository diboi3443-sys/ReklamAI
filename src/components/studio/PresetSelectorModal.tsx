import * as React from "react";
import { useState, useMemo } from "react";
import { Search, Check, Play, X, Sparkles, Flame, TrendingUp, Wand2, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Preset,
  PresetCategory,
  presetCategories,
  getPresetsForFeature,
  getPresetBadgeVariant,
  presets as allPresets,
} from "@/lib/presets";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface PresetSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureId: string | null;
  selectedPreset: Preset | null;
  onSelectPreset: (preset: Preset) => void;
}

export function PresetSelectorModal({
  open,
  onOpenChange,
  featureId,
  selectedPreset,
  onSelectPreset,
}: PresetSelectorModalProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>("all");

  // Get presets compatible with this feature (or all if no feature)
  const compatiblePresets = useMemo(() => {
    if (!featureId) return allPresets;
    return getPresetsForFeature(featureId);
  }, [featureId]);

  // Filter by category
  const categoryPresets = useMemo(() => {
    if (selectedCategory === "all") {
      return compatiblePresets;
    }
    return compatiblePresets.filter(p => p.category === selectedCategory);
  }, [compatiblePresets, selectedCategory]);

  // Filter by search
  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return categoryPresets;
    const query = searchQuery.toLowerCase();
    return categoryPresets.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }, [categoryPresets, searchQuery]);

  const categoryLabels: Record<PresetCategory, string> = {
    all: t.common.all,
    new: t.common.new,
    viral: t.presets?.viral || "Viral",
    effects: t.presets?.effects || "Effects",
    ugc: t.presets?.ugc || "UGC",
  };

  const categoryIcons: Record<PresetCategory, React.ElementType> = {
    all: Sparkles,
    new: Zap,
    viral: Flame,
    effects: Wand2,
    ugc: Users,
  };

  const handleSelect = (preset: Preset) => {
    onSelectPreset(preset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="p-4 pb-3 border-b border-border shrink-0">
          <DialogTitle>{t.studio.selectPreset}</DialogTitle>
        </DialogHeader>

        {/* Fixed Search and Tabs */}
        <div className="p-4 border-b border-border shrink-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.studio.searchPresets}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as PresetCategory)}
          >
            <TabsList className="w-full grid grid-cols-5 h-10">
              {presetCategories.map((cat) => {
                const Icon = categoryIcons[cat.id];
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="text-xs gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {categoryLabels[cat.id]}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Grid */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => {
              const isSelected = selectedPreset?.id === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset)}
                  className={cn(
                    "relative rounded-xl overflow-hidden border transition-all text-left group",
                    "hover:border-primary/50 hover:shadow-md",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={preset.thumbnail}
                      alt={preset.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
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

                    {/* Preset info */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="font-medium text-white text-sm truncate">
                        {preset.name}
                      </h4>
                      <p className="text-[10px] text-white/60 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredPresets.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {t.states.noResults}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
