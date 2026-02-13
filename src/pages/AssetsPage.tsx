import * as React from "react";
import { useState, useMemo } from "react";
import {
  Grid3X3,
  List,
  Search,
  Upload,
  Image,
  Video,
  Music,
  MoreHorizontal,
  Download,
  Trash2,
  Edit2,
  Eye,
  Check,
  Calendar,
  Tag,
  LayoutGrid,
  Filter,
  Play,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Asset, AssetType, mockAssets, getAllTags, formatFileSize, formatDuration } from "@/lib/assets";
import { mockBoards } from "@/lib/boards";
import { UploadModal } from "@/components/assets/UploadModal";
import { useTranslation } from "@/i18n";

type ViewMode = "grid" | "list";

export default function AssetsPage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<AssetType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const allTags = useMemo(() => getAllTags(), []);

  const filteredAssets = useMemo(() => {
    return mockAssets.filter((asset) => {
      // Filter by type tab
      if (activeTab !== "all" && asset.type !== activeTab) return false;

      // Filter by search
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesName = asset.name.toLowerCase().includes(search);
        const matchesTags = asset.tags.some((tag) => tag.toLowerCase().includes(search));
        if (!matchesName && !matchesTags) return false;
      }

      // Filter by tag
      if (tagFilter !== "all" && !asset.tags.includes(tagFilter)) return false;

      // Filter by board
      if (boardFilter !== "all" && asset.boardId !== boardFilter) return false;

      // Filter by date
      if (dateFilter !== "all") {
        const assetDate = new Date(asset.createdAt);
        const now = new Date();
        switch (dateFilter) {
          case "today":
            if (assetDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (assetDate < weekAgo) return false;
            break;
          case "month":
            if (assetDate.getMonth() !== now.getMonth() || 
                assetDate.getFullYear() !== now.getFullYear()) return false;
            break;
        }
      }

      return true;
    });
  }, [activeTab, searchQuery, tagFilter, boardFilter, dateFilter]);

  const counts = useMemo(() => ({
    all: mockAssets.length,
    image: mockAssets.filter((a) => a.type === "image").length,
    video: mockAssets.filter((a) => a.type === "video").length,
    audio: mockAssets.filter((a) => a.type === "audio").length,
  }), []);

  const hasFilters = tagFilter !== "all" || boardFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setTagFilter("all");
    setBoardFilter("all");
    setDateFilter("all");
    setSearchQuery("");
  };

  const typeIcons = {
    image: Image,
    video: Video,
    audio: Music,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{t.assets.title}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAssets.length} {t.assets.assets}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.library.gridView}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.library.listView}</TooltipContent>
              </Tooltip>
            </div>

            {/* Upload Button */}
            <Button variant="glow" onClick={() => setUploadModalOpen(true)}>
              <Upload className="w-4 h-4" />
              {t.assets.upload}
            </Button>
          </div>
        </div>

        {/* Type Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetType | "all")}>
          <TabsList>
            <TabsTrigger value="all">
              {t.common.all}
              <Badge variant="secondary" size="sm" className="ml-1.5">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5">
              <Image className="w-4 h-4" />
              {t.assets.images}
              <Badge variant="secondary" size="sm" className="ml-1">
                {counts.image}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1.5">
              <Video className="w-4 h-4" />
              {t.assets.videos}
              <Badge variant="secondary" size="sm" className="ml-1">
                {counts.video}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="audio" className="gap-1.5" disabled>
              <Music className="w-4 h-4" />
              {t.assets.audio}
              <Badge variant="outline" size="sm" className="ml-1">
                {t.assets.comingSoon}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.assets.searchAssets}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[140px]">
              <Tag className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t.assets.tags} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all} Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={boardFilter} onValueChange={setBoardFilter}>
            <SelectTrigger className="w-[150px]">
              <LayoutGrid className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t.boards.title} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all} Boards</SelectItem>
              {mockBoards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t.common.date} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all}</SelectItem>
              <SelectItem value="today">{t.time.today}</SelectItem>
              <SelectItem value="week">{t.time.daysAgo}</SelectItem>
              <SelectItem value="month">{t.time.daysAgo}</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" /> {t.studio.clearPrompt}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                <Image className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">{t.assets.noAssets}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {t.assets.uploadToGetStarted}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setUploadModalOpen(true)}
              >
                <Upload className="w-4 h-4" />
                {t.assets.upload}
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filteredAssets.map((asset) => {
                const TypeIcon = typeIcons[asset.type];
                return (
                  <Card key={asset.id} variant="interactive" className="overflow-hidden group">
                    <div className="relative aspect-square">
                      {asset.thumbnail ? (
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <TypeIcon className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon-sm"
                          onClick={() => setPreviewAsset(asset)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="icon-sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Type Badge */}
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 bg-black/60 border-0"
                      >
                        <TypeIcon className="w-3 h-3" />
                        {asset.type}
                      </Badge>

                      {/* Duration for video/audio */}
                      {asset.duration && (
                        <Badge
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 right-2 bg-black/60 border-0"
                        >
                          <Play className="w-3 h-3" />
                          {formatDuration(asset.duration)}
                        </Badge>
                      )}

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
                            <Eye className="w-4 h-4 mr-2" /> {t.assets.preview}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" /> {t.boards.rename}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" /> {t.common.download}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> {t.common.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(asset.size)}</span>
                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" size="sm">
                              {tag}
                            </Badge>
                          ))}
                          {asset.tags.length > 2 && (
                            <Badge variant="outline" size="sm">
                              +{asset.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 max-w-4xl">
              {filteredAssets.map((asset) => {
                const TypeIcon = typeIcons[asset.type];
                return (
                  <Card key={asset.id} variant="interactive" className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-3">
                        {/* Thumbnail */}
                        {asset.thumbnail ? (
                          <img
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                            <TypeIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{asset.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" size="sm">
                              <TypeIcon className="w-3 h-3" />
                              {asset.type}
                            </Badge>
                            <span>{formatFileSize(asset.size)}</span>
                            {asset.width && asset.height && (
                              <span>{asset.width}×{asset.height}</span>
                            )}
                            {asset.duration && (
                              <span>{formatDuration(asset.duration)}</span>
                            )}
                          </div>
                          {asset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {asset.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Date */}
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(asset.createdAt).toLocaleDateString()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPreviewAsset(asset)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit2 className="w-4 h-4 mr-2" /> {t.boards.rename}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> {t.common.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />

      {/* Preview Modal */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
          {previewAsset && (
            <>
              <div className="relative aspect-video bg-black">
                {previewAsset.thumbnail ? (
                  <img
                    src={previewAsset.url || previewAsset.thumbnail}
                    alt={previewAsset.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{previewAsset.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{formatFileSize(previewAsset.size)}</span>
                      {previewAsset.width && previewAsset.height && (
                        <span>{previewAsset.width}×{previewAsset.height}</span>
                      )}
                      {previewAsset.duration && (
                        <span>{formatDuration(previewAsset.duration)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                      {t.common.download}
                    </Button>
                  </div>
                </div>
                {previewAsset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {previewAsset.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
