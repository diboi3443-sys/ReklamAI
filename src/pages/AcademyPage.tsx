import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Play,
  Clock,
  BarChart3,
  Lock,
  Sparkles,
  Crown,
  Star,
  ChevronRight,
  Filter,
  BookOpen,
  Video,
  Palette,
  Megaphone,
  Film,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer, PageHeader, PageContent } from "@/components/ui/page-layout";
import LessonDetailModal from "@/components/academy/LessonDetailModal";
import { useTranslation } from "@/i18n";

// Mock user plan - in real app would come from auth context
export type UserPlan = "free" | "pro" | "max";
export const mockUserPlan: UserPlan = "pro";

// Access types
export type AccessType = "free" | "pro" | "paid" | "max";

// Track data - with translation keys
const getTranslatedTracks = (t: ReturnType<typeof useTranslation>['t']) => [
  { id: "basics", name: t.academy.tracks.basics, icon: Video, lessons: 8, completed: 3, access: "free" as AccessType },
  { id: "prompting", name: t.academy.tracks.prompting, icon: Megaphone, lessons: 12, completed: 5, access: "free" as AccessType },
  { id: "workflows", name: t.academy.tracks.workflows, icon: Palette, lessons: 10, completed: 0, access: "pro" as AccessType },
  { id: "ugc", name: t.academy.tracks.ugc, icon: Sparkles, lessons: 15, completed: 2, access: "pro" as AccessType },
  { id: "cinema", name: t.academy.tracks.cinema, icon: Film, lessons: 20, completed: 0, access: "max" as AccessType },
];

// Lesson data
export interface Lesson {
  id: string;
  titleKey: string;
  descriptionKey: string;
  thumbnail: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  access: AccessType;
  trackKey: string;
  chapterKeys: { titleKey: string; duration: string }[];
  isNew?: boolean;
  price?: number;
}

// Translated lesson interface for display
export interface TranslatedLesson extends Omit<Lesson, 'titleKey' | 'descriptionKey' | 'trackKey' | 'chapterKeys'> {
  title: string;
  description: string;
  track: string;
  chapters: { title: string; duration: string }[];
}

const lessonsData: Lesson[] = [
  {
    id: "1",
    titleKey: "gettingStarted",
    descriptionKey: "gettingStarted",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop",
    duration: "15 min",
    difficulty: "beginner",
    access: "free",
    trackKey: "basics",
    chapterKeys: [
      { titleKey: "introToAiVideo", duration: "3:00" },
      { titleKey: "understandingModels", duration: "4:30" },
      { titleKey: "yourFirstGeneration", duration: "5:00" },
      { titleKey: "bestPractices", duration: "2:30" },
    ],
    isNew: true,
  },
  {
    id: "2",
    titleKey: "masteringPrompts",
    descriptionKey: "masteringPrompts",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop",
    duration: "22 min",
    difficulty: "beginner",
    access: "free",
    trackKey: "basics",
    chapterKeys: [
      { titleKey: "promptStructure", duration: "5:00" },
      { titleKey: "styleKeywords", duration: "6:00" },
      { titleKey: "motionControl", duration: "7:00" },
      { titleKey: "advancedTechniques", duration: "4:00" },
    ],
  },
  {
    id: "3",
    titleKey: "imageToVideo",
    descriptionKey: "imageToVideo",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop",
    duration: "18 min",
    difficulty: "intermediate",
    access: "pro",
    trackKey: "workflows",
    chapterKeys: [
      { titleKey: "preparingImages", duration: "4:00" },
      { titleKey: "motionSettings", duration: "5:00" },
      { titleKey: "cameraControl", duration: "5:00" },
      { titleKey: "exportOptimization", duration: "4:00" },
    ],
    isNew: true,
  },
  {
    id: "4",
    titleKey: "scrollStoppingAds",
    descriptionKey: "scrollStoppingAds",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
    duration: "35 min",
    difficulty: "intermediate",
    access: "pro",
    trackKey: "prompting",
    chapterKeys: [
      { titleKey: "adPsychology", duration: "8:00" },
      { titleKey: "hookFormulas", duration: "10:00" },
      { titleKey: "visualStorytelling", duration: "10:00" },
      { titleKey: "callToAction", duration: "7:00" },
    ],
  },
  {
    id: "5",
    titleKey: "ugcStyle",
    descriptionKey: "ugcStyle",
    thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=225&fit=crop",
    duration: "45 min",
    difficulty: "advanced",
    access: "paid",
    trackKey: "ugc",
    price: 29,
    chapterKeys: [
      { titleKey: "whatMakesUgcWork", duration: "10:00" },
      { titleKey: "scriptTemplates", duration: "12:00" },
      { titleKey: "shootingTechniques", duration: "13:00" },
      { titleKey: "postProduction", duration: "10:00" },
    ],
  },
  {
    id: "6",
    titleKey: "cinematicMasterclass",
    descriptionKey: "cinematicMasterclass",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
    duration: "1h 20min",
    difficulty: "advanced",
    access: "max",
    trackKey: "cinema",
    chapterKeys: [
      { titleKey: "cinematicLanguage", duration: "15:00" },
      { titleKey: "lightingMood", duration: "20:00" },
      { titleKey: "cameraMovements", duration: "20:00" },
      { titleKey: "colorGrading", duration: "15:00" },
      { titleKey: "soundDesign", duration: "10:00" },
    ],
  },
  {
    id: "7",
    titleKey: "multiScene",
    descriptionKey: "multiScene",
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=225&fit=crop",
    duration: "28 min",
    difficulty: "intermediate",
    access: "pro",
    trackKey: "workflows",
    chapterKeys: [
      { titleKey: "storyStructure", duration: "7:00" },
      { titleKey: "sceneTransitions", duration: "8:00" },
      { titleKey: "visualContinuity", duration: "8:00" },
      { titleKey: "finalAssembly", duration: "5:00" },
    ],
  },
  {
    id: "8",
    titleKey: "productDemo",
    descriptionKey: "productDemo",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=225&fit=crop",
    duration: "32 min",
    difficulty: "intermediate",
    access: "paid",
    trackKey: "prompting",
    price: 19,
    chapterKeys: [
      { titleKey: "planningDemo", duration: "6:00" },
      { titleKey: "featureHighlights", duration: "10:00" },
      { titleKey: "motionGraphics", duration: "10:00" },
      { titleKey: "voiceoverIntegration", duration: "6:00" },
    ],
  },
];

// Helper to get translated lesson
export const getTranslatedLesson = (lesson: Lesson, t: ReturnType<typeof useTranslation>['t']): TranslatedLesson => ({
  ...lesson,
  title: t.academy.lessonTitles[lesson.titleKey as keyof typeof t.academy.lessonTitles],
  description: t.academy.lessonDescriptions[lesson.descriptionKey as keyof typeof t.academy.lessonDescriptions],
  track: t.academy.tracks[lesson.trackKey as keyof typeof t.academy.tracks],
  chapters: lesson.chapterKeys.map(ch => ({
    title: t.academy.chapterTitles[ch.titleKey as keyof typeof t.academy.chapterTitles],
    duration: ch.duration,
  })),
});

export { lessonsData };

// Helper to check if user can access lesson
export const canAccess = (lessonAccess: AccessType, userPlan: UserPlan, purchased?: boolean): boolean => {
  if (lessonAccess === "free") return true;
  if (userPlan === "max") return true;
  if (lessonAccess === "pro" && userPlan === "pro") return true;
  if (lessonAccess === "paid" && purchased) return true;
  return false;
};

// Access badge component
export const AccessBadge = ({ access, userPlan }: { access: AccessType; userPlan: UserPlan }) => {
  const { t } = useTranslation();
  const isUnlocked = canAccess(access, userPlan);
  
  const configs: Record<AccessType, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
    free: { label: t.academy.free, variant: "outline", icon: null },
    pro: { label: t.academy.pro, variant: "secondary", icon: <Star className="w-3 h-3" /> },
    paid: { label: t.academy.paid, variant: "default", icon: <Zap className="w-3 h-3" /> },
    max: { label: t.academy.max, variant: "default", icon: <Crown className="w-3 h-3" /> },
  };
  
  const config = configs[access];
  
  if (userPlan === "max" && (access === "pro" || access === "paid" || access === "max")) {
    return (
      <Badge variant="outline" size="sm" className="gap-1 text-primary border-primary/30">
        <Crown className="w-3 h-3" />
        {t.academy.included}
      </Badge>
    );
  }
  
  return (
    <Badge variant={config.variant} size="sm" className="gap-1">
      {!isUnlocked && <Lock className="w-3 h-3" />}
      {config.icon}
      {config.label}
    </Badge>
  );
};

export default function AcademyPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [selectedLesson, setSelectedLesson] = useState<TranslatedLesson | null>(null);

  // Get translated data
  const tracks = getTranslatedTracks(t);
  const lessons = lessonsData.map(lesson => getTranslatedLesson(lesson, t));

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = trackFilter === "all" || lesson.track === trackFilter;
    const matchesAccess = accessFilter === "all" || lesson.access === accessFilter;
    return matchesSearch && matchesTrack && matchesAccess;
  });

  const newLessons = lessons.filter((l) => l.isNew);
  const recommendedLessons = lessons.filter((l) => l.access === "free" || l.access === "pro").slice(0, 3);

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

  return (
    <PageContainer>
      <PageHeader 
        title={t.academy.title} 
        description={t.academy.description}
      >
        <Badge variant="glow" size="lg" className="gap-1.5">
          <BookOpen className="w-4 h-4" />
          {tracks.reduce((acc, tr) => acc + tr.completed, 0)} {t.academy.lessonsCompleted}
        </Badge>
      </PageHeader>

      <PageContent maxWidth="full">
        <div className="space-y-8">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.academy.searchLessons}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-3 h-3 mr-2" />
                  <SelectValue placeholder={t.academy.allTracks} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.academy.allTracks}</SelectItem>
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.name}>{track.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={accessFilter} onValueChange={setAccessFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t.academy.allAccess} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.academy.allAccess}</SelectItem>
                  <SelectItem value="free">{t.academy.free}</SelectItem>
                  <SelectItem value="pro">{t.academy.pro}</SelectItem>
                  <SelectItem value="paid">{t.academy.paid}</SelectItem>
                  <SelectItem value="max">{t.academy.max}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Learning Tracks */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {t.academy.learningTracks}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {tracks.map((track) => {
                const progress = track.lessons > 0 ? (track.completed / track.lessons) * 100 : 0;
                const hasAccess = canAccess(track.access, mockUserPlan);
                
                return (
                  <Card 
                    key={track.id} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${!hasAccess ? 'opacity-75' : ''}`}
                    onClick={() => setTrackFilter(track.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <track.icon className="w-5 h-5 text-primary" />
                        </div>
                        <AccessBadge access={track.access} userPlan={mockUserPlan} />
                      </div>
                      <h3 className="font-medium mb-1 line-clamp-1">{track.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{track.lessons} {t.academy.lessons}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t.academy.progress}</span>
                          <span>{track.completed}/{track.lessons}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* New & Recommended */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Lessons */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t.academy.newLessons}
              </h2>
              <div className="space-y-3">
                {newLessons.map((lesson) => (
                  <Card 
                    key={lesson.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <CardContent className="p-3 flex items-center gap-4">
                      <img 
                        src={lesson.thumbnail} 
                        alt={lesson.title}
                        className="w-20 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{lesson.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </div>
                      </div>
                      <AccessBadge access={lesson.access} userPlan={mockUserPlan} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Recommended */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                {t.academy.recommendedForYou}
              </h2>
              <div className="space-y-3">
                {recommendedLessons.map((lesson) => (
                  <Card 
                    key={lesson.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <CardContent className="p-3 flex items-center gap-4">
                      <img 
                        src={lesson.thumbnail} 
                        alt={lesson.title}
                        className="w-20 h-12 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{lesson.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </div>
                      </div>
                      <AccessBadge access={lesson.access} userPlan={mockUserPlan} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Lessons Library */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {t.academy.allLessons}
              <Badge variant="outline" size="sm">{filteredLessons.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLessons.map((lesson) => {
                const hasAccess = canAccess(lesson.access, mockUserPlan);
                
                return (
                  <Card 
                    key={lesson.id} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${!hasAccess ? 'opacity-75' : ''}`}
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={lesson.thumbnail} 
                        alt={lesson.title}
                        className={`w-full h-full object-cover ${!hasAccess ? 'blur-[2px]' : ''}`}
                      />
                      {!hasAccess && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-white/80" />
                        </div>
                      )}
                      {lesson.isNew && (
                        <Badge variant="glow" className="absolute top-2 left-2">
                          {t.common.new}
                        </Badge>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {lesson.duration}
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm line-clamp-2 flex-1">{lesson.title}</h4>
                        <AccessBadge access={lesson.access} userPlan={mockUserPlan} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className={getDifficultyColor(lesson.difficulty)}>
                          {getDifficultyLabel(lesson.difficulty)}
                        </span>
                        <span>•</span>
                        <span>{lesson.chapters.length} {t.academy.chapters}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredLessons.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t.states.noResults}</p>
                <p className="text-sm text-muted-foreground">{t.states.tryDifferentFilters}</p>
              </div>
            )}
          </section>
        </div>
      </PageContent>

      {/* Lesson Detail Modal */}
      <LessonDetailModal
        lesson={selectedLesson}
        userPlan={mockUserPlan}
        open={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
      />
    </PageContainer>
  );
}