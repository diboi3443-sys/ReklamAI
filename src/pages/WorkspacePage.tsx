import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  Sparkles,
  Zap,
  Upload,
  X,
  Wand2,
  Info,
  Image as ImageIcon,
  Video,
  Hash,
  Cpu,
  Calendar,
  Copy,
  Check,
  Download,
  Share2,
  RefreshCw,
  Shuffle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { FeaturePicker } from "@/components/FeaturePicker";
import { EditorPanel, EditData } from "@/components/EditorPanel";
import { LiveCanvas, CanvasState, GenerationStep, defaultGenerationSteps } from "@/components/LiveCanvas";
import { VersionHistory, Version, VersionType } from "@/components/VersionHistory";
import { GenerationHistoryPanel } from "@/components/studio/GenerationHistoryPanel";
import { SelectedPresetCard } from "@/components/studio/SelectedPresetCard";
import { PresetGrid } from "@/components/studio/PresetGrid";
import { PresetSelectorModal } from "@/components/studio/PresetSelectorModal";
import { Preset } from "@/lib/presets";
import {
  modes,
  Mode,
  ModeId,
  Feature,
  featuresByMode,
  modelCapabilities,
  aspectRatios,
  videoDurations,
} from "@/lib/features";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { loadModelsByModality, DatabaseModel } from "@/lib/models";
import { generate, getStatus } from "@/lib/edge";
import { supabase } from "@/lib/supabase";
import { AuthModal } from "@/components/AuthModal";

export default function WorkspacePage() {
  const { t } = useTranslation();
  // State
  const [selectedMode, setSelectedMode] = useState<ModeId>("video");
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [featurePickerOpen, setFeaturePickerOpen] = useState(false);
  const [presetSelectorOpen, setPresetSelectorOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(true);

  // Form state
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("5");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>("empty");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>(defaultGenerationSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMediaType, setResultMediaType] = useState<"image" | "video">("image");

  // Version history
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>("");

  // Metadata
  const [metadata, setMetadata] = useState<{
    seed: number;
    creditsUsed: number;
    createdAt: Date;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Database models and auth
  const [dbModels, setDbModels] = useState<DatabaseModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);

  // Load models from database
  useEffect(() => {
    const loadModels = async () => {
      setModelsLoading(true);
      const modality = selectedMode === 'video' ? 'video' : 'image';
      const models = await loadModelsByModality(modality);
      console.log('[WorkspacePage] Loaded models from DB:', models.length);
      setDbModels(models);
      setModelsLoading(false);
      
      // Set first model as default if available
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0].key);
      }
    };
    loadModels();
  }, [selectedMode]);

  // Auto-select first feature when mode changes
  useEffect(() => {
    const features = featuresByMode[selectedMode];
    if (features?.length > 0) {
      setSelectedFeature(features[0]);
      setSelectedModel(features[0].defaultModel);
    }
  }, [selectedMode]);

  // Calculate estimated cost
  const calculateCost = useCallback(() => {
    if (!selectedFeature) return 0;

    let cost = selectedFeature.baseCost;
    const model = modelCapabilities[selectedModel];
    if (model) {
      cost *= model.costMultiplier;
    }

    // Duration multiplier for video
    if (selectedMode === "video") {
      const dur = videoDurations.find((d) => d.value === duration);
      if (dur) {
        cost *= dur.multiplier;
      }
    }

    return Math.round(cost * 10) / 10;
  }, [selectedFeature, selectedModel, selectedMode, duration]);

  // Handle generation with real API
  const handleGenerate = async (versionType: VersionType = "generated", editLabel?: string) => {
    if (!selectedFeature || (!prompt.trim() && selectedFeature.requiredInputs.includes("prompt"))) return;

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAuthModalOpen(true);
      return;
    }

    setCanvasState("generating");
    setProgress(0);
    setCurrentStepIndex(0);

    // Reset steps
    const steps = [...defaultGenerationSteps];
    setGenerationSteps(steps);

    try {
      // Step 1: Preparing
      setCurrentStepIndex(0);
      setProgressLabel(steps[0].label);
      setProgress(10);

      // Determine preset key based on mode
      const presetKey = selectedMode === 'video' ? 'text-to-video' : 'text-to-image';

      // Call generate API
      console.log('[WorkspacePage] Calling generate API...');
      const generateResult = await generate({
        presetKey,
        modelKey: selectedModel,
        prompt: prompt.trim(),
        input: {
          params: {
            aspect_ratio: aspectRatio,
            duration: selectedMode === 'video' ? parseInt(duration) : undefined,
          },
        },
      });

      console.log('[WorkspacePage] Generate result:', generateResult);
      setCurrentGenerationId(generateResult.generationId);

      // Step 2: Processing
      setCurrentStepIndex(1);
      setProgressLabel(steps[1].label);
      setProgress(25);

      // Poll for status
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes max
      
      while (attempts < maxAttempts) {
        const statusResult = await getStatus(generateResult.generationId);
        console.log('[WorkspacePage] Status result:', statusResult);

        if (statusResult.status === 'succeeded') {
          setProgress(100);
          
          if (statusResult.signedPreviewUrl) {
            setResultUrl(statusResult.signedPreviewUrl);
            setResultMediaType(selectedMode === "video" ? "video" : "image");
            setCanvasState("ready");

            // Set metadata
            const newMetadata = {
              seed: Math.floor(Math.random() * 1000000000),
              creditsUsed: calculateCost(),
              createdAt: new Date(),
            };
            setMetadata(newMetadata);

            // Add to version history
            const newVersion: Version = {
              id: `v-${Date.now()}`,
              thumbnail: statusResult.signedPreviewUrl,
              timestamp: new Date(),
              isActive: true,
              type: versionType,
              editLabel: editLabel,
              parentId: activeVersionId || undefined,
            };
            setVersions((prev) => [...prev, newVersion]);
            setActiveVersionId(newVersion.id);
            return;
          } else {
            throw new Error('No preview URL in response');
          }
        } else if (statusResult.status === 'failed') {
          throw new Error(statusResult.error || 'Generation failed');
        }

        // Update progress based on status
        if (statusResult.status === 'processing') {
          setCurrentStepIndex(2);
          setProgressLabel(steps[2].label);
          setProgress(Math.min(40 + attempts, 90));
        }

        attempts++;
        await new Promise(r => setTimeout(r, 1000));
      }

      throw new Error('Generation timed out');

    } catch (error: any) {
      console.error('[WorkspacePage] Generation error:', error);
      setCanvasState("empty");
      setProgress(0);
      // Could show toast here
    }
  };

  // Handle editor apply
  const handleApplyEdit = (editData: EditData) => {
    // Determine version type based on tool
    let versionType: VersionType = "edited";
    let editLabel = "Prompt edit";
    
    switch (editData.tool) {
      case "crop":
        versionType = "cropped";
        editLabel = `Cropped to ${editData.aspectRatio}`;
        break;
      case "upscale":
        versionType = "upscaled";
        editLabel = `Upscaled ${editData.upscaleFactor}`;
        break;
      case "relight":
        versionType = "relit";
        editLabel = "Relit";
        break;
      case "inpaint":
        editLabel = "Inpainted";
        break;
      case "motion":
        editLabel = "Motion added";
        break;
      case "prompt":
        editLabel = editData.prompt?.slice(0, 20) + "..." || "Prompt edit";
        break;
    }
    
    handleGenerate(versionType, editLabel);
    setEditorOpen(false);
  };

  // Handle version actions
  const handleVersionAction = (
    action: "rerun" | "remix" | "variation" | "startframe" | "edit",
    versionId: string
  ) => {
    // Handle different actions
    if (action === "rerun") {
      handleGenerate("generated", "Re-run");
    } else if (action === "variation") {
      handleGenerate("variation", "Variation");
    } else if (action === "edit") {
      setEditorOpen(true);
    } else if (action === "startframe") {
      // Set as uploaded image for next generation
      const version = versions.find((v) => v.id === versionId);
      if (version) {
        setUploadedImage(version.thumbnail);
      }
    }
  };

  // Copy prompt
  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentMode = modes.find((m) => m.id === selectedMode);
  const requiresImage = selectedFeature?.requiredInputs.includes("image");
  const requiresReference = selectedFeature?.requiredInputs.includes("reference");
  const isVideoMode = selectedMode === "video" || selectedFeature?.id.includes("video");

  // Translated mode names
  const modeNames: Record<ModeId, string> = {
    image: t.modes.image,
    video: t.modes.video,
    edit: t.modes.edit,
    character: t.modes.character,
    inpaint: t.modes.inpaint,
    cinema: t.modes.cinema,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mode Tabs - Top Navigation */}
      <div className="shrink-0 px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-1 overflow-x-auto">
        {modes.map((mode) => {
          const isActive = selectedMode === mode.id;
          const ModeIcon = mode.icon;
          return (
            <Button
              key={mode.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setSelectedMode(mode.id);
                setFeaturePickerOpen(true);
              }}
              className={cn(
                "relative transition-all",
                isActive && "shadow-glow-sm"
              )}
            >
              <ModeIcon className="w-4 h-4" />
              {modeNames[mode.id]}
              {isActive && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Controls */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          {/* Selected Feature & Preset Card */}
          <div className="p-4 border-b border-border shrink-0">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
              {t.studio.selectedPreset}
            </label>
            <SelectedPresetCard
              feature={selectedFeature}
              preset={selectedPreset}
              model={selectedModel}
              mode={selectedMode}
              onChangePresetClick={() => setPresetSelectorOpen(true)}
              onChangeFeatureClick={() => setFeaturePickerOpen(true)}
            />
          </div>

          {/* Scrollable Form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
            {/* Model Selection - from Database */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                {t.studio.model}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent>{t.studio.aiEngine}</TooltipContent>
                </Tooltip>
              </label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder={modelsLoading ? "Loading..." : "Select model"} />
                </SelectTrigger>
                <SelectContent>
                  {modelsLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">Loading models...</div>
                  ) : dbModels.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No models available</div>
                  ) : (
                    dbModels.map((model) => (
                      <SelectItem key={model.key} value={model.key}>
                        <div className="flex items-center gap-2">
                          <span>{model.title}</span>
                          <Badge variant="outline" size="sm">{model.provider}</Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            {requiresImage && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t.studio.sourceImage}
                </label>
                {uploadedImage ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="absolute top-2 right-2"
                      onClick={() => setUploadedImage(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t.studio.dropImageOrClick}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Reference Image */}
            {requiresReference && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t.studio.referenceImage}
                </label>
                {referenceImage ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      className="absolute top-2 right-2"
                      onClick={() => setReferenceImage(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t.studio.addReference}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t.studio.aspectRatio}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {aspectRatios.slice(0, 6).map((ratio) => (
                  <Button
                    key={ratio.value}
                    variant={aspectRatio === ratio.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatio(ratio.value)}
                    className="text-xs"
                  >
                    {ratio.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Duration (Video only) */}
            {isVideoMode && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t.studio.duration}
                </label>
                <div className="flex gap-2">
                  {videoDurations.map((dur) => (
                    <Button
                      key={dur.value}
                      variant={duration === dur.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration(dur.value)}
                      className="flex-1"
                    >
                      {dur.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t.studio.prompt}
              </label>
              <Textarea
                variant="glow"
                textareaSize="lg"
                placeholder={
                  selectedFeature?.requiredInputs.includes("prompt")
                    ? t.studio.promptPlaceholder
                    : t.studio.optionalPrompt
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* Bottom Action Bar - Shrink-0 keeps it always visible */}
          <div className="shrink-0 p-4 border-t border-border bg-card">
            <div className="flex items-center gap-3">
              <Badge variant="glow" size="sm" className="gap-1 shrink-0">
                <span className="font-semibold">{calculateCost()}</span>
                <Zap className="w-3 h-3" />
              </Badge>
              <Button
                variant="glow"
                size="default"
                className="flex-1"
                onClick={() => handleGenerate("generated")}
                disabled={
                  !selectedFeature ||
                  (!prompt.trim() && selectedFeature.requiredInputs.includes("prompt")) ||
                  canvasState === "generating"
                }
              >
                <Sparkles className="w-4 h-4" />
                {t.common.generate}
              </Button>
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Canvas Toolbar */}
          <div className="shrink-0 px-4 py-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentMode && (
                <Badge variant="secondary" size="sm">
                  <currentMode.icon className="w-3 h-3 mr-1" />
                  {currentMode.name}
                </Badge>
              )}
              {selectedFeature && (
                <span className="text-sm text-muted-foreground">
                  / {selectedFeature.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canvasState === "ready" && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.common.download}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.common.share}</TooltipContent>
                  </Tooltip>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditorOpen(true)}
                  >
                    <Wand2 className="w-4 h-4" />
                    {t.common.edit}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
            <LiveCanvas
              state={canvasState}
              mediaUrl={resultUrl || undefined}
              mediaType={resultMediaType}
              progress={progress}
              progressLabel={progressLabel}
              generationSteps={generationSteps}
              currentStepIndex={currentStepIndex}
              aspectRatio={aspectRatio}
              onRetry={() => handleGenerate("generated")}
              className="max-w-4xl w-full"
            />
          </div>

          {/* Version History */}
          <VersionHistory
            versions={versions}
            activeVersionId={activeVersionId}
            onSelectVersion={(id) => {
              setActiveVersionId(id);
              const version = versions.find((v) => v.id === id);
              if (version) {
                setResultUrl(version.thumbnail);
              }
            }}
            onAction={handleVersionAction}
          />
        </div>

        {/* Right: Metadata / Editor */}
        {canvasState === "ready" && !editorOpen && metadata && (
          <div className="w-64 border-l border-border bg-card flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-medium">{t.studio.resultActions}</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleGenerate("generated", "Re-run")}>
                  <RefreshCw className="w-3 h-3" />
                  {t.common.rerun}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleGenerate("variation", "Variation")}>
                  <Shuffle className="w-3 h-3" />
                  {t.common.variation}
                </Button>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t.studio.prompt}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCopyPrompt}
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {prompt}
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cpu className="w-3.5 h-3.5" />
                    <span className="text-xs">{t.studio.model}</span>
                  </div>
                  <Badge variant="secondary" size="sm">
                    {selectedModel}
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="text-xs">{t.studio.seed}</span>
                  </div>
                  <span className="text-xs font-mono">{metadata.seed}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">{t.studio.creditsUsed}</span>
                  <Badge variant="outline" size="sm" className="gap-1">
                    <span className="font-semibold">{metadata.creditsUsed}</span>
                    <Zap className="w-3 h-3" />
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs">{t.studio.createdAt}</span>
                  </div>
                  <span className="text-xs">
                    {metadata.createdAt.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Use as Reference */}
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (resultUrl) {
                    setUploadedImage(resultUrl);
                  }
                }}
              >
                <Play className="w-3 h-3" />
                {t.studio.useAsStartFrame}
              </Button>
            </div>
          </div>
        )}

        {/* Editor Panel */}
        <EditorPanel
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          feature={selectedFeature}
          onApplyEdit={handleApplyEdit}
        />
        {/* Editor Panel */}
        <EditorPanel
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          feature={selectedFeature}
          onApplyEdit={handleApplyEdit}
        />

        {/* Generation History Panel */}
        <GenerationHistoryPanel
          open={historyPanelOpen}
          onOpenChange={setHistoryPanelOpen}
        />
      </div>

      {/* Feature Picker Modal */}
      <FeaturePicker
        open={featurePickerOpen}
        onOpenChange={setFeaturePickerOpen}
        mode={selectedMode}
        selectedFeature={selectedFeature}
        selectedModel={selectedModel}
        onSelectFeature={(feature) => {
          setSelectedFeature(feature);
          setSelectedModel(feature.defaultModel);
          setSelectedPreset(null); // Reset preset when feature changes
        }}
        onSelectModel={setSelectedModel}
      />

      {/* Preset Selector Modal */}
      <PresetSelectorModal
        open={presetSelectorOpen}
        onOpenChange={setPresetSelectorOpen}
        featureId={selectedFeature?.id || null}
        selectedPreset={selectedPreset}
        onSelectPreset={(preset) => {
          setSelectedPreset(preset);
          if (preset.defaultModel) {
            setSelectedModel(preset.defaultModel);
          }
        }}
      />

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
