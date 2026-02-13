import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Shuffle,
  Copy,
  Play,
  Download,
  Share2,
  Image,
  Hash,
  Calendar,
  Cpu,
  Zap,
  MoreHorizontal,
  Maximize2,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Canvas } from "@/components/ui/canvas";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { generationsApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { getStatus } from "@/lib/edge";

export default function ResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Load generation data from API
  useEffect(() => {
    async function loadResult() {
      if (!id) { setLoading(false); return; }
      if (!user) { navigate("/"); return; }

      try {
        const generation = await generationsApi.get(id);

        // Get result URL — prefer location state, then generation data, then poll
        let signedUrl = location.state?.url || generation.result_url;
        if (!signedUrl) {
          try {
            const status = await getStatus(id);
            signedUrl = status.signedPreviewUrl;
          } catch (statusError) {
            console.error("Error getting status:", statusError);
          }
        }

        setResult({
          id: generation.id,
          preset: generation.preset_slug || "Generation",
          model: generation.model_slug || "Unknown",
          prompt: generation.prompt || "",
          seed: generation.input?.params?.seed || null,
          aspectRatio: generation.input?.params?.aspect_ratio || "16:9",
          credits: generation.final_credits || generation.estimated_credits || 0,
          createdAt: generation.created_at,
          status: generation.status,
        });
        setImageUrl(signedUrl || "");
      } catch (error) {
        console.error("Error loading result:", error);
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [id, location.state, navigate, user]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Generation not found</p>
          <Link to="/library">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/library">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Result</h1>
            <p className="text-xs text-muted-foreground">{result.preset}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Open in new tab</DropdownMenuItem>
              <DropdownMenuItem>Copy image URL</DropdownMenuItem>
              <DropdownMenuItem>Report issue</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 p-6 flex items-center justify-center bg-surface-sunken overflow-auto">
          <div className="relative group max-w-full max-h-full">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Generated result"
                className="max-w-full max-h-[calc(100vh-200px)] rounded-xl shadow-elevated object-contain"
                onError={(e) => {
                  console.error("Failed to load image:", imageUrl);
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Image className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {result.status === "succeeded"
                    ? "Image not available. Check if file was saved to storage."
                    : `Status: ${result.status}`}
                </p>
              </div>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border flex flex-col overflow-hidden bg-card">
          {/* Actions */}
          <div className="p-4 border-b border-border space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start">
                <RefreshCw className="w-4 h-4" />
                Re-run
              </Button>
              <Button variant="outline" className="justify-start">
                <Shuffle className="w-4 h-4" />
                Variation
              </Button>
              <Button variant="outline" className="justify-start">
                <Copy className="w-4 h-4" />
                Remix
              </Button>
              <Button variant="outline" className="justify-start">
                <Play className="w-4 h-4" />
                Start Frame
              </Button>
            </div>
          </div>

          {/* Prompt */}
          <div className="p-4 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Prompt
              </h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(result.prompt)}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy prompt</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {result.prompt}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex-1 p-4 overflow-auto space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Metadata
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm">Model</span>
                </div>
                <Badge variant="secondary" size="sm">
                  {result.model}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Image className="w-4 h-4" />
                  <span className="text-sm">Dimensions</span>
                </div>
                <span className="text-sm">{result.dimensions}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">Seed</span>
                </div>
                <span className="text-sm font-mono">{result.seed || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">Credits Used</span>
                </div>
                <span className="text-sm">{result.credits}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Created</span>
                </div>
                <span className="text-sm">
                  {new Date(result.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
