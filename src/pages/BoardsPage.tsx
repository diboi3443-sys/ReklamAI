import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MoreHorizontal,
  Folder,
  Clock,
  Image,
  Copy,
  Trash2,
  Edit3,
  Pin,
  SortAsc,
  Filter,
  Grid3X3,
  LayoutGrid,
  Loader2,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer, PageHeader, PageContent } from "@/components/ui/page-layout";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

type SortOption = "recent" | "name" | "items";
type FilterOption = "all" | "pinned" | "active";

export default function BoardsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");

  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load boards from API
  useEffect(() => {
    async function loadBoards() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch<any[]>('/api/boards');
        // Map to Board format with itemsCount
        const boardsWithCounts = data.map((board: any) => ({
          ...board,
          itemsCount: board.items_count || 0,
          isPinned: board.is_pinned || false,
          updatedAt: board.updated_at || board.created_at,
        }));
        setBoards(boardsWithCounts);
      } catch (err) {
        console.error('Failed to load boards:', err);
      }
      setLoading(false);
    }
    loadBoards();
  }, [user]);

  // Filter and sort boards
  const filteredBoards = React.useMemo(() => {
    let result = [...boards];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (board) =>
          board.title.toLowerCase().includes(query) ||
          (board.description || '').toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterBy === "pinned") {
      result = result.filter((board) => board.isPinned);
    } else if (filterBy === "active") {
      // Active = updated in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((board) => new Date(board.updatedAt) > weekAgo);
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "items":
        result.sort((a, b) => b.itemsCount - a.itemsCount);
        break;
      case "recent":
      default:
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    return result;
  }, [searchQuery, sortBy, filterBy]);

  const handleOpenBoard = (boardId: string) => {
    navigate(`/boards/${boardId}`);
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error(t.common.error);
      return;
    }

    if (!user) {
      toast.error(t.common.error);
      return;
    }

    try {
      const data = await apiFetch<any>('/api/boards', {
        method: 'POST',
        body: JSON.stringify({
          title: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
        }),
      });

      // Add to boards list
      setBoards((prev) => [{
        ...data,
        itemsCount: 0,
        isPinned: data.is_pinned || false,
        updatedAt: data.updated_at || data.created_at,
      }, ...prev]);

      toast.success(t.common.success);
      setCreateDialogOpen(false);
      setNewBoardName("");
      setNewBoardDescription("");
    } catch (error: any) {
      console.error('Error creating board:', error);
      toast.error(error.message || t.common.error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t.time.today;
    if (diffDays === 1) return t.time.yesterday;
    if (diffDays < 7) return `${diffDays} ${t.time.daysAgo}`;
    return date.toLocaleDateString();
  };

  return (
    <PageContainer>
      <PageHeader
        title={t.boards.title}
        description={t.boards.description}
      />

      <PageContent>
        <ScrollArea className="flex-1">
          <div className="space-y-6 pb-8">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full sm:w-auto">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t.boards.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.common.all}</SelectItem>
                    <SelectItem value="pinned">{t.boards.pinned}</SelectItem>
                    <SelectItem value="active">{t.boards.active}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[130px]">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">{t.common.recent}</SelectItem>
                    <SelectItem value="name">{t.boards.byName}</SelectItem>
                    <SelectItem value="items">{t.boards.byItems}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {t.boards.createBoard}
              </Button>
            </div>

            {/* Boards Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">{t.common.loading}</span>
              </div>
            ) : filteredBoards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    onOpen={() => handleOpenBoard(board.id)}
                    formatDate={formatDate}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">{t.boards.noBoards}</h3>
                <p className="text-muted-foreground mb-4">{t.boards.createFirstBoard}</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.boards.createBoard}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </PageContent>

      {/* Create Board Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.boards.createBoard}</DialogTitle>
            <DialogDescription>{t.boards.createBoardDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">{t.boards.boardName}</Label>
              <Input
                id="board-name"
                placeholder={t.boards.boardNamePlaceholder}
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-description">{t.boards.boardDescription}</Label>
              <Textarea
                id="board-description"
                placeholder={t.boards.boardDescriptionPlaceholder}
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
              {t.boards.createBoard}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

// Board Card Component
interface BoardCardProps {
  board: any; // Board from Supabase with mapped fields
  onOpen: () => void;
  formatDate: (date: string) => string;
  t: any;
}

function BoardCard({ board, onOpen, formatDate, t }: BoardCardProps) {
  return (
    <Card
      variant="interactive"
      className="group overflow-hidden cursor-pointer"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted">
        {board.thumbnail ? (
          <img
            src={board.thumbnail}
            alt={board.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Folder className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Pinned badge */}
        {board.isPinned && (
          <Badge
            variant="secondary"
            size="sm"
            className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm border-0 gap-1"
          >
            <Pin className="w-3 h-3" />
            {t.boards.pinned}
          </Badge>
        )}

        {/* Actions dropdown */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="bg-black/60 backdrop-blur-sm hover:bg-black/80"
              >
                <MoreHorizontal className="w-4 h-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                <Folder className="w-4 h-4 mr-2" /> {t.common.open}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Edit3 className="w-4 h-4 mr-2" /> {t.boards.rename}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Copy className="w-4 h-4 mr-2" /> {t.boards.duplicate}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Pin className="w-4 h-4 mr-2" /> {board.isPinned ? t.boards.unpin : t.boards.pin}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4 mr-2" /> {t.common.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Items count */}
        <div className="absolute bottom-2 right-2">
          <Badge
            variant="secondary"
            size="sm"
            className="bg-black/60 backdrop-blur-sm border-0 gap-1"
          >
            <Image className="w-3 h-3" />
            {board.itemsCount || 0}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
          {board.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {board.description || ''}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDate(board.updatedAt || board.updated_at || board.created_at)}
        </div>
      </CardContent>
    </Card>
  );
}
