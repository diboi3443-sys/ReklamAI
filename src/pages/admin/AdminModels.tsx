import * as React from "react";
import { useState } from "react";
import {
  Search,
  Check,
  X,
  Image,
  Video,
  Wand2,
  Maximize,
  Lightbulb,
  Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/i18n";

// Mock models data
const mockModels = [
  { 
    id: "flux-pro",
    name: "Flux Pro", 
    provider: "Black Forest Labs",
    type: "image",
    status: true,
    capabilities: ["start-frame", "end-frame", "inpaint"],
    baseCost: 0.02,
    finalCost: 8,
  },
  { 
    id: "flux-schnell",
    name: "Flux Schnell", 
    provider: "Black Forest Labs",
    type: "image",
    status: true,
    capabilities: ["fast"],
    baseCost: 0.008,
    finalCost: 4,
  },
  { 
    id: "sdxl",
    name: "SDXL", 
    provider: "Stability AI",
    type: "image",
    status: true,
    capabilities: ["inpaint", "outpaint"],
    baseCost: 0.012,
    finalCost: 5,
  },
  { 
    id: "midjourney-v6",
    name: "Midjourney v6", 
    provider: "Midjourney",
    type: "image",
    status: false,
    capabilities: ["stylize", "vary"],
    baseCost: 0.025,
    finalCost: 10,
  },
  { 
    id: "runway-gen3",
    name: "Runway Gen-3 Alpha", 
    provider: "Runway",
    type: "video",
    status: true,
    capabilities: ["start-frame", "motion-brush", "camera-control"],
    baseCost: 0.10,
    finalCost: 35,
  },
  { 
    id: "pika-labs",
    name: "Pika 1.0", 
    provider: "Pika Labs",
    type: "video",
    status: true,
    capabilities: ["start-frame", "lip-sync"],
    baseCost: 0.08,
    finalCost: 28,
  },
  { 
    id: "real-esrgan",
    name: "Real-ESRGAN", 
    provider: "Open Source",
    type: "upscale",
    status: true,
    capabilities: ["4x", "anime"],
    baseCost: 0.005,
    finalCost: 3,
  },
  { 
    id: "ic-light",
    name: "IC-Light", 
    provider: "Open Source",
    type: "relight",
    status: true,
    capabilities: ["foreground", "background"],
    baseCost: 0.015,
    finalCost: 7,
  },
];

const capabilityIcons: Record<string, React.ReactNode> = {
  "start-frame": <Image className="w-3 h-3" />,
  "end-frame": <Image className="w-3 h-3" />,
  "inpaint": <Wand2 className="w-3 h-3" />,
  "outpaint": <Maximize className="w-3 h-3" />,
  "motion-brush": <Play className="w-3 h-3" />,
  "camera-control": <Video className="w-3 h-3" />,
  "relight": <Lightbulb className="w-3 h-3" />,
};

export default function AdminModels() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [models, setModels] = useState(mockModels);

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  );

  const toggleModel = (id: string) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: !m.status } : m))
    );
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      image: "default",
      video: "secondary",
      upscale: "outline",
      relight: "outline",
    };
    const labels: Record<string, string> = {
      image: t.modes.image,
      video: t.modes.video,
      upscale: t.editor.upscale,
      relight: t.editor.relight,
    };
    return <Badge variant={variants[type] || "outline"} size="sm">{labels[type] || type}</Badge>;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.admin.aiModels}</h1>
            <p className="text-muted-foreground">Manage available AI models and their settings</p>
          </div>
          <Button variant="outline">Add Model</Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`${t.common.search} models...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Models Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.studio.model}</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>{t.common.type}</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead className="text-right">Base Cost</TableHead>
                  <TableHead className="text-right">Final (Cr)</TableHead>
                  <TableHead className="text-center">{t.common.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => (
                  <TableRow key={model.id} className={!model.status ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell className="text-muted-foreground">{model.provider}</TableCell>
                    <TableCell>{getTypeBadge(model.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((cap) => (
                          <Tooltip key={cap}>
                            <TooltipTrigger>
                              <Badge variant="outline" size="sm" className="gap-1">
                                {capabilityIcons[cap] || null}
                                {cap}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>{cap}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${model.baseCost.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {model.finalCost}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={model.status}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{models.length}</p>
              <p className="text-sm text-muted-foreground">Total Models</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{models.filter((m) => m.status).length}</p>
              <p className="text-sm text-muted-foreground">{t.account.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{models.filter((m) => m.type === "image").length}</p>
              <p className="text-sm text-muted-foreground">{t.modes.image} Models</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{models.filter((m) => m.type === "video").length}</p>
              <p className="text-sm text-muted-foreground">{t.modes.video} Models</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}