import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Image,
  Video,
  Mic,
  Type,
  Sparkles,
  ChevronRight,
  Zap,
  Settings2,
  Info,
  LayoutGrid,
  FolderOpen,
  ChevronDown,
  History,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { AssetPicker } from "@/components/assets/AssetPicker";
import { GenerationHistoryPanel } from "@/components/studio/GenerationHistoryPanel";
import type { Asset } from "@/lib/assets";
import { generate as generateGeneration } from "@/lib/edge";
import { loadModelsByModality, type DatabaseModel } from "@/lib/models";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { logger } from "@/lib/logger";

// Preset definitions
const presets = [
  {
    id: "image-gen",
    nameKey: "imageGen",
    icon: Image,
    descriptionKey: "createImagesFromText",
    credits: 1,
    models: ["FLUX.1", "SDXL", "Midjourney"],
  },
  {
    id: "video-gen",
    nameKey: "videoGen",
    icon: Video,
    descriptionKey: "generateVideoClips",
    credits: 5,
    models: ["Runway Gen-3", "Pika", "Kling"],
  },
  {
    id: "voice-gen",
    nameKey: "voiceGen",
    icon: Mic,
    descriptionKey: "createVoiceovers",
    credits: 2,
    models: ["ElevenLabs", "OpenAI TTS"],
  },
  {
    id: "text-gen",
    nameKey: "textGen",
    icon: Type,
    descriptionKey: "generateCopyScripts",
    credits: 0.5,
    models: ["GPT-4", "Claude", "Gemini"],
  },
];

const aspectRatios = [
  { value: "1:1", label: "1:1 Square" },
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "4:3", label: "4:3 Standard" },
];

export default function CreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const boardIdFromUrl = searchParams.get("board");

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(boardIdFromUrl);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetPickerMode, setAssetPickerMode] = useState<"reference" | "startFrame">("reference");
  const [referenceAsset, setReferenceAsset] = useState<Asset | null>(null);
  const [startFrameAsset, setStartFrameAsset] = useState<Asset | null>(null);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [boards, setBoards] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<DatabaseModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  // Load boards from API (only on mount)
  useEffect(() => {
    if (!user) return;
    apiFetch<any[]>('/api/boards')
      .then((data) => {
        setBoards(data);
        if (!boardIdFromUrl && data.length > 0) {
          setCurrentBoardId(data[0].id);
        }
      })
      .catch((err) => {
        logger.error('Failed to load boards:', err);
        // Boards endpoint may not exist yet — silently ignore
      });
  }, [user]); // Re-load when user changes

  const currentBoard = currentBoardId ? boards.find(b => b.id === currentBoardId) : null;

  const handleAssetSelect = (asset: Asset) => {
    if (assetPickerMode === "reference") {
      setReferenceAsset(asset);
    } else {
      setStartFrameAsset(asset);
    }
  };

  const openAssetPicker = (mode: "reference" | "startFrame") => {
    setAssetPickerMode(mode);
    setAssetPickerOpen(true);
  };

  const activePreset = presets.find((p) => p.id === selectedPreset);

  // Load models from database when preset changes
  useEffect(() => {
    async function loadModels() {
      if (!selectedPreset) {
        setAvailableModels([]);
        return;
      }

      setModelsLoading(true);
      try {
        // Map preset ID to modality
        const modalityMap: Record<string, 'image' | 'video' | 'edit' | 'audio'> = {
          'image-gen': 'image',
          'video-gen': 'video',
          'edit': 'edit',
          'audio': 'audio',
        };

        const modality = modalityMap[selectedPreset] || 'image';
        logger.log('[CreatePage] Loading models for preset:', selectedPreset, 'modality:', modality);

        const models = await loadModelsByModality(modality);
        logger.log('[CreatePage] Loaded models:', models.length);

        setAvailableModels(models);
        logger.log('[CreatePage] Available models set:', models.length, 'models');
        logger.log('[CreatePage] Current selectedModel:', selectedModel);

        // Auto-select first model if none selected or if current model is not in the list
        if (models.length > 0) {
          const currentModelExists = selectedModel && models.some(m => m.key === selectedModel);
          logger.log('[CreatePage] Current model exists in list:', currentModelExists);
          if (!currentModelExists || !selectedModel) {
            const firstModelKey = models[0].key;
            logger.log('[CreatePage] Auto-selecting first model:', firstModelKey, models[0].title);
            setSelectedModel(firstModelKey);
          } else {
            logger.log('[CreatePage] Keeping current model:', selectedModel);
          }
        } else {
          logger.warn('[CreatePage] No models available to select');
          setSelectedModel("");
        }
      } catch (error) {
        logger.error('[CreatePage] Error loading models:', error);
        setAvailableModels([]);
      } finally {
        setModelsLoading(false);
      }
    }

    loadModels();
  }, [selectedPreset]);

  const getPresetName = (nameKey: string) => {
    switch (nameKey) {
      case "imageGen": return t.pricing.imageGen;
      case "videoGen": return t.pricing.videoGen;
      case "voiceGen": return "Voice Gen";
      case "textGen": return "Text Gen";
      default: return nameKey;
    }
  };

  const getPresetDescription = (descKey: string) => {
    switch (descKey) {
      case "createImagesFromText": return t.modes.createImage;
      case "generateVideoClips": return t.modes.createVideo;
      case "createVoiceovers": return "Create AI voiceovers";
      case "generateCopyScripts": return "Generate copy & scripts";
      default: return descKey;
    }
  };

  const handleGenerate = async () => {
    if (!activePreset || !prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      // Map preset to presetKey (for now, use preset id as key)
      const presetKeyMap: Record<string, string> = {
        'image-gen': 'image-gen',
        'video-gen': 'video-gen',
        'voice-gen': 'voice-gen',
        'text-gen': 'text-gen',
      };

      const presetKey = presetKeyMap[selectedPreset || ''] || 'image-gen';
      const modelKey = selectedModel || availableModels[0]?.key || '';

      // Prepare input with asset paths if available
      const input: any = {
        params: {
          aspectRatio,
        },
      };

      if (referenceAsset && referenceAsset.storage_path) {
        if (activePreset.id === 'video-gen') {
          input.referenceImagePath = referenceAsset.storage_path;
        } else {
          input.referenceImagePath = referenceAsset.storage_path;
        }
      }

      if (startFrameAsset && startFrameAsset.storage_path && activePreset.id === 'video-gen') {
        input.startFramePath = startFrameAsset.storage_path;
      }

      // Call generate function
      const result = await generateGeneration({
        boardId: currentBoardId || null,
        presetKey,
        modelKey,
        prompt,
        input: Object.keys(input).length > 0 ? input : undefined,
      });

      // Navigate to progress with generation ID
      navigate("/progress", {
        state: {
          generationId: result.generationId,
          status: result.status,
        },
      });

      toast.success(t.common.generate + ' ' + t.common.success);
    } catch (error: any) {
      logger.error('Generate error:', error);

      // Handle structured 422 error from KIE
      if (error.code === 422 && error.provider === 'kie') {
        toast.error(
          `KIE Model Error: ${error.message || 'Model not supported'}`,
          {
            description: error.hint || `Model sent: ${error.modelSent || modelKey}. Check KIE.ai market for available models.`,
            duration: 10000,
          }
        );
      } else {
        toast.error(error.message || t.common.error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{t.common.generate}</h1>
              <p className="text-sm text-muted-foreground">
                {t.studio.selectFeature}
              </p>
            </div>

            {/* Board Context */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  {currentBoard ? (
                    <span className="max-w-[150px] truncate">{currentBoard.title}</span>
                  ) : (
                    <span className="text-muted-foreground">{t.boards.selectBoard}</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setCurrentBoardId(null)}>
                  <FolderOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                  No Board
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {boards.map((board) => (
                  <DropdownMenuItem
                    key={board.id}
                    onClick={() => setCurrentBoardId(board.id)}
                    className={cn(currentBoardId === board.id && "bg-secondary")}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    <span className="flex-1 truncate">{board.title}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/boards")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.boards.createBoard}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Current Board Indicator */}
          {currentBoard && (
            <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.boards.currentBoard}: {currentBoard.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentBoard.description || ''}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/boards/${currentBoard.id}`)}
              >
                {t.common.open}
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Preset Selector */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t.studio.feature}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presets.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <Card
                      key={preset.id}
                      variant={isSelected ? "glow" : "interactive"}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected && "ring-1 ring-primary"
                      )}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        // Model will be auto-selected after loading from DB
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center transition-colors",
                            isSelected
                              ? "gradient-brand shadow-glow-sm"
                              : "bg-secondary"
                          )}
                        >
                          <preset.icon
                            className={cn(
                              "w-5 h-5",
                              isSelected
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <h3 className="font-medium text-sm">{getPresetName(preset.nameKey)}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getPresetDescription(preset.descriptionKey)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Creation Form - Only shows when preset is selected */}
            {activePreset && (
              <section className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {t.common.settings}
                  </h2>
                  <Badge variant="outline">
                    <activePreset.icon className="w-3 h-3 mr-1" />
                    {getPresetName(activePreset.nameKey)}
                  </Badge>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Model Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          {t.studio.model}
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {t.studio.aiEngine}
                            </TooltipContent>
                          </Tooltip>
                          {modelsLoading && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                          )}
                          {!modelsLoading && availableModels.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {availableModels.length} {availableModels.length === 1 ? 'модель' : 'моделей'}
                            </Badge>
                          )}
                        </label>
                        <Select
                          value={selectedModel || undefined}
                          onValueChange={(value) => {
                            logger.log('[CreatePage] Model selected:', value);
                            setSelectedModel(value);
                          }}
                          disabled={modelsLoading || availableModels.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={modelsLoading ? "Загрузка моделей..." : availableModels.length === 0 ? "Нет доступных моделей" : "Выберите модель"} />
                          </SelectTrigger>
                          <SelectContent>
                            {modelsLoading ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Загрузка моделей...
                                </div>
                              </SelectItem>
                            ) : availableModels.length > 0 ? (
                              availableModels.map((model) => {
                                const isSelected = model.key === selectedModel;
                                logger.log('[CreatePage] Rendering model option:', model.key, model.title, 'selected:', isSelected);
                                return (
                                  <SelectItem key={model.key} value={model.key}>
                                    <div className="flex items-center gap-2">
                                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                                      <span>{model.title}</span>
                                      {model.provider && (
                                        <Badge variant="outline" className="text-xs ml-auto">
                                          {model.provider}
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem value="no-models" disabled>
                                Нет доступных моделей (загружено: {availableModels.length})
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {!modelsLoading && availableModels.length > 0 && selectedModel && (
                          <p className="text-xs text-muted-foreground">
                            Выбрано: {availableModels.find(m => m.key === selectedModel)?.title || selectedModel}
                          </p>
                        )}
                      </div>

                      {(activePreset.id === "image-gen" ||
                        activePreset.id === "video-gen") && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              {t.studio.aspectRatio}
                            </label>
                            <Select
                              value={aspectRatio}
                              onValueChange={setAspectRatio}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {aspectRatios.map((ratio) => (
                                  <SelectItem key={ratio.value} value={ratio.value}>
                                    {ratio.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t.studio.prompt}</label>
                      <Textarea
                        variant="glow"
                        textareaSize="lg"
                        placeholder={t.studio.promptPlaceholder}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Be specific about style, mood, and details for better results.
                      </p>
                    </div>

                    {/* Asset Selection for Image/Video */}
                    {(activePreset.id === "image-gen" || activePreset.id === "video-gen") && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <h3 className="text-sm font-medium">{t.assets.title}</h3>

                        {/* Reference Image */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-sm text-muted-foreground">{t.assets.useAsReference}</label>
                            {referenceAsset ? (
                              <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
                                <img
                                  src={referenceAsset.thumbnail}
                                  alt={referenceAsset.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <span className="text-sm flex-1 truncate">{referenceAsset.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReferenceAsset(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 gap-2"
                                onClick={() => openAssetPicker("reference")}
                              >
                                <FolderOpen className="w-4 h-4" />
                                {t.assets.chooseFromAssets}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Start Frame (Video only) */}
                        {activePreset.id === "video-gen" && (
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-sm text-muted-foreground">{t.assets.useAsStartFrame}</label>
                              {startFrameAsset ? (
                                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
                                  <img
                                    src={startFrameAsset.thumbnail}
                                    alt={startFrameAsset.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                  <span className="text-sm flex-1 truncate">{startFrameAsset.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStartFrameAsset(null)}
                                  >
                                    ✕
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 gap-2"
                                  onClick={() => openAssetPicker("startFrame")}
                                >
                                  <FolderOpen className="w-4 h-4" />
                                  {t.assets.chooseFromAssets}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.studio.estimatedCost}</p>
                      <p className="text-xs text-muted-foreground">
                        {activePreset.credits} {t.common.credit}
                        {activePreset.credits !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentBoard && (
                      <Badge variant="outline" className="gap-1.5">
                        <LayoutGrid className="w-3 h-3" />
                        {t.boards.saveToBoard}: {currentBoard.title}
                      </Badge>
                    )}
                    <Button
                      variant="glow"
                      size="lg"
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t.common.generating}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {t.common.generate}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      {/* Generation History Panel */}
      <GenerationHistoryPanel
        open={historyPanelOpen}
        onOpenChange={setHistoryPanelOpen}
      />

      {/* Asset Picker Modal */}
      <AssetPicker
        open={assetPickerOpen}
        onOpenChange={setAssetPickerOpen}
        onSelect={handleAssetSelect}
        allowedTypes={activePreset?.id === "video-gen" ? ["image", "video"] : ["image"]}
        title={assetPickerMode === "reference" ? t.assets.useAsReference : t.assets.useAsStartFrame}
      />
    </div>
  );
}
