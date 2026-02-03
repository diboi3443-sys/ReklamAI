import * as React from "react";
import { useState } from "react";
import {
  Image,
  Video,
  Wand2,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Edit,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTranslation } from "@/i18n";

// Mock feature registry
const featureRegistry = [
  {
    mode: "image",
    icon: Image,
    features: [
      { id: "t2i", name: "Text to Image", inputs: ["prompt"], models: ["Flux Pro", "SDXL", "Midjourney"], defaultModel: "Flux Pro" },
      { id: "i2i", name: "Image to Image", inputs: ["prompt", "image"], models: ["Flux Pro", "SDXL"], defaultModel: "Flux Pro" },
      { id: "inpaint", name: "Inpaint", inputs: ["prompt", "image", "mask"], models: ["SDXL", "Flux Pro"], defaultModel: "SDXL" },
      { id: "outpaint", name: "Outpaint", inputs: ["prompt", "image"], models: ["SDXL"], defaultModel: "SDXL" },
      { id: "upscale", name: "Upscale", inputs: ["image"], models: ["Real-ESRGAN"], defaultModel: "Real-ESRGAN" },
      { id: "relight", name: "Relight", inputs: ["image", "light-direction"], models: ["IC-Light"], defaultModel: "IC-Light" },
    ],
  },
  {
    mode: "video",
    icon: Video,
    features: [
      { id: "t2v", name: "Text to Video", inputs: ["prompt"], models: ["Runway Gen-3", "Pika"], defaultModel: "Runway Gen-3" },
      { id: "i2v", name: "Image to Video", inputs: ["prompt", "start-frame"], models: ["Runway Gen-3", "Pika"], defaultModel: "Runway Gen-3" },
      { id: "v2v", name: "Video to Video", inputs: ["prompt", "video"], models: ["Runway Gen-3"], defaultModel: "Runway Gen-3" },
    ],
  },
];

// Mock presets
const presets = [
  { id: "cinematic", name: "Cinematic Portrait", category: "Photography", model: "Flux Pro", active: true },
  { id: "anime", name: "Anime Style", category: "Illustration", model: "SDXL", active: true },
  { id: "product", name: "Product Shot", category: "Commercial", model: "Flux Pro", active: true },
  { id: "abstract", name: "Abstract Art", category: "Art", model: "Midjourney", active: false },
  { id: "landscape", name: "Epic Landscape", category: "Photography", model: "Flux Pro", active: true },
  { id: "logo", name: "Logo Design", category: "Design", model: "SDXL", active: false },
];

export default function AdminFeatures() {
  const { t } = useTranslation();
  const [expandedModes, setExpandedModes] = useState<string[]>(["image", "video"]);
  const [presetList, setPresetList] = useState(presets);

  const toggleMode = (mode: string) => {
    setExpandedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const togglePreset = (id: string) => {
    setPresetList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "image": return t.modes.image;
      case "video": return t.modes.video;
      default: return mode;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t.admin.features}</h1>
          <p className="text-muted-foreground">Configure generation features and preset templates</p>
        </div>

        {/* Feature Registry */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Registry</CardTitle>
            <CardDescription>Available generation features organized by mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featureRegistry.map((modeGroup) => (
              <Collapsible
                key={modeGroup.mode}
                open={expandedModes.includes(modeGroup.mode)}
                onOpenChange={() => toggleMode(modeGroup.mode)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  {expandedModes.includes(modeGroup.mode) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <modeGroup.icon className="w-4 h-4 text-primary" />
                  <span className="font-medium">{getModeLabel(modeGroup.mode)} Mode</span>
                  <Badge variant="outline" size="sm" className="ml-auto">
                    {modeGroup.features.length} features
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-2 pl-6">
                    {modeGroup.features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                      >
                        <div>
                          <p className="font-medium">{feature.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Inputs: {feature.inputs.join(", ")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Default Model</p>
                            <Badge variant="secondary" size="sm">{feature.defaultModel}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Models</p>
                            <p className="text-sm">{feature.models.length} available</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        <Separator />

        {/* Presets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Presets Library</CardTitle>
                <CardDescription>Curated templates for quick generation</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Add Preset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {presetList.map((preset) => (
                <div
                  key={preset.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    preset.active
                      ? "border-border bg-card"
                      : "border-border/50 bg-card/50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{preset.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" size="sm">{preset.category}</Badge>
                        <Badge variant="secondary" size="sm">{preset.model}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Switch
                        checked={preset.active}
                        onCheckedChange={() => togglePreset(preset.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {featureRegistry.reduce((acc, m) => acc + m.features.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Features</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{presetList.length}</p>
              <p className="text-sm text-muted-foreground">Total Presets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{presetList.filter((p) => p.active).length}</p>
              <p className="text-sm text-muted-foreground">{t.account.active} Presets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{featureRegistry.length}</p>
              <p className="text-sm text-muted-foreground">Generation Modes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}