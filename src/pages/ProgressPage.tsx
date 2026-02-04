import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
  X,
  Image,
  Video,
  Mic,
  Type,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/status";
import { cn } from "@/lib/utils";
import { getStatus } from "@/lib/edge";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/i18n";

// Define generation steps
const generationSteps = [
  { id: "queue", label: "Queued", description: "Waiting in queue" },
  { id: "process", label: "Processing", description: "Analyzing your prompt" },
  { id: "generate", label: "Generating", description: "Creating your content" },
  { id: "enhance", label: "Enhancing", description: "Applying final touches" },
  { id: "complete", label: "Complete", description: "Ready to view" },
];

// Mock active generations for demo
const mockGenerations = [
  {
    id: "gen-1",
    preset: { id: "image-gen", name: "Image Generation", icon: Image },
    prompt: "A serene mountain landscape at sunset with dramatic clouds",
    model: "FLUX.1",
    startTime: Date.now() - 45000,
    currentStep: 2,
    progress: 65,
  },
  {
    id: "gen-2",
    preset: { id: "video-gen", name: "Video Generation", icon: Video },
    prompt: "A slow motion shot of coffee being poured into a cup",
    model: "Runway Gen-3",
    startTime: Date.now() - 120000,
    currentStep: 3,
    progress: 85,
  },
];

function GenerationCard({ generation }: { generation: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(generation.progress || 0);
  const [currentStep, setCurrentStep] = useState(0);

  // Map status to step
  useEffect(() => {
    const statusToStep: Record<string, number> = {
      queued: 0,
      processing: 2,
      succeeded: 4,
      failed: 4,
    };
    setCurrentStep(statusToStep[generation.status] || 0);
    if (generation.progress !== undefined) {
      setProgress(generation.progress);
    } else {
      // Estimate progress from status
      if (generation.status === 'queued') setProgress(10);
      else if (generation.status === 'processing') setProgress(50);
      else if (generation.status === 'succeeded') setProgress(100);
    }
  }, [generation.status, generation.progress]);

  const isComplete = generation.status === 'succeeded';
  const isFailed = generation.status === 'failed';

  // Get preset icon
  const presetType = generation.presets?.type || 'image';
  const PresetIcon = presetType === 'video' ? Video : presetType === 'edit' ? Type : Image;

  // Get preset name
  const presetTitle = generation.presets?.title_en || generation.presets?.title_ru || 'Generation';
  const modelTitle = generation.models?.title || generation.models?.key || 'Unknown Model';

  const formatTime = (ms: number) => {
    if (ms < 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  // Handle click to view result
  const handleViewResult = () => {
    if (generation.signedPreviewUrl) {
      navigate(`/result/${generation.id}`, {
        state: { url: generation.signedPreviewUrl, generation },
      });
    }
  };

  return (
    <Card variant={isComplete ? "glow" : "default"} className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isComplete ? "gradient-brand shadow-glow-sm" : "bg-secondary"
              )}
            >
              <PresetIcon
                className={cn(
                  "w-5 h-5",
                  isComplete ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <p className="font-medium text-sm">{presetTitle}</p>
              <p className="text-xs text-muted-foreground">{modelTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isComplete ? "success" : isFailed ? "destructive" : "secondary"} size="sm">
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> {t.common.ready}
                </>
              ) : isFailed ? (
                <>
                  <AlertCircle className="w-3 h-3" /> {t.common.error}
                </>
              ) : (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> {t.common.generating}
                </>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(Date.now() - new Date(generation.created_at).getTime())}
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div className="p-4 border-b border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground line-clamp-2">
            "{generation.prompt || t.studio.promptPlaceholder}"
          </p>
        </div>

        {/* Progress Steps */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            {generationSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isActive && "text-primary",
                      isCompleted && "text-success",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                    )}
                    <span className="text-xs font-medium hidden md:inline">
                      {step.label}
                    </span>
                  </div>
                  {index < generationSteps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 rounded-full",
                        isCompleted ? "bg-success" : "bg-border"
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <ProgressBar
            value={Math.min(progress, 100)}
            variant={isComplete ? "glow" : "gradient"}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {generationSteps[currentStep]?.description || t.common.generating}
            </p>
            {isComplete && generation.signedPreviewUrl && (
              <Button
                variant="glow"
                size="sm"
                onClick={handleViewResult}
              >
                {t.common.open} <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            {isFailed && (
              <Badge variant="destructive" size="sm">
                {generation.error?.message || t.common.error}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProgressPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load generations from Supabase
  useEffect(() => {
    async function loadGenerations() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('generations')
        .select(`
          *,
          presets!preset_id(title_ru, title_en, type),
          models!model_id(title, provider, key)
        `)
        .eq('owner_id', user.id)
        .in('status', ['queued', 'processing'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGenerations(data);
      }
      setLoading(false);
    }

    loadGenerations();

    // Poll for status updates every 2 seconds
    // IMPORTANT: Use setGenerations callback to always get latest state
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Reload active generations periodically to catch new ones
      const { data: activeGens } = await supabase
        .from('generations')
        .select('id, status')
        .eq('owner_id', user.id)
        .in('status', ['queued', 'processing']);

      if (!activeGens || activeGens.length === 0) return;

      // Poll each active generation
      for (const gen of activeGens) {
        try {
          console.log(`[ProgressPage] Polling status for generation: ${gen.id}`);
          const status = await getStatus(gen.id);

          // Update generation status in state
          setGenerations((prev) =>
            prev.map((g) =>
              g.id === gen.id
                ? { ...g, status: status.status, progress: status.progress, signedPreviewUrl: status.signedPreviewUrl }
                : g
            )
          );

          // If succeeded, navigate to result
          if (status.status === 'succeeded' && status.signedPreviewUrl) {
            navigate(`/result/${gen.id}`, { state: { url: status.signedPreviewUrl } });
          }
        } catch (error) {
          console.error(`[ProgressPage] Error polling status for ${gen.id}:`, error);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Handle new generation from Create page
  useEffect(() => {
    if (location.state?.generationId) {
      // Load the new generation
      async function loadGeneration() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('generations')
          .select(`
            *,
            presets!preset_id(title_ru, title_en, type),
            models!model_id(title, provider, key)
          `)
          .eq('id', location.state.generationId)
          .eq('owner_id', user.id)
          .single();

        if (!error && data) {
          setGenerations((prev) => [data, ...prev.filter((g) => g.id !== data.id)]);
        }
      }
      loadGeneration();
    }
  }, [location.state]);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t.history.currentGeneration}</h1>
          <p className="text-sm text-muted-foreground">
            {generations.length} {t.history.recentGenerations}
          </p>
        </div>
        <Link to="/studio">
          <Button variant="outline" size="sm">
            {t.common.generate}
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {generations.length === 0 ? (
            <Card variant="ghost" className="text-center py-12">
              <CardContent>
                <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{t.history.noHistory}</p>
                <Link to="/studio">
                  <Button variant="glow" className="mt-4">
                    {t.common.generate}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card variant="ghost" className="text-center py-12">
              <CardContent>
                <Loader2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4 animate-spin" />
                <p className="text-muted-foreground">{t.common.loading}</p>
              </CardContent>
            </Card>
          ) : (
            generations.map((gen) => (
              <GenerationCard key={gen.id} generation={gen} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
