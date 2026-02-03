import * as React from "react";
import { useState, useCallback } from "react";
import {
  X,
  Crop,
  Paintbrush,
  Sun,
  Move,
  TrendingUp,
  Undo,
  Redo,
  RotateCcw,
  Wand2,
  Layers,
  ChevronRight,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Feature, aspectRatios } from "@/lib/features";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

type EditorTool = "crop" | "prompt" | "inpaint" | "relight" | "motion" | "upscale";

interface EditorPanelProps {
  open: boolean;
  onClose: () => void;
  feature: Feature | null;
  onApplyEdit: (editData: EditData) => void;
}

export interface EditData {
  tool: EditorTool;
  prompt?: string;
  aspectRatio?: string;
  intensity?: number;
  upscaleFactor?: string;
}

interface EditorTab {
  id: EditorTool;
  labelKey: string;
  icon: React.ElementType;
  descriptionKey: string;
}

const allTabs: EditorTab[] = [
  { id: "crop", labelKey: "crop", icon: Crop, descriptionKey: "cropDesc" },
  { id: "prompt", labelKey: "promptEdit", icon: MessageSquare, descriptionKey: "promptEditDesc" },
  { id: "inpaint", labelKey: "inpaint", icon: Paintbrush, descriptionKey: "inpaintDesc" },
  { id: "relight", labelKey: "relight", icon: Sun, descriptionKey: "relightDesc" },
  { id: "upscale", labelKey: "upscale", icon: TrendingUp, descriptionKey: "upscaleDesc" },
  { id: "motion", labelKey: "motion", icon: Move, descriptionKey: "motionDesc" },
];

// Map feature editor tools to tab IDs
const featureToolToTab: Record<string, EditorTool> = {
  crop: "crop",
  inpaint: "inpaint",
  relight: "relight",
  motion: "motion",
  upscale: "upscale",
  mask: "inpaint", // mask tool uses inpaint tab
};

export function EditorPanel({
  open,
  onClose,
  feature,
  onApplyEdit,
}: EditorPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<EditorTool>("crop");
  const [editPrompt, setEditPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [intensity, setIntensity] = useState([50]);
  const [upscaleFactor, setUpscaleFactor] = useState("2x");

  const getTabLabel = (key: string) => {
    switch (key) {
      case "crop": return t.editor.crop;
      case "promptEdit": return t.editor.promptEdit;
      case "inpaint": return t.editor.inpaint;
      case "relight": return t.editor.relight;
      case "upscale": return t.editor.upscale;
      case "motion": return t.editor.motion;
      default: return key;
    }
  };

  // Determine available tabs based on feature
  const availableTabs = React.useMemo(() => {
    // Always include crop and prompt edit
    const tabs: EditorTool[] = ["crop", "prompt"];
    
    if (feature?.editorTools) {
      feature.editorTools.forEach((tool) => {
        const tabId = featureToolToTab[tool];
        if (tabId && !tabs.includes(tabId)) {
          tabs.push(tabId);
        }
      });
    }
    
    return allTabs.filter((tab) => tabs.includes(tab.id));
  }, [feature]);

  // Set active tab to first available if current is not available
  React.useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find((tb) => tb.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const handleApply = () => {
    onApplyEdit({
      tool: activeTab,
      prompt: editPrompt || undefined,
      aspectRatio: activeTab === "crop" ? aspectRatio : undefined,
      intensity: ["relight", "motion"].includes(activeTab) ? intensity[0] : undefined,
      upscaleFactor: activeTab === "upscale" ? upscaleFactor : undefined,
    });
  };

  const canApply = React.useMemo(() => {
    switch (activeTab) {
      case "prompt":
      case "inpaint":
        return editPrompt.trim().length > 0;
      case "relight":
        return editPrompt.trim().length > 0 || intensity[0] !== 50;
      default:
        return true;
    }
  }, [activeTab, editPrompt, intensity]);

  if (!open) return null;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI {t.modes.edit}</h2>
            <p className="text-xs text-muted-foreground">Edit creates new versions</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border shrink-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EditorTool)}>
          <TabsList variant="underline" className="w-full justify-start px-2 h-auto py-0">
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                variant="underline"
                className="px-3 py-2.5 text-xs gap-1.5"
              >
                <tab.icon className="w-3.5 h-3.5" />
                {getTabLabel(tab.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Crop Tab */}
          {activeTab === "crop" && (
            <>
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
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  AI will intelligently crop or extend your image to fit the new aspect ratio.
                </p>
              </div>
            </>
          )}

          {/* Prompt Edit Tab */}
          {activeTab === "prompt" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t.editor.describeChanges}
                </label>
                <Textarea
                  variant="glow"
                  placeholder={t.editor.describeChanges}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  AI will interpret your description and apply changes while preserving the overall composition.
                </p>
              </div>
            </>
          )}

          {/* Inpaint Tab */}
          {activeTab === "inpaint" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  What should appear in the selected area?
                </label>
                <Textarea
                  variant="glow"
                  placeholder="Describe what you want to appear in the masked area..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
                <p className="text-xs font-medium">How to use:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Draw on the canvas to select the area</li>
                  <li>Describe what should replace it</li>
                  <li>Click Apply to generate</li>
                </ol>
              </div>
            </>
          )}

          {/* Relight Tab */}
          {activeTab === "relight" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t.editor.lightDirection}
                </label>
                <Textarea
                  variant="glow"
                  placeholder="e.g., 'Warm sunset lighting from the left side'"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t.editor.lightIntensity}
                  </label>
                  <Badge variant="secondary" size="sm">
                    {intensity[0]}%
                  </Badge>
                </div>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={100}
                  step={5}
                />
              </div>
            </>
          )}

          {/* Upscale Tab */}
          {activeTab === "upscale" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Upscale Factor
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={upscaleFactor === "2x" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUpscaleFactor("2x")}
                    className="flex-col h-auto py-3"
                  >
                    <span className="text-lg font-bold">2×</span>
                    <span className="text-xs opacity-70">Double</span>
                  </Button>
                  <Button
                    variant={upscaleFactor === "4x" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUpscaleFactor("4x")}
                    className="flex-col h-auto py-3"
                  >
                    <span className="text-lg font-bold">4×</span>
                    <span className="text-xs opacity-70">Quadruple</span>
                  </Button>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  AI upscaling enhances resolution while adding realistic details. Best for print or high-res displays.
                </p>
              </div>
            </>
          )}

          {/* Motion Tab */}
          {activeTab === "motion" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t.editor.motionDirection}
                </label>
                <Textarea
                  variant="glow"
                  placeholder="e.g., 'Slow camera pan to the right'"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t.editor.motionStrength}
                  </label>
                  <Badge variant="secondary" size="sm">
                    {intensity[0]}%
                  </Badge>
                </div>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={100}
                  step={5}
                />
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  Higher motion strength creates more dynamic movement but may reduce stability.
                </p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Apply Button */}
      <div className="p-4 border-t border-border space-y-2 shrink-0">
        <Button
          variant="glow"
          className="w-full"
          onClick={handleApply}
          disabled={!canApply}
        >
          <Sparkles className="w-4 h-4" />
          {t.editor.applyChanges}
          <ChevronRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Creates a new version • Original preserved
        </p>
      </div>
    </div>
  );
}