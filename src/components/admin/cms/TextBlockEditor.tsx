import * as React from "react";
import { useState } from "react";
import {
  Type,
  AlignLeft,
  Link,
  Palette,
  MousePointer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface TextBlockData {
  heading: string;
  subheading: string;
  body: string;
  style: "light" | "dark" | "accent" | "gradient";
  showCta: boolean;
  ctaLabel: string;
  ctaTarget: string;
  ctaStyle: "default" | "outline" | "gradient";
}

const mockTextBlock: TextBlockData = {
  heading: "Welcome back",
  subheading: "What will you create today?",
  body: "",
  style: "dark",
  showCta: false,
  ctaLabel: "Get Started",
  ctaTarget: "/studio",
  ctaStyle: "gradient",
};

interface TextBlockEditorProps {
  sectionId: string;
  onChangesMade: () => void;
}

export default function TextBlockEditor({ sectionId, onChangesMade }: TextBlockEditorProps) {
  const [data, setData] = useState<TextBlockData>(mockTextBlock);

  const updateField = <K extends keyof TextBlockData>(key: K, value: TextBlockData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    onChangesMade();
  };

  const getStylePreview = () => {
    const styles: Record<string, string> = {
      light: "bg-background text-foreground",
      dark: "bg-card text-foreground",
      accent: "bg-primary/10 text-foreground",
      gradient: "gradient-brand-subtle text-foreground",
    };
    return styles[data.style];
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Text / Promo Block</h3>
        <p className="text-sm text-muted-foreground">Edit heading, content, and call-to-action</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-6">
          <Tabs defaultValue="content">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="cta">CTA</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Heading
                </Label>
                <Input
                  value={data.heading}
                  onChange={(e) => updateField("heading", e.target.value)}
                  placeholder="Main heading"
                />
              </div>

              <div className="space-y-2">
                <Label>Subheading</Label>
                <Input
                  value={data.subheading}
                  onChange={(e) => updateField("subheading", e.target.value)}
                  placeholder="Supporting text"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" />
                  Body Text (optional)
                </Label>
                <Textarea
                  value={data.body}
                  onChange={(e) => updateField("body", e.target.value)}
                  placeholder="Additional content..."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Background Style
                </Label>
                <Select
                  value={data.style}
                  onValueChange={(v) => updateField("style", v as TextBlockData["style"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark (Card)</SelectItem>
                    <SelectItem value="accent">Accent</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(["light", "dark", "accent", "gradient"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateField("style", style)}
                    className={`h-12 rounded-lg border-2 transition-colors ${
                      data.style === style ? "border-primary" : "border-transparent"
                    } ${
                      style === "light" ? "bg-background" :
                      style === "dark" ? "bg-card" :
                      style === "accent" ? "bg-primary/10" :
                      "gradient-brand-subtle"
                    }`}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cta" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  Show CTA Button
                </Label>
                <Switch
                  checked={data.showCta}
                  onCheckedChange={(v) => updateField("showCta", v)}
                />
              </div>

              {data.showCta && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label>Button Label</Label>
                    <Input
                      value={data.ctaLabel}
                      onChange={(e) => updateField("ctaLabel", e.target.value)}
                      placeholder="Get Started"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Target
                    </Label>
                    <Select
                      value={data.ctaTarget}
                      onValueChange={(v) => updateField("ctaTarget", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/studio">Studio</SelectItem>
                        <SelectItem value="/pricing">Pricing</SelectItem>
                        <SelectItem value="/academy">Academy</SelectItem>
                        <SelectItem value="/library">Library</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Button Style</Label>
                    <Select
                      value={data.ctaStyle}
                      onValueChange={(v) => updateField("ctaStyle", v as TextBlockData["ctaStyle"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Live Preview</Label>
          <Card className="overflow-hidden">
            <CardContent className={`p-6 ${getStylePreview()}`}>
              <div className="space-y-2">
                {data.heading && (
                  <h2 className="text-2xl font-bold tracking-tight">{data.heading}</h2>
                )}
                {data.subheading && (
                  <p className="text-muted-foreground">{data.subheading}</p>
                )}
                {data.body && (
                  <p className="text-sm mt-4">{data.body}</p>
                )}
                {data.showCta && (
                  <div className="mt-4">
                    <Button
                      variant={data.ctaStyle === "outline" ? "outline" : "default"}
                      className={data.ctaStyle === "gradient" ? "gradient-brand" : ""}
                    >
                      {data.ctaLabel}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
