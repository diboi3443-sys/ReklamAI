import * as React from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Clock,
  BarChart3,
  Lock,
  Crown,
  Star,
  Download,
  MessageSquare,
  ChevronRight,
  Zap,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TranslatedLesson, UserPlan, AccessType, canAccess, AccessBadge } from "@/pages/AcademyPage";
import { useTranslation } from "@/i18n";

interface LessonDetailModalProps {
  lesson: TranslatedLesson | null;
  userPlan: UserPlan;
  open: boolean;
  onClose: () => void;
}

export default function LessonDetailModal({ lesson, userPlan, open, onClose }: LessonDetailModalProps) {
  const { t } = useTranslation();
  
  if (!lesson) return null;

  const hasAccess = canAccess(lesson.access, userPlan);
  const isMaxUser = userPlan === "max";

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return t.academy.beginner;
      case "intermediate": return t.academy.intermediate;
      case "advanced": return t.academy.advanced;
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-success";
      case "intermediate": return "text-warning";
      case "advanced": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getCtaButton = () => {
    if (hasAccess) {
      return (
        <Button className="w-full gradient-brand" size="lg">
          <Play className="w-5 h-5 mr-2" />
          {t.academy.startLearning}
        </Button>
      );
    }

    if (lesson.access === "pro") {
      return (
        <Link to="/pricing" className="block">
          <Button className="w-full" size="lg">
            <Star className="w-5 h-5 mr-2" />
            Unlock with Pro
          </Button>
        </Link>
      );
    }

    if (lesson.access === "paid" && lesson.price) {
      return (
        <Button className="w-full gradient-brand" size="lg">
          <Zap className="w-5 h-5 mr-2" />
          {t.pricing.buyNow} ${lesson.price}
        </Button>
      );
    }

    if (lesson.access === "max") {
      return (
        <Link to="/pricing" className="block">
          <Button className="w-full" size="lg">
            <Crown className="w-5 h-5 mr-2" />
            {t.pricing.upgrade} to Max
          </Button>
        </Link>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="relative">
            {/* Video/Content Area */}
            <div className="relative aspect-video bg-black">
              <img
                src={lesson.thumbnail}
                alt={lesson.title}
                className={`w-full h-full object-cover ${!hasAccess ? 'blur-md' : ''}`}
              />
              
              {hasAccess ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" className="gradient-brand rounded-full w-16 h-16">
                    <Play className="w-7 h-7" />
                  </Button>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center p-6 max-w-md">
                    <div className="w-16 h-16 rounded-full bg-secondary/80 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t.academy.locked}</h3>
                    <p className="text-white/70 mb-4">
                      {lesson.access === "pro" && `This lesson requires a Pro subscription`}
                      {lesson.access === "paid" && `${t.academy.purchaseLesson} $${lesson.price}`}
                      {lesson.access === "max" && `This lesson is included with Max subscription`}
                    </p>
                  </div>
                </div>
              )}

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" size="sm">{lesson.track}</Badge>
                      <AccessBadge access={lesson.access} userPlan={userPlan} />
                    </div>
                    <h1 className="text-2xl font-bold">{lesson.title}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration}
                  </span>
                  <span className={`flex items-center gap-1 capitalize ${getDifficultyColor(lesson.difficulty)}`}>
                    <BarChart3 className="w-4 h-4" />
                    {getDifficultyLabel(lesson.difficulty)}
                  </span>
                  <span className="flex items-center gap-1">
                    {lesson.chapters.length} {t.academy.chapters}
                  </span>
                </div>

                <p className="text-muted-foreground">{lesson.description}</p>
              </div>

              {/* Access Panel (if locked) */}
              {!hasAccess && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.account.currentPlan}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">{userPlan}</Badge>
                      </div>
                    </div>
                    {lesson.access === "paid" && lesson.price && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">One-time purchase</p>
                        <p className="text-2xl font-bold gradient-text">${lesson.price}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {getCtaButton()}
                    
                    {lesson.access !== "max" && (
                      <Link to="/pricing" className="block">
                        <Button variant="outline" className="w-full">
                          <Crown className="w-4 h-4 mr-2" />
                          {t.pricing.upgrade} to Max - Unlock All
                        </Button>
                      </Link>
                    )}
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Max subscribers get access to all lessons including paid content
                  </p>
                </div>
              )}

              {/* CTA for unlocked */}
              {hasAccess && (
                <div className="flex gap-3">
                  {getCtaButton()}
                  <Button variant="outline" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Resources
                  </Button>
                </div>
              )}

              {isMaxUser && lesson.access !== "free" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="text-sm">
                    <strong>Unlocked by Max</strong> - You have access to all Academy content
                  </span>
                </div>
              )}

              <Separator />

              {/* Chapters */}
              <div className="space-y-3">
                <h2 className="font-semibold">{t.academy.chapters}</h2>
                <div className="space-y-2">
                  {lesson.chapters.map((chapter, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        hasAccess
                          ? 'hover:bg-secondary/50 cursor-pointer'
                          : 'opacity-60'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium shrink-0">
                        {hasAccess ? index + 1 : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{chapter.title}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{chapter.duration}</span>
                      {hasAccess && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Resources & Q&A Placeholders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-dashed border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Downloads & Resources</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasAccess
                      ? "Project files, templates, and additional resources"
                      : t.academy.upgradeToUnlock}
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-dashed border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Comments & Q&A</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ask questions and discuss with the community
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}