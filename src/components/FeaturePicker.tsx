import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Star, Zap, TrendingUp, Check, Play, Paintbrush2, Sparkles, ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Feature, FeatureBadge, featuresByMode, ModeId, modelCapabilities, Model } from "@/lib/features";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { loadModelsByModality, type DatabaseModel } from "@/lib/models";

interface FeaturePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ModeId;
  selectedFeature: Feature | null;
  selectedModel: string;
  onSelectFeature: (feature: Feature) => void;
  onSelectModel: (modelName: string) => void;
}

function BadgeIcon({ badge }: { badge: FeatureBadge }) {
  switch (badge) {
    case "TOP":
      return <Star className="w-3 h-3" />;
    case "NEW":
      return <Zap className="w-3 h-3" />;
    case "BEST":
      return <TrendingUp className="w-3 h-3" />;
  }
}

function getBadgeVariant(badge: FeatureBadge) {
  switch (badge) {
    case "TOP":
      return "gradient" as const;
    case "NEW":
      return "info" as const;
    case "BEST":
      return "success" as const;
  }
}

function CapabilityIcon({ capability }: { capability: string }) {
  switch (capability) {
    case "motion":
      return <Play className="w-3 h-3" />;
    case "inpaint":
      return <Paintbrush2 className="w-3 h-3" />;
    case "startEndFrame":
      return <Sparkles className="w-3 h-3" />;
    case "audio":
      return <Zap className="w-3 h-3" />;
    case "upscale":
      return <ArrowUp className="w-3 h-3" />;
    default:
      return null;
  }
}

export function FeaturePicker({
  open,
  onOpenChange,
  mode,
  selectedFeature,
  selectedModel,
  onSelectFeature,
  onSelectModel,
}: FeaturePickerProps) {
  const { t } = useTranslation();
  const features = featuresByMode[mode] || [];
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [dbModels, setDbModels] = useState<DatabaseModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Load models from database
  useEffect(() => {
    console.log('[FeaturePicker] useEffect triggered, mode:', mode, 'open:', open);

    async function loadModelsFromDB() {
      console.log('[FeaturePicker] loadModelsFromDB called');
      setModelsLoading(true);
      try {
        const modality = mode === 'image' ? 'image' : mode === 'video' ? 'video' : mode === 'edit' ? 'edit' : 'image';
        console.log('[FeaturePicker] Loading models for modality:', modality);
        const models = await loadModelsByModality(modality);
        console.log('[FeaturePicker] Loaded models:', models.length);
        if (models.length > 0) {
          console.log('[FeaturePicker] First model:', models[0].key, models[0].title);
        } else {
          console.warn('[FeaturePicker] ⚠️ No models loaded! Check loadModels function.');
        }
        console.log('[FeaturePicker] Setting dbModels state with', models.length, 'models');
        setDbModels(models);
        console.log('[FeaturePicker] dbModels state updated');
      } catch (error) {
        console.error('[FeaturePicker] ❌ Error loading models:', error);
        console.error('[FeaturePicker] Error stack:', (error as Error).stack);
        setDbModels([]); // Set empty array on error
      } finally {
        setModelsLoading(false);
        console.log('[FeaturePicker] Loading finished');
      }
    }

    // Always load when mode changes
    loadModelsFromDB();
  }, [mode]);

  // Determine which feature to show models for
  const activeFeature = hoveredFeature || selectedFeature;

  // Get compatible models for the active feature
  // Filter DB models by modality matching the feature's mode
  const compatibleModels = useMemo(() => {
    console.log('[FeaturePicker] Computing compatibleModels:', {
      hasActiveFeature: !!activeFeature,
      dbModelsCount: dbModels.length,
      modelsLoading,
      mode,
      dbModelsType: Array.isArray(dbModels) ? 'array' : typeof dbModels,
    });

    // If we have DB models, use them (filtered by modality)
    // Show all models for the current mode, even if no feature is selected
    if (dbModels && dbModels.length > 0) {
      console.log('[FeaturePicker] ✅ dbModels.length > 0, mapping models...');
      const mapped = dbModels.map((model) => ({
        name: model.title,
        key: model.key,
        provider: model.provider,
        modality: model.modality,
        costMultiplier: Number(model.price_multiplier) || 1,
        capabilities: model.capabilities || {},
      }));
      console.log('[FeaturePicker] ✅ Using DB models:', mapped.length, 'mapped models');
      return mapped;
    } else {
      console.log('[FeaturePicker] ⚠️ dbModels is empty or not an array:', {
        dbModels,
        length: dbModels?.length,
        isArray: Array.isArray(dbModels),
      });
    }

    // If still loading, return empty (will show loading state)
    if (modelsLoading) {
      console.log('[FeaturePicker] ⏳ Still loading models...');
      return [];
    }

    // Fallback to hardcoded models if DB is empty and feature is selected
    if (activeFeature) {
      console.log('[FeaturePicker] ⚠️ DB empty after load, using fallback hardcoded models');
      return activeFeature.supportedModels.map((modelName) => ({
        name: modelName,
        key: modelName,
        provider: 'unknown',
        modality: mode,
        ...modelCapabilities[modelName],
      }));
    }

    // No feature and no DB models
    console.log('[FeaturePicker] No feature and no DB models, returning empty array');
    return [];
  }, [activeFeature, dbModels, modelsLoading, mode]);

  const capabilityLabels: Record<string, string> = {
    motion: t.editor.motion,
    inpaint: t.editor.inpaint,
    startEndFrame: "Start/End",
    audio: "Audio",
    upscale: t.editor.upscale,
  };

  const modeLabels: Record<ModeId, string> = {
    image: t.modes.image,
    video: t.modes.video,
    edit: t.modes.edit,
    character: t.modes.character,
    inpaint: t.modes.inpaint,
    cinema: t.modes.cinema,
  };

  const handleFeatureSelect = (feature: Feature) => {
    onSelectFeature(feature);
    // Auto-select first available model from DB, or fallback to default
    if (compatibleModels.length > 0) {
      // Use model key (from DB) if available, otherwise use name
      const firstModel = compatibleModels[0];
      onSelectModel(firstModel.key || firstModel.name);
    } else {
      onSelectModel(feature.defaultModel);
    }
    onOpenChange(false);
  };

  const handleModelSelect = (modelKeyOrName: string) => {
    onSelectModel(modelKeyOrName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            {t.studio.feature} & {t.studio.model}
            <Badge variant="secondary" size="sm" className="ml-2">
              {modeLabels[mode]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[60vh] min-h-[400px]">
          {/* Left Column: Features */}
          <div className="w-1/2 border-r border-border flex flex-col">
            <div className="px-4 py-2 border-b border-border/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t.studio.feature}
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {features.map((feature) => {
                  const isSelected = selectedFeature?.id === feature.id;
                  const FeatureIcon = feature.icon;

                  return (
                    <button
                      key={feature.id}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all",
                        "hover:bg-secondary/80",
                        isSelected && "bg-primary/10 ring-1 ring-primary/50"
                      )}
                      onClick={() => handleFeatureSelect(feature)}
                      onMouseEnter={() => setHoveredFeature(feature)}
                      onMouseLeave={() => setHoveredFeature(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            isSelected ? "gradient-brand shadow-glow-sm" : "bg-secondary"
                          )}
                        >
                          <FeatureIcon
                            className={cn(
                              "w-4 h-4",
                              isSelected ? "text-primary-foreground" : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "font-medium text-sm",
                              isSelected && "text-primary"
                            )}>
                              {feature.name}
                            </span>
                            {feature.badges?.map((badge) => (
                              <Badge
                                key={badge}
                                variant={getBadgeVariant(badge)}
                                size="sm"
                              >
                                <BadgeIcon badge={badge} />
                                {badge}
                              </Badge>
                            ))}
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary ml-auto" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {feature.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" size="sm" className="text-[10px] gap-1">
                              <span className="font-semibold">{feature.baseCost}</span>
                              <Zap className="w-2.5 h-2.5" />
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {feature.supportedModels.length} {t.studio.model.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Column: Models */}
          <div className="w-1/2 flex flex-col bg-secondary/20">
            <div className="px-4 py-2 border-b border-border/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {activeFeature ? `${t.studio.model}: ${activeFeature.name}` : t.studio.selectFeature}
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {modelsLoading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {t.common.loading}...
                  </div>
                ) : compatibleModels.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {modelsLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.common.loading}...</span>
                      </div>
                    ) : dbModels.length === 0 ? (
                      <>
                        <p>No models in DB for {mode} modality.</p>
                        <p className="text-xs mt-2">Run seed or enable models.</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Check browser console for details.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>No models available.</p>
                        <p className="text-xs mt-2">Select a feature to see compatible models.</p>
                      </>
                    )}
                  </div>
                ) : (
                  compatibleModels.map((model) => {
                    const modelKey = model.key || model.name;
                    const isSelected = selectedModel === modelKey || selectedModel === model.name;
                    const isDefault = activeFeature?.defaultModel === model.name || activeFeature?.defaultModel === modelKey;
                    const capabilities = Object.entries(model.capabilities || {})
                      .filter(([_, value]) => value)
                      .map(([key]) => key);

                    return (
                      <button
                        key={modelKey}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          "hover:bg-secondary/80",
                          isSelected && "bg-primary/10 ring-1 ring-primary/50"
                        )}
                        onClick={() => handleModelSelect(modelKey)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm",
                              isSelected ? "gradient-brand shadow-glow-sm text-primary-foreground" : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {model.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "font-medium text-sm",
                                isSelected && "text-primary"
                              )}>
                                {model.name}
                              </span>
                              {/* Provider badge */}
                              {model.provider && (
                                <Badge variant="outline" size="sm" className="text-[10px]">
                                  {model.provider}
                                </Badge>
                              )}
                              {/* Modality badge */}
                              {model.modality && (
                                <Badge variant="secondary" size="sm" className="text-[10px]">
                                  {model.modality}
                                </Badge>
                              )}
                              {isDefault && (
                                <Badge variant="secondary" size="sm" className="text-[10px]">
                                  По умолч.
                                </Badge>
                              )}
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary ml-auto" />
                              )}
                            </div>

                            {/* Capability Tags */}
                            {capabilities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {capabilities.map((cap) => (
                                  <Badge
                                    key={cap}
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] gap-1"
                                  >
                                    <CapabilityIcon capability={cap} />
                                    {capabilityLabels[cap]}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Cost Multiplier */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                Множитель: {model.costMultiplier || 1}x
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedFeature && (
              <>
                <span className="font-medium text-foreground">{selectedFeature.name}</span>
                <span>•</span>
                <span>{selectedModel}</span>
              </>
            )}
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={!selectedFeature}
          >
            Подтвердить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
