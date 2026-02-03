import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Image,
  Video,
  Mic,
  Type,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  Clapperboard,
  ShoppingBag,
  Users,
  Film,
  Zap,
  LayoutGrid,
  FolderOpen,
  Check,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockBoards } from "@/lib/boards";
import { useTranslation } from "@/i18n";

// Goal types
const goals = [
  { id: "ads", icon: Target, color: "from-orange-500 to-red-500" },
  { id: "ugc", icon: Users, color: "from-pink-500 to-rose-500" },
  { id: "cinematic", icon: Clapperboard, color: "from-purple-500 to-indigo-500" },
  { id: "product", icon: ShoppingBag, color: "from-blue-500 to-cyan-500" },
  { id: "character", icon: Film, color: "from-emerald-500 to-teal-500" },
];

// Featured presets based on goal
const presetsByGoal: Record<string, Array<{ id: string; icon: React.ElementType; credits: number }>> = {
  ads: [
    { id: "image-gen", icon: Image, credits: 1 },
    { id: "video-gen", icon: Video, credits: 5 },
    { id: "text-gen", icon: Type, credits: 0.5 },
  ],
  ugc: [
    { id: "video-gen", icon: Video, credits: 5 },
    { id: "voice-gen", icon: Mic, credits: 2 },
    { id: "image-gen", icon: Image, credits: 1 },
  ],
  cinematic: [
    { id: "video-gen", icon: Video, credits: 5 },
    { id: "image-gen", icon: Image, credits: 1 },
  ],
  product: [
    { id: "image-gen", icon: Image, credits: 1 },
    { id: "video-gen", icon: Video, credits: 5 },
  ],
  character: [
    { id: "image-gen", icon: Image, credits: 1 },
    { id: "video-gen", icon: Video, credits: 5 },
  ],
};

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  goal: string;
  preset: string;
  prompt: string;
  boardId: string | null;
}

export function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [createNewBoard, setCreateNewBoard] = useState(false);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const getGoalName = (goalId: string) => {
    const key = goalId as keyof typeof t.onboarding.goals;
    return t.onboarding.goals[key] || goalId;
  };

  const getPresetName = (presetId: string) => {
    switch (presetId) {
      case "image-gen": return t.pricing.imageGen;
      case "video-gen": return t.pricing.videoGen;
      case "voice-gen": return "Voice Gen";
      case "text-gen": return "Text Gen";
      default: return presetId;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    navigate("/");
  };

  const handleComplete = () => {
    const data: OnboardingData = {
      goal: selectedGoal || "ads",
      preset: selectedPreset || "image-gen",
      prompt,
      boardId: selectedBoard,
    };
    onComplete(data);
    onOpenChange(false);
    
    // Navigate to studio with context
    const params = new URLSearchParams();
    if (selectedBoard) params.set("board", selectedBoard);
    if (selectedPreset) params.set("preset", selectedPreset);
    navigate(`/studio?${params.toString()}`);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedGoal;
      case 2: return !!selectedPreset;
      case 3: return prompt.trim().length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const featuredPresets = selectedGoal ? presetsByGoal[selectedGoal] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-2xl p-0 gap-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-glow-sm">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t.onboarding.welcome}</h2>
                <p className="text-sm text-muted-foreground">{t.onboarding.letsGetStarted}</p>
              </div>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t.onboarding.step} {step} {t.onboarding.of} {totalSteps}</span>
              <button onClick={handleSkip} className="hover:text-foreground transition-colors">
                {t.onboarding.skip}
              </button>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[360px]">
          {/* Step 1: Choose Goal */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{t.onboarding.whatAreYouCreating}</h3>
                <p className="text-sm text-muted-foreground">{t.onboarding.selectGoalDescription}</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {goals.map((goal) => (
                  <Card
                    key={goal.id}
                    variant={selectedGoal === goal.id ? "glow" : "interactive"}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedGoal === goal.id && "ring-1 ring-primary"
                    )}
                    onClick={() => setSelectedGoal(goal.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all",
                          selectedGoal === goal.id
                            ? `bg-gradient-to-br ${goal.color} shadow-lg`
                            : "bg-secondary"
                        )}
                      >
                        <goal.icon
                          className={cn(
                            "w-6 h-6",
                            selectedGoal === goal.id ? "text-white" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <span className="font-medium text-sm">{getGoalName(goal.id)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Preset */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{t.onboarding.chooseCreationType}</h3>
                <p className="text-sm text-muted-foreground">{t.onboarding.selectPresetDescription}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredPresets.map((preset) => (
                  <Card
                    key={preset.id}
                    variant={selectedPreset === preset.id ? "glow" : "interactive"}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedPreset === preset.id && "ring-1 ring-primary"
                    )}
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    <CardContent className="p-5 text-center">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all",
                          selectedPreset === preset.id
                            ? "gradient-brand shadow-glow-sm"
                            : "bg-secondary"
                        )}
                      >
                        <preset.icon
                          className={cn(
                            "w-7 h-7",
                            selectedPreset === preset.id
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <h4 className="font-medium mb-1">{getPresetName(preset.id)}</h4>
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        {preset.credits} {t.common.credit}{preset.credits !== 1 ? "s" : ""}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Provide Input */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{t.onboarding.describeYourIdea}</h3>
                <p className="text-sm text-muted-foreground">{t.onboarding.promptDescription}</p>
              </div>
              
              <div className="space-y-4">
                <Textarea
                  variant="glow"
                  textareaSize="lg"
                  placeholder={t.onboarding.promptPlaceholder}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[140px]"
                />
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.onboarding.tipBeSpecific}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Credits Explanation */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{t.onboarding.readyToCreate}</h3>
                <p className="text-sm text-muted-foreground">{t.onboarding.creditsExplanation}</p>
              </div>
              
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{t.onboarding.yourCredits}</h4>
                      <p className="text-sm text-muted-foreground">{t.onboarding.creditsInfo}</p>
                    </div>
                    <Badge variant="glow" size="lg" className="text-lg px-4">
                      247
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{getPresetName(selectedPreset || "")}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">"{prompt}"</p>
                  </div>
                  <Badge variant="outline">
                    <Zap className="w-3 h-3 mr-1" />
                    {featuredPresets.find(p => p.id === selectedPreset)?.credits || 1} {t.common.credit}s
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Save to Board */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{t.onboarding.organizeYourWork}</h3>
                <p className="text-sm text-muted-foreground">{t.onboarding.boardDescription}</p>
              </div>
              
              <div className="space-y-3">
                {/* No board option */}
                <Card
                  variant={!selectedBoard && !createNewBoard ? "glow" : "interactive"}
                  className={cn(
                    "cursor-pointer transition-all",
                    !selectedBoard && !createNewBoard && "ring-1 ring-primary"
                  )}
                  onClick={() => {
                    setSelectedBoard(null);
                    setCreateNewBoard(false);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      !selectedBoard && !createNewBoard ? "gradient-brand" : "bg-secondary"
                    )}>
                      <FolderOpen className={cn(
                        "w-5 h-5",
                        !selectedBoard && !createNewBoard ? "text-primary-foreground" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t.onboarding.skipForNow}</p>
                      <p className="text-sm text-muted-foreground">{t.onboarding.saveToLibrary}</p>
                    </div>
                    {!selectedBoard && !createNewBoard && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </CardContent>
                </Card>

                {/* Existing boards */}
                {mockBoards.slice(0, 3).map((board) => (
                  <Card
                    key={board.id}
                    variant={selectedBoard === board.id ? "glow" : "interactive"}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedBoard === board.id && "ring-1 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedBoard(board.id);
                      setCreateNewBoard(false);
                    }}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        selectedBoard === board.id ? "gradient-brand" : "bg-secondary"
                      )}>
                        <LayoutGrid className={cn(
                          "w-5 h-5",
                          selectedBoard === board.id ? "text-primary-foreground" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{board.name}</p>
                        <p className="text-sm text-muted-foreground">{board.itemsCount} {t.boards.items}</p>
                      </div>
                      {selectedBoard === board.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-secondary/30">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Button>
          
          {step < totalSteps ? (
            <Button
              variant="glow"
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              {t.common.next}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="glow"
              onClick={handleComplete}
              className="gap-2"
            >
              <Rocket className="w-4 h-4" />
              {t.onboarding.startCreating}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
