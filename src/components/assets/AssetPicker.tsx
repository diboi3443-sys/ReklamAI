import * as React from "react";
import { useState, useMemo } from "react";
import {
  Search,
  Grid3X3,
  List,
  Image,
  Video,
  Music,
  Check,
  Upload,
  X,
  Play,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Asset, AssetType, mockAssets, formatFileSize, formatDuration } from "@/lib/assets";
import { useTranslation } from "@/i18n";

interface AssetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: Asset) => void;
  allowedTypes?: AssetType[];
  title?: string;
  actionLabel?: string;
}

export function AssetPicker({
  open,
  onOpenChange,
  onSelect,
  allowedTypes = ["image", "video"],
  title,
  actionLabel,
}: AssetPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<AssetType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = useMemo(() => {
    return mockAssets.filter((asset) => {
      // Filter by allowed types
      if (!allowedTypes.includes(asset.type)) return false;
      
      // Filter by selected type tab
      if (selectedType !== "all" && asset.type !== selectedType) return false;
      
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          asset.name.toLowerCase().includes(searchLower) ||
          asset.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [search, selectedType, allowedTypes]);

  const handleSelect = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onOpenChange(false);
      setSelectedAsset(null);
      setSearch("");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedAsset(null);
    setSearch("");
  };

  const typeIcons = {
    image: Image,
    video: Video,
    audio: Music,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title || t.assets.chooseFromAssets}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and View Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t.assets.searchAssets}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Type Tabs */}
          {allowedTypes.length > 1 && (
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as AssetType | "all")}>
              <TabsList>
                <TabsTrigger value="all">{t.common.all}</TabsTrigger>
                {allowedTypes.includes("image") && (
                  <TabsTrigger value="image" className="gap-1.5">
                    <Image className="w-4 h-4" />
                    {t.assets.images}
                  </TabsTrigger>
                )}
                {allowedTypes.includes("video") && (
                  <TabsTrigger value="video" className="gap-1.5">
                    <Video className="w-4 h-4" />
                    {t.assets.videos}
                  </TabsTrigger>
                )}
                {allowedTypes.includes("audio") && (
                  <TabsTrigger value="audio" className="gap-1.5">
                    <Music className="w-4 h-4" />
                    {t.assets.audio}
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          )}

          {/* Asset Grid/List */}
          <ScrollArea className="h-[400px]">
            {filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Image className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">{t.assets.noAssets}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {t.assets.uploadToGetStarted}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-1">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const TypeIcon = typeIcons[asset.type];
                  
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden cursor-pointer group",
                        "ring-2 ring-transparent transition-all",
                        isSelected && "ring-primary"
                      )}
                    >
                      {asset.thumbnail ? (
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <TypeIcon className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className={cn(
                        "absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        {isSelected ? (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-5 h-5 text-primary-foreground" />
                          </div>
                        ) : (
                          <p className="text-xs text-white text-center px-2 truncate">
                            {asset.name}
                          </p>
                        )}
                      </div>

                      {/* Type Badge */}
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="absolute top-1.5 left-1.5 bg-black/60 border-0"
                      >
                        <TypeIcon className="w-3 h-3" />
                      </Badge>

                      {/* Duration for video/audio */}
                      {asset.duration && (
                        <Badge
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-1.5 right-1.5 bg-black/60 border-0"
                        >
                          <Play className="w-3 h-3" />
                          {formatDuration(asset.duration)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const TypeIcon = typeIcons[asset.type];
                  
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                        "hover:bg-secondary/80",
                        isSelected && "bg-primary/10 ring-1 ring-primary"
                      )}
                    >
                      {asset.thumbnail ? (
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{asset.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(asset.size)}</span>
                          {asset.width && asset.height && (
                            <span>{asset.width}×{asset.height}</span>
                          )}
                          {asset.duration && (
                            <span>{formatDuration(asset.duration)}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="glow"
            onClick={handleSelect}
            disabled={!selectedAsset}
          >
            {actionLabel || t.assets.selectAsset}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
