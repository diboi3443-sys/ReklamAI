import * as React from "react";
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  Edit3,
  Trash2,
  Share2,
  Grid3X3,
  List,
  Search,
  Filter,
  Image,
  Video,
  ExternalLink,
  RefreshCw,
  Shuffle,
  Copy,
  Play,
  Wand2,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer, PageHeader, PageContent } from "@/components/ui/page-layout";
import { getBoardById, getBoardItems, mockBoardItems, BoardItem, Board } from "@/lib/boards";
import { ModeId } from "@/lib/features";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

// Mode icons
const modeIcons: Record<ModeId, React.ElementType> = {
  image: Image,
  video: Video,
  edit: Wand2,
  character: Image,
  inpaint: Wand2,
  cinema: Video,
};

type ViewMode = "grid" | "list";

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");

  // Get board data
  const board = boardId ? getBoardById(boardId) : undefined;
  // For demo, show all mock items regardless of boardId
  const allItems = mockBoardItems;

  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...allItems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.prompt.toLowerCase().includes(query) ||
          item.featureName.toLowerCase().includes(query) ||
          item.model.toLowerCase().includes(query)
      );
    }

    if (modeFilter !== "all") {
      result = result.filter((item) => item.mode === modeFilter);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allItems, searchQuery, modeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleItemAction = (action: string, item: BoardItem) => {
    switch (action) {
      case "open":
        navigate(`/studio?load=${item.id}&board=${boardId}`);
        break;
      case "edit":
        navigate(`/studio?load=${item.id}&board=${boardId}&edit=true`);
        break;
      default:
        console.log(`Action ${action} on item ${item.id}`);
    }
  };

  if (!board) {
    return (
      <PageContainer>
        <PageContent>
          <div className="flex flex-col items-center justify-center h-full py-16">
            <h2 className="text-lg font-medium mb-2">{t.boards.boardNotFound}</h2>
            <Button variant="outline" onClick={() => navigate("/boards")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.boards.backToBoards}
            </Button>
          </div>
        </PageContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Board Header */}
      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/boards")}
              className="shrink-0 mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{board.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {board.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  {board.itemsCount} {t.boards.items}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t.boards.created}: {new Date(board.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              {t.common.share}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" /> {t.boards.editInfo}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> {t.boards.deleteBoard}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <PageContent>
        <ScrollArea className="flex-1">
          <div className="space-y-4 pb-8">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t.library.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={modeFilter} onValueChange={setModeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.library.allModes}</SelectItem>
                    <SelectItem value="image">{t.modes.image}</SelectItem>
                    <SelectItem value="video">{t.modes.video}</SelectItem>
                    <SelectItem value="edit">{t.modes.edit}</SelectItem>
                    <SelectItem value="character">{t.modes.character}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Items Grid/List */}
            {filteredItems.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredItems.map((item) => (
                    <BoardItemCard
                      key={item.id}
                      item={item}
                      onAction={handleItemAction}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <BoardItemRow
                      key={item.id}
                      item={item}
                      onAction={handleItemAction}
                      formatDate={formatDate}
                      t={t}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Image className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-1">{t.boards.noItems}</h3>
                <p className="text-muted-foreground mb-4">{t.boards.startGenerating}</p>
                <Button onClick={() => navigate(`/studio?board=${boardId}`)}>
                  {t.boards.goToStudio}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </PageContent>
    </PageContainer>
  );
}

// Grid Card Component
function BoardItemCard({ item, onAction, t }: { item: BoardItem; onAction: (action: string, item: BoardItem) => void; t: any }) {
  const ModeIcon = modeIcons[item.mode];

  return (
    <Card variant="interactive" className="overflow-hidden group">
      <div className="relative aspect-square">
        <img
          src={item.thumbnail}
          alt={item.prompt || "Generated content"}
          className="w-full h-full object-cover"
        />

        {/* Status overlay */}
        {item.status === "generating" && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
        {item.status === "error" && (
          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Prompt on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-white line-clamp-2">{item.prompt || t.library.noPrompt}</p>
        </div>

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <Badge
            variant="secondary"
            size="sm"
            className="bg-black/60 backdrop-blur-sm border-0"
          >
            <ModeIcon className="w-3 h-3" />
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="bg-black/60 backdrop-blur-sm hover:bg-black/80 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onAction("open", item)}>
                <ExternalLink className="w-4 h-4 mr-2" /> {t.boards.openInStudio}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("edit", item)}>
                <Wand2 className="w-4 h-4 mr-2" /> {t.boards.openInEditor}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction("rerun", item)}>
                <RefreshCw className="w-4 h-4 mr-2" /> {t.common.rerun}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("remix", item)}>
                <Copy className="w-4 h-4 mr-2" /> {t.common.remix}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("variation", item)}>
                <Shuffle className="w-4 h-4 mr-2" /> {t.common.variation}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Version indicator */}
        {item.version > 1 && (
          <Badge
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm border-0"
          >
            v{item.version}
          </Badge>
        )}
      </div>
    </Card>
  );
}

// List Row Component
function BoardItemRow({ item, onAction, formatDate, t }: { item: BoardItem; onAction: (action: string, item: BoardItem) => void; formatDate: (date: string) => string; t: any }) {
  const ModeIcon = modeIcons[item.mode];

  return (
    <Card variant="interactive" className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-3">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
            <img
              src={item.thumbnail}
              alt={item.prompt || "Generated content"}
              className="w-full h-full object-cover"
            />
            {item.status === "generating" && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{item.prompt || t.library.noPrompt}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ModeIcon className="w-3 h-3" />
                {item.featureName}
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {item.model}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="shrink-0">
            {item.status === "ready" && (
              <Badge variant="success" size="sm">
                <Check className="w-3 h-3" />
                {t.common.ready}
              </Badge>
            )}
            {item.status === "generating" && (
              <Badge variant="info" size="sm">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t.common.generating}
              </Badge>
            )}
            {item.status === "error" && (
              <Badge variant="destructive" size="sm">
                <AlertCircle className="w-3 h-3" />
                {t.common.error}
              </Badge>
            )}
          </div>

          {/* Date */}
          <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
            {formatDate(item.createdAt)}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction("open", item)}>
                <ExternalLink className="w-4 h-4 mr-2" /> {t.boards.openInStudio}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("rerun", item)}>
                <RefreshCw className="w-4 h-4 mr-2" /> {t.common.rerun}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("variation", item)}>
                <Shuffle className="w-4 h-4 mr-2" /> {t.common.variation}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
