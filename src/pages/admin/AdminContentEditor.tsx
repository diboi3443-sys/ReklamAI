import * as React from "react";
import { useState } from "react";
import {
  Home,
  GraduationCap,
  Bell,
  Megaphone,
  ChevronRight,
  Eye,
  Edit3,
  Save,
  RotateCcw,
  Clock,
  User,
  AlertCircle,
  Check,
  Sparkles,
  Image,
  FileText,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Section editors
import NewsEditor from "@/components/admin/cms/NewsEditor";
import FeaturedMediaEditor from "@/components/admin/cms/FeaturedMediaEditor";
import TextBlockEditor from "@/components/admin/cms/TextBlockEditor";
import BannerEditor from "@/components/admin/cms/BannerEditor";
import HomePreview from "@/components/admin/cms/HomePreview";

// Content sections structure
interface ContentSection {
  id: string;
  label: string;
  type: "news" | "featured" | "text" | "banner" | "actions";
  parent?: string;
  status: "published" | "draft";
  lastEdited: string;
  editedBy: string;
}

const contentSections: ContentSection[] = [
  // Home Page sections
  { id: "home-hero", label: "Hero / Welcome Block", type: "text", parent: "home", status: "published", lastEdited: "2024-01-09T14:30:00", editedBy: "Admin" },
  { id: "home-actions", label: "Quick Actions", type: "actions", parent: "home", status: "published", lastEdited: "2024-01-08T10:00:00", editedBy: "Admin" },
  { id: "home-news", label: "News & Updates", type: "news", parent: "home", status: "published", lastEdited: "2024-01-09T12:00:00", editedBy: "Admin" },
  { id: "home-featured", label: "Featured Creations", type: "featured", parent: "home", status: "draft", lastEdited: "2024-01-09T16:45:00", editedBy: "Admin" },
  { id: "home-presets", label: "Presets Highlights", type: "featured", parent: "home", status: "published", lastEdited: "2024-01-07T09:30:00", editedBy: "Admin" },
  // Academy sections
  { id: "academy-tracks", label: "Featured Tracks", type: "featured", parent: "academy", status: "published", lastEdited: "2024-01-06T11:00:00", editedBy: "Admin" },
  { id: "academy-lessons", label: "Highlighted Lessons", type: "featured", parent: "academy", status: "published", lastEdited: "2024-01-05T15:00:00", editedBy: "Admin" },
  // Global
  { id: "global-banners", label: "Global Banners", type: "banner", parent: "global", status: "draft", lastEdited: "2024-01-09T08:00:00", editedBy: "Admin" },
  { id: "global-announcements", label: "Announcements", type: "banner", parent: "global", status: "published", lastEdited: "2024-01-04T14:00:00", editedBy: "Admin" },
];

const parentGroups = [
  { id: "home", label: "Home Page", icon: Home },
  { id: "academy", label: "Academy", icon: GraduationCap },
  { id: "global", label: "Global", icon: Bell },
];

export default function AdminContentEditor() {
  const [selectedSection, setSelectedSection] = useState<string>("home-hero");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["home", "academy", "global"]);

  const currentSection = contentSections.find((s) => s.id === selectedSection);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    // Mock save
  };

  const handlePublish = () => {
    setHasUnsavedChanges(false);
    // Mock publish
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "news": return Bell;
      case "featured": return Image;
      case "text": return FileText;
      case "banner": return Megaphone;
      case "actions": return Layout;
      default: return FileText;
    }
  };

  const renderEditor = () => {
    if (!currentSection) return null;

    switch (currentSection.type) {
      case "news":
        return <NewsEditor sectionId={currentSection.id} onChangesMade={() => setHasUnsavedChanges(true)} />;
      case "featured":
        return <FeaturedMediaEditor sectionId={currentSection.id} onChangesMade={() => setHasUnsavedChanges(true)} />;
      case "text":
      case "actions":
        return <TextBlockEditor sectionId={currentSection.id} onChangesMade={() => setHasUnsavedChanges(true)} />;
      case "banner":
        return <BannerEditor sectionId={currentSection.id} onChangesMade={() => setHasUnsavedChanges(true)} />;
      default:
        return <div className="p-6 text-muted-foreground">Select a section to edit</div>;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Content Sections */}
      <div className="w-72 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Content Sections</h2>
          <p className="text-xs text-muted-foreground mt-1">Select a section to edit</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {parentGroups.map((group) => {
              const Icon = group.icon;
              const isExpanded = expandedGroups.includes(group.id);
              const groupSections = contentSections.filter((s) => s.parent === group.id);

              return (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{group.label}</span>
                    <Badge variant="outline" size="sm" className="ml-auto">
                      {groupSections.length}
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {groupSections.map((section) => {
                        const TypeIcon = getTypeIcon(section.type);
                        const isSelected = selectedSection === section.id;

                        return (
                          <button
                            key={section.id}
                            onClick={() => setSelectedSection(section.id)}
                            className={cn(
                              "flex items-center gap-2 w-full p-2 rounded-lg text-left text-sm transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-secondary/50 text-muted-foreground"
                            )}
                          >
                            <TypeIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate flex-1">{section.label}</span>
                            {section.status === "draft" && (
                              <Badge variant="outline" size="sm" className="text-warning border-warning/30">
                                Draft
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Version Info */}
        <div className="p-3 border-t border-border">
          <div className="p-3 rounded-lg bg-secondary/30 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Last edited:</span>
              <span>
                {currentSection && new Date(currentSection.lastEdited).toLocaleString([], { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">By:</span>
              <span>{currentSection?.editedBy}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Editor Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-14 border-b border-border px-4 flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">{currentSection?.label || "Select Section"}</h3>
            {currentSection && (
              <Badge 
                variant={currentSection.status === "published" ? "default" : "outline"}
                className={currentSection.status === "draft" ? "text-warning border-warning/30" : ""}
              >
                {currentSection.status}
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="destructive" size="sm" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Unsaved
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Preview Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="preview-mode" className="text-sm text-muted-foreground">
                {isPreviewMode ? "Preview" : "Edit"}
              </Label>
              <Switch
                id="preview-mode"
                checked={isPreviewMode}
                onCheckedChange={setIsPreviewMode}
              />
              {isPreviewMode ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="sm" disabled={!hasUnsavedChanges}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Discard
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges}>
              <Save className="w-4 h-4 mr-1" />
              Save Draft
            </Button>
            <Button size="sm" className="gradient-brand" onClick={handlePublish}>
              <Check className="w-4 h-4 mr-1" />
              Publish
            </Button>
          </div>
        </div>

        {/* Editor / Preview Area */}
        <div className="flex-1 overflow-hidden">
          {isPreviewMode ? (
            <HomePreview highlightSection={selectedSection} />
          ) : (
            <ScrollArea className="h-full">
              {renderEditor()}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
