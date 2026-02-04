import * as React from "react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid3X3,
  List,
  Search,
  Filter,
  Image,
  Video,
  Mic,
  Type,
  Calendar,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  RefreshCw,
  X,
  Shuffle,
  Play,
  Wand2,
  ExternalLink,
  Zap,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Sparkles,
  TrendingUp,
  Sun,
  Crop,
  UserCircle,
  Paintbrush,
  Clapperboard,
  LayoutGrid,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader, PageContent } from "@/components/ui/page-layout";
import { ModeId, modes, featuresByMode } from "@/lib/features";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";

// Types
type ItemStatus = "ready" | "generating" | "error";
type VersionType = "generated" | "edited" | "variation" | "upscaled" | "relit" | "cropped";

interface LibraryItem {
  id: string;
  thumbnail: string;
  mode: ModeId;
  featureId: string;
  featureName: string;
  model: string;
  prompt: string;
  credits: number;
  status: ItemStatus;
  createdAt: string;
  parentId?: string;
  versionType: VersionType;
  versionLabel?: string;
}

const mockLibraryData: LibraryItem[] = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    mode: "image",
    featureId: "create-image",
    featureName: "Create Image",
    model: "FLUX.1 Pro",
    prompt: "Mountain landscape at golden hour with dramatic clouds",
    credits: 1.5,
    status: "ready",
    createdAt: "2024-01-15T10:30:00Z",
    versionType: "generated",
  },
  {
    id: "1-v1",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop",
    mode: "image",
    featureId: "create-image",
    featureName: "Create Image",
    model: "FLUX.1 Pro",
    prompt: "Mountain landscape at golden hour with dramatic clouds",
    credits: 1.5,
    status: "ready",
    createdAt: "2024-01-15T10:35:00Z",
    parentId: "1",
    versionType: "variation",
    versionLabel: "Variation",
  },
  {
    id: "1-v2",
    thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
    mode: "image",
    featureId: "relight",
    featureName: "Relight",
    model: "IC-Light",
    prompt: "Sunset lighting from the left",
    credits: 1,
    status: "ready",
    createdAt: "2024-01-15T10:40:00Z",
    parentId: "1-v1",
    versionType: "relit",
    versionLabel: "Relit",
  },
  {
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop",
    mode: "image",
    featureId: "cinema-image",
    featureName: "Cinema Studio Image",
    model: "FLUX.1 Pro",
    prompt: "Futuristic city skyline at night with neon lights",
    credits: 2,
    status: "ready",
    createdAt: "2024-01-14T15:45:00Z",
    versionType: "generated",
  },
  {
    id: "2-v1",
    thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop",
    mode: "image",
    featureId: "image-upscale",
    featureName: "Image Upscale",
    model: "Real-ESRGAN",
    prompt: "",
    credits: 0.5,
    status: "ready",
    createdAt: "2024-01-14T15:50:00Z",
    parentId: "2",
    versionType: "upscaled",
    versionLabel: "Upscaled 2x",
  },
  {
    id: "3",
    thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop",
    mode: "video",
    featureId: "create-video",
    featureName: "Create Video",
    model: "Runway Gen-3",
    prompt: "Forest with morning mist slowly moving",
    credits: 5,
    status: "ready",
    createdAt: "2024-01-13T09:00:00Z",
    versionType: "generated",
  },
  {
    id: "4",
    thumbnail: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
    mode: "video",
    featureId: "image-to-video",
    featureName: "Image to Video",
    model: "Kling",
    prompt: "Waterfall in tropical forest with gentle motion",
    credits: 5,
    status: "generating",
    createdAt: "2024-01-12T11:00:00Z",
    versionType: "generated",
  },
  {
    id: "5",
    thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop",
    mode: "edit",
    featureId: "draw-to-edit",
    featureName: "Draw to Edit",
    model: "FLUX.1 Fill",
    prompt: "Add a wooden cabin by the lake",
    credits: 1,
    status: "error",
    createdAt: "2024-01-11T14:30:00Z",
    versionType: "edited",
    versionLabel: "Inpainted",
  },
  {
    id: "6",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    mode: "character",
    featureId: "character-create",
    featureName: "Create Character",
    model: "FLUX.1 Pro",
    prompt: "Professional portrait of a young entrepreneur",
    credits: 2,
    status: "ready",
    createdAt: "2024-01-10T16:00:00Z",
    versionType: "generated",
  },
];

// Mode icons
const modeIcons: Record<ModeId, React.ElementType> = {
  image: Image,
  video: Video,
  edit: Wand2,
  character: UserCircle,
  inpaint: Paintbrush,
  cinema: Clapperboard,
};

// Version type icons
const versionTypeIcons: Record<VersionType, React.ElementType> = {
  generated: Sparkles,
  edited: Wand2,
  variation: Shuffle,
  upscaled: TrendingUp,
  relit: Sun,
  cropped: Crop,
};

// Status components
function StatusIndicator({ status }: { status: ItemStatus }) {
  switch (status) {
    case "ready":
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <Check className="w-3 h-3" />
          Ready
        </Badge>
      );
    case "generating":
      return (
        <Badge variant="info" size="sm" className="gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Generating
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" size="sm" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Error
        </Badge>
      );
  }
}

type ViewMode = "grid" | "list";

// Build version tree structure
interface TreeNode extends LibraryItem {
  children: TreeNode[];
  depth: number;
}

function buildVersionTree(items: LibraryItem[]): TreeNode[] {
  const itemMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // Create tree nodes
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [], depth: 0 });
  });

  // Build tree
  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId)!;
      parent.children.push(node);
      node.depth = parent.depth + 1;
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function traverse(node: TreeNode) {
    result.push(node);
    node.children.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}

// Grid Card Component
function GridCard({
  item,
  onAction,
  showVersionIndicator = false,
}: {
  item: TreeNode;
  onAction: (action: string, item: LibraryItem) => void;
  showVersionIndicator?: boolean;
}) {
  const ModeIcon = modeIcons[item.mode];
  const VersionIcon = versionTypeIcons[item.versionType];

  return (
    <Card variant="interactive" className="overflow-hidden group">
      <div className="relative aspect-square">
        <img
          src={item.thumbnail}
          alt={item.prompt || "Generated content"}
          className="w-full h-full object-cover"
        />

        {/* Generating overlay */}
        {item.status === "generating" && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {item.status === "error" && (
          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Prompt on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-white line-clamp-2">{item.prompt || "No prompt"}</p>
        </div>

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <Badge
              variant="secondary"
              size="sm"
              className="bg-black/60 backdrop-blur-sm border-0"
            >
              <ModeIcon className="w-3 h-3" />
              {item.featureName}
            </Badge>
            {item.depth > 0 && (
              <Badge
                variant="outline"
                size="sm"
                className="bg-black/60 backdrop-blur-sm border-0 gap-1"
              >
                <VersionIcon className="w-3 h-3" />
                {item.versionLabel || item.versionType}
              </Badge>
            )}
          </div>

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
                <ExternalLink className="w-4 h-4 mr-2" /> Open in Canvas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("edit", item)}>
                <Wand2 className="w-4 h-4 mr-2" /> Open in Editor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction("rerun", item)}>
                <RefreshCw className="w-4 h-4 mr-2" /> Re-run
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("remix", item)}>
                <Copy className="w-4 h-4 mr-2" /> Remix
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("variation", item)}>
                <Shuffle className="w-4 h-4 mr-2" /> Variation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("startframe", item)}>
                <Play className="w-4 h-4 mr-2" /> Use as Start Frame
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction("download", item)}>
                <Download className="w-4 h-4 mr-2" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onAction("delete", item)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Version tree indicator */}
        {item.children.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" size="sm" className="bg-black/60 backdrop-blur-sm border-0 gap-1">
              <GitBranch className="w-3 h-3" />
              {item.children.length}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" size="sm">
            {item.model}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            {item.credits}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <StatusIndicator status={item.status} />
          <span className="text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// List Row Component
function ListRow({
  item,
  onAction,
  expanded,
  onToggleExpand,
  hasChildren,
}: {
  item: TreeNode;
  onAction: (action: string, item: LibraryItem) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  hasChildren: boolean;
}) {
  const ModeIcon = modeIcons[item.mode];
  const VersionIcon = versionTypeIcons[item.versionType];

  return (
    <Card
      variant="interactive"
      className={cn(
        "overflow-hidden",
        item.depth > 0 && "ml-6 border-l-2 border-l-primary/30"
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3">
          {/* Expand/Collapse or Depth indicator */}
          <div className="w-6 flex items-center justify-center shrink-0">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={onToggleExpand}
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            ) : item.depth > 0 ? (
              <div className="w-4 h-px bg-primary/30" />
            ) : null}
          </div>

          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
            <img
              src={item.thumbnail}
              alt={item.prompt || "Generated content"}
              className="w-full h-full object-cover"
            />
            {item.status === "generating" && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium truncate">
              {item.prompt || "No prompt"}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" size="sm" className="gap-1">
                <ModeIcon className="w-3 h-3" />
                {item.featureName}
              </Badge>
              <Badge variant="outline" size="sm">
                {item.model}
              </Badge>
              {item.depth > 0 && (
                <Badge variant="info" size="sm" className="gap-1">
                  <VersionIcon className="w-3 h-3" />
                  {item.versionLabel || item.versionType}
                </Badge>
              )}
            </div>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-1 px-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-medium">{item.credits}</span>
          </div>

          {/* Status */}
          <StatusIndicator status={item.status} />

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground w-24 justify-end">
            <Clock className="w-3 h-3" />
            {new Date(item.createdAt).toLocaleDateString()}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onAction("open", item)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in Canvas</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onAction("edit", item)}
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in Editor</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onAction("rerun", item)}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Re-run
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("remix", item)}>
                  <Copy className="w-4 h-4 mr-2" /> Remix
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("variation", item)}>
                  <Shuffle className="w-4 h-4 mr-2" /> Variation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("startframe", item)}>
                  <Play className="w-4 h-4 mr-2" /> Use as Start Frame
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAction("download", item)}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onAction("delete", item)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viewTab, setViewTab] = useState<"all" | "boards">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // State for items from Supabase
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load generations from Supabase
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load generations
      // Note: Must use explicit foreign key syntax: table_name!foreign_key_column(...)
      // because preset_id != presets and model_id != models
      const { data: generations, error: genError } = await supabase
        .from('generations')
        .select(`
          *,
          presets!preset_id(title_ru, title_en, type, key),
          models!model_id(title, provider, key),
          assets(kind, storage_path, storage_bucket)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Load boards
      const { data: boardsData } = await supabase
        .from('boards')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!genError && generations) {
        // Convert generations to LibraryItem format
        const libraryItems: LibraryItem[] = await Promise.all(
          generations.map(async (gen: any) => {
            // Find output asset for thumbnail
            const outputAsset = gen.assets?.find((a: any) => a.kind === 'output');
            let thumbnail = '';
            if (outputAsset) {
              const { data: signedUrl } = await supabase.storage
                .from(outputAsset.storage_bucket)
                .createSignedUrl(outputAsset.storage_path, 3600);
              thumbnail = signedUrl?.signedUrl || '';
            }

            // Map modality to mode
            const modeMap: Record<string, ModeId> = {
              image: 'image',
              video: 'video',
              edit: 'edit',
              audio: 'image',
            };

            // Map status
            const statusMap: Record<string, ItemStatus> = {
              succeeded: 'ready',
              processing: 'generating',
              queued: 'generating',
              failed: 'error',
              cancelled: 'error',
            };

            return {
              id: gen.id,
              thumbnail: thumbnail || '/placeholder.svg',
              mode: modeMap[gen.modality] || 'image',
              featureId: gen.presets?.key || gen.preset_id || '',
              featureName: gen.presets?.title_en || gen.presets?.title_ru || 'Generation',
              model: gen.models?.title || gen.models?.key || 'Unknown',
              prompt: gen.prompt || '',
              credits: Number(gen.final_credits || gen.estimated_credits || 0),
              status: statusMap[gen.status] || 'ready',
              createdAt: gen.created_at,
              versionType: 'generated' as VersionType,
            };
          })
        );

        setItems(libraryItems);
      }

      if (boardsData) {
        setBoards(boardsData);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  // Get unique values for filters
  const models = useMemo(() => [...new Set(items.map((item) => item.model))], [items]);
  const features = useMemo(() => {
    const featureSet = new Set<string>();
    items.forEach((item) => featureSet.add(item.featureName));
    return Array.from(featureSet);
  }, [items]);

  // Build version tree
  const versionTree = useMemo(() => buildVersionTree(items), [items]);

  // Filter items
  const filteredTree = useMemo(() => {
    function filterNode(node: TreeNode): TreeNode | null {
      // Check if this node matches filters
      const matchesSearch = !searchQuery ||
        node.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.featureName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = modeFilter === "all" || node.mode === modeFilter;
      const matchesFeature = featureFilter === "all" || node.featureName === featureFilter;
      const matchesModel = modelFilter === "all" || node.model === modelFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const itemDate = new Date(node.createdAt);
        const now = new Date();
        switch (dateFilter) {
          case "today":
            matchesDate = itemDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = itemDate >= weekAgo;
            break;
          case "month":
            matchesDate = itemDate.getMonth() === now.getMonth() &&
                         itemDate.getFullYear() === now.getFullYear();
            break;
        }
      }

      const nodeMatches = matchesSearch && matchesMode && matchesFeature && matchesModel && matchesDate;

      // Filter children recursively
      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is TreeNode => n !== null);

      // Include node if it matches or has matching children
      if (nodeMatches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    }

    return versionTree
      .map(filterNode)
      .filter((n): n is TreeNode => n !== null);
  }, [versionTree, searchQuery, modeFilter, featureFilter, modelFilter, dateFilter]);

  // Flatten for list view (respecting expansion state)
  const flattenedItems = useMemo(() => {
    const result: TreeNode[] = [];
    function traverse(node: TreeNode) {
      result.push(node);
      if (expandedNodes.has(node.id)) {
        node.children.forEach(traverse);
      }
    }
    filteredTree.forEach(traverse);
    return result;
  }, [filteredTree, expandedNodes]);

  // Total count (root items only for main display)
  const totalCount = filteredTree.length;
  const totalWithVersions = flattenedItems.length;

  const hasFilters = modeFilter !== "all" || featureFilter !== "all" ||
                    modelFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setModeFilter("all");
    setFeatureFilter("all");
    setModelFilter("all");
    setDateFilter("all");
    setSearchQuery("");
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    function collect(node: TreeNode) {
      if (node.children.length > 0) {
        allIds.add(node.id);
        node.children.forEach(collect);
      }
    }
    filteredTree.forEach(collect);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleAction = (action: string, item: LibraryItem) => {
    switch (action) {
      case "open":
        // Navigate to workspace with this item loaded
        navigate("/?load=" + item.id);
        break;
      case "edit":
        navigate("/?load=" + item.id + "&edit=true");
        break;
      case "rerun":
      case "remix":
      case "variation":
      case "startframe":
        navigate("/?action=" + action + "&source=" + item.id);
        break;
      case "download":
        // Would trigger download
        console.log("Download:", item.id);
        break;
      case "delete":
        // Would delete item
        console.log("Delete:", item.id);
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border space-y-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold">{t.library.title}</h1>
              <p className="text-sm text-muted-foreground">
                {viewTab === "all"
                  ? `${totalCount} ${totalCount !== 1 ? t.library.versions : t.library.versions.slice(0, -1)}${totalWithVersions > totalCount ? ` • ${totalWithVersions} ${t.library.versions}` : ""}`
                  : `${boards.length} ${t.boards.title.toLowerCase()}`
                }
              </p>
            </div>

            {/* Tab Toggle: All Items / Boards */}
            <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as "all" | "boards")}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <Image className="w-4 h-4" />
                  {t.common.all}
                </TabsTrigger>
                <TabsTrigger value="boards" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  {t.boards.title}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-3">
            {/* Expand/Collapse for List view */}
            {viewTab === "all" && viewMode === "list" && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  {t.common.viewAll}
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  {t.common.close}
                </Button>
              </div>
            )}

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
          </div>
        </div>

        {/* Filters - only show for All Items tab */}
        {viewTab === "all" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
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
              <SelectValue placeholder={t.modes.image} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.library.allModes}</SelectItem>
              {modes.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  {mode.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={featureFilter} onValueChange={setFeatureFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t.studio.feature} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.library.allFeatures}</SelectItem>
              {features.map((feature) => (
                <SelectItem key={feature} value={feature}>
                  {feature}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t.studio.model} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all} Models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
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
              <X className="w-4 h-4 mr-1" /> {t.common.filter}
            </Button>
          )}
        </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {viewTab === "boards" ? (
            /* Boards Grid View */
            loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">{t.common.loading}</span>
              </div>
            ) : boards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LayoutGrid className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">{t.boards.noBoards}</p>
                <p className="text-sm text-muted-foreground mb-4">{t.boards.createFirstBoard}</p>
              </div>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {boards.map((board) => (
                <Card
                  key={board.id}
                  variant="interactive"
                  className="overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/boards/${board.id}`)}
                >
                  <div className="relative aspect-video">
                    {board.thumbnail ? (
                      <img
                        src={board.thumbnail}
                        alt={board.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <LayoutGrid className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="font-medium text-white truncate">{board.title}</h3>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {board.description || ''}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {board.itemsCount || 0} {t.boards.items}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(board.updated_at || board.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )
          ) : filteredTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                <Image className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">{t.states.noResults}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {t.states.tryDifferentFilters}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  {t.studio.clearPrompt}
                </Button>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">{t.common.loading}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium mb-2">{t.library.noPrompt}</p>
              <p className="text-sm text-muted-foreground mb-4">{t.states.noItems}</p>
              <Button onClick={() => navigate('/studio')}>
                {t.common.generate}
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {flattenTree(filteredTree).map((item) => (
                <GridCard
                  key={item.id}
                  item={item}
                  onAction={handleAction}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-w-5xl">
              {flattenedItems.map((item) => (
                <ListRow
                  key={item.id}
                  item={item}
                  onAction={handleAction}
                  expanded={expandedNodes.has(item.id)}
                  onToggleExpand={() => toggleExpand(item.id)}
                  hasChildren={item.children.length > 0}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
