import * as React from "react";
import { Loader2, AlertCircle, RefreshCw, Image as ImageIcon, Video, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/status";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export type CanvasState = "empty" | "generating" | "ready" | "error";

export interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
}

interface LiveCanvasProps {
  state: CanvasState;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  progress?: number;
  progressLabel?: string;
  generationSteps?: GenerationStep[];
  currentStepIndex?: number;
  error?: string;
  aspectRatio?: string;
  onRetry?: () => void;
  className?: string;
}

// Default generation steps (English labels, will be translated in component)
export const defaultGenerationSteps: GenerationStep[] = [
  { id: "credits", label: "Reserving credits", status: "pending" },
  { id: "upload", label: "Uploading media", status: "pending" },
  { id: "task", label: "Creating task", status: "pending" },
  { id: "generate", label: "Generating", status: "pending" },
  { id: "finalize", label: "Finalizing", status: "pending" },
];

export function LiveCanvas({
  state,
  mediaUrl,
  mediaType = "image",
  progress = 0,
  progressLabel,
  generationSteps = defaultGenerationSteps,
  currentStepIndex = 0,
  error,
  aspectRatio = "16:9",
  onRetry,
  className,
}: LiveCanvasProps) {
  const { t } = useTranslation();

  // Calculate aspect ratio class
  const aspectClass = {
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16]",
    "4:3": "aspect-[4/3]",
    "3:4": "aspect-[3/4]",
    "21:9": "aspect-[21/9]",
  }[aspectRatio] || "aspect-video";

  return (
    <div
      className={cn(
        "relative w-full bg-surface-sunken rounded-xl overflow-hidden border border-border",
        aspectClass,
        className
      )}
    >
      {/* Background image blur effect during generation */}
      {state === "generating" && mediaUrl && (
        <img
          src={mediaUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110"
        />
      )}

      {/* Empty State */}
      {state === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 opacity-40" />
          </div>
          <p className="text-base font-medium">{t.studio.startCreating}</p>
          <p className="text-sm mt-1 opacity-70 text-center max-w-xs">
            {t.studio.chooseFeature}
          </p>
        </div>
      )}

      {/* Generating State - Enhanced with step-based progress */}
      {state === "generating" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
          {/* Animated loader */}
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-2xl gradient-brand opacity-20 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-background/80 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          </div>

          {/* Step-based progress */}
          <div className="w-72 space-y-3">
            {generationSteps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 transition-all duration-300",
                    isPending && "opacity-40"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isComplete && "bg-primary text-primary-foreground",
                      isActive && "bg-primary/20 border-2 border-primary",
                      isPending && "bg-secondary border border-border"
                    )}
                  >
                    {isComplete && <Check className="w-3 h-3" />}
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      isActive && "text-foreground font-medium",
                      isComplete && "text-muted-foreground",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <Loader2 className="w-3 h-3 text-primary animate-spin ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall progress bar */}
          <div className="w-72 mt-6">
            <ProgressBar value={progress} variant="gradient" size="sm" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
      )}

      {/* Ready State */}
      {state === "ready" && mediaUrl && (
        <>
          {mediaType === "image" ? (
            <img
              src={mediaUrl}
              alt="Generated content"
              className="absolute inset-0 w-full h-full object-contain animate-fade-in"
            />
          ) : (
            <video
              src={mediaUrl}
              className="absolute inset-0 w-full h-full object-contain"
              controls
              autoPlay
              loop
              muted
            />
          )}
        </>
      )}

      {/* Error State */}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <p className="text-base font-medium text-destructive">{t.common.error}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
            {error || t.states.somethingWentWrong}
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              <RefreshCw className="w-4 h-4" />
              {t.states.tryAgain}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
