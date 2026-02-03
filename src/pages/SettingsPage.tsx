import * as React from "react";
import { useState } from "react";
import {
  Globe,
  Palette,
  Clock,
  Home,
  Layers,
  Wand2,
  Video,
  Sparkles,
  Save,
  SlidersHorizontal,
  RatioIcon,
  History,
  Bell,
  Mail,
  Zap,
  Megaphone,
  GraduationCap,
  Eye,
  Shield,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageContainer, PageHeader, PageContent } from "@/components/ui/page-layout";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, useLanguage } from "@/i18n";
import { useTheme } from "@/components/theme";

// Mock data for selectors
const mockBoards = [
  { id: "none", name: "None" },
  { id: "board-1", name: "Summer Campaign" },
  { id: "board-2", name: "Product Shots" },
  { id: "board-3", name: "Social Media" },
];

const imageModels = [
  { id: "flux-pro", name: "FLUX Pro" },
  { id: "flux-dev", name: "FLUX Dev" },
  { id: "sdxl", name: "SDXL" },
  { id: "midjourney", name: "Midjourney Style" },
];

const videoModels = [
  { id: "runway-gen3", name: "Runway Gen-3" },
  { id: "kling", name: "Kling" },
  { id: "pika", name: "Pika" },
];

const qualityTiers = [
  { id: "standard", name: "Standard" },
  { id: "high", name: "High" },
  { id: "ultra", name: "Ultra" },
];

const aspectRatios = [
  { id: "1:1", name: "1:1 (Square)" },
  { id: "16:9", name: "16:9 (Landscape)" },
  { id: "9:16", name: "9:16 (Portrait)" },
  { id: "4:3", name: "4:3" },
  { id: "3:4", name: "3:4" },
];

const timezones = [
  { id: "UTC", name: "UTC" },
  { id: "America/New_York", name: "Eastern Time (ET)" },
  { id: "America/Los_Angeles", name: "Pacific Time (PT)" },
  { id: "Europe/London", name: "London (GMT)" },
  { id: "Europe/Moscow", name: "Moscow (MSK)" },
  { id: "Asia/Tokyo", name: "Tokyo (JST)" },
];

const landingPages = [
  { id: "/", name: "Home" },
  { id: "/studio", name: "Studio" },
  { id: "/library", name: "Library" },
  { id: "/boards", name: "Boards" },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  // General settings
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [landingPage, setLandingPage] = useState("/");

  // Creation settings
  const [defaultBoard, setDefaultBoard] = useState("none");
  const [defaultImageModel, setDefaultImageModel] = useState("flux-pro");
  const [defaultVideoModel, setDefaultVideoModel] = useState("runway-gen3");
  const [defaultQuality, setDefaultQuality] = useState("high");
  const [autoSaveToBoard, setAutoSaveToBoard] = useState(true);

  // Editor settings
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [defaultAspectRatio, setDefaultAspectRatio] = useState("16:9");
  const [rememberLastParams, setRememberLastParams] = useState(true);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [creditAlerts, setCreditAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [academyUpdates, setAcademyUpdates] = useState(false);

  // Privacy
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = () => {
    toast({
      title: t.settings.saved,
      description: t.settings.savedDescription,
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title={t.settings.title}
        description={t.settings.description}
      />

      <PageContent maxWidth="lg">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="general">{t.settings.tabs.general}</TabsTrigger>
            <TabsTrigger value="creation">{t.settings.tabs.creation}</TabsTrigger>
            <TabsTrigger value="editor">{t.settings.tabs.editor}</TabsTrigger>
            <TabsTrigger value="notifications">{t.settings.tabs.notifications}</TabsTrigger>
            <TabsTrigger value="privacy">{t.settings.tabs.privacy}</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.settings.general.title}</CardTitle>
                <CardDescription>{t.settings.general.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.general.language}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.general.languageDescription}</p>
                    </div>
                  </div>
                  <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "ru")}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.general.theme}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.general.themeDescription}</p>
                    </div>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t.settings.general.themeLight}</SelectItem>
                      <SelectItem value="dark">{t.settings.general.themeDark}</SelectItem>
                      <SelectItem value="system">{t.settings.general.themeSystem}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Timezone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.general.timezone}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.general.timezoneDescription}</p>
                    </div>
                  </div>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.id} value={tz.id}>{tz.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Default Landing Page */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Home className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.general.landingPage}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.general.landingPageDescription}</p>
                    </div>
                  </div>
                  <Select value={landingPage} onValueChange={setLandingPage}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {landingPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gradient-brand">
                <Save className="w-4 h-4 mr-2" />
                {t.settings.saveChanges}
              </Button>
            </div>
          </TabsContent>

          {/* Creation Tab */}
          <TabsContent value="creation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.settings.creation.title}</CardTitle>
                <CardDescription>{t.settings.creation.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Board */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.creation.defaultBoard}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.creation.defaultBoardDescription}</p>
                    </div>
                  </div>
                  <Select value={defaultBoard} onValueChange={setDefaultBoard}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBoards.map((board) => (
                        <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Default Image Model */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Wand2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.creation.defaultImageModel}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.creation.defaultImageModelDescription}</p>
                    </div>
                  </div>
                  <Select value={defaultImageModel} onValueChange={setDefaultImageModel}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {imageModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Default Video Model */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Video className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.creation.defaultVideoModel}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.creation.defaultVideoModelDescription}</p>
                    </div>
                  </div>
                  <Select value={defaultVideoModel} onValueChange={setDefaultVideoModel}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {videoModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Default Quality */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.creation.defaultQuality}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.creation.defaultQualityDescription}</p>
                    </div>
                  </div>
                  <Select value={defaultQuality} onValueChange={setDefaultQuality}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qualityTiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Auto-save to Board */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Save className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.creation.autoSave}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.creation.autoSaveDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={autoSaveToBoard}
                    onCheckedChange={setAutoSaveToBoard}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gradient-brand">
                <Save className="w-4 h-4 mr-2" />
                {t.settings.saveChanges}
              </Button>
            </div>
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.settings.editor.title}</CardTitle>
                <CardDescription>{t.settings.editor.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Show Advanced Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.editor.advancedControls}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.editor.advancedControlsDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={showAdvancedControls}
                    onCheckedChange={setShowAdvancedControls}
                  />
                </div>

                <Separator />

                {/* Default Aspect Ratio */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <RatioIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.editor.aspectRatio}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.editor.aspectRatioDescription}</p>
                    </div>
                  </div>
                  <Select value={defaultAspectRatio} onValueChange={setDefaultAspectRatio}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.id} value={ratio.id}>{ratio.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Remember Last Parameters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <History className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.editor.rememberParams}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.editor.rememberParamsDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={rememberLastParams}
                    onCheckedChange={setRememberLastParams}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gradient-brand">
                <Save className="w-4 h-4 mr-2" />
                {t.settings.saveChanges}
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.settings.notifications.title}</CardTitle>
                <CardDescription>{t.settings.notifications.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.notifications.email}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.notifications.emailDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <Separator />

                {/* Credit Balance Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.notifications.creditAlerts}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.notifications.creditAlertsDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={creditAlerts}
                    onCheckedChange={setCreditAlerts}
                  />
                </div>

                <Separator />

                {/* Product Updates */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Megaphone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.notifications.productUpdates}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.notifications.productUpdatesDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={productUpdates}
                    onCheckedChange={setProductUpdates}
                  />
                </div>

                <Separator />

                {/* Academy Updates */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.notifications.academyUpdates}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.notifications.academyUpdatesDescription}</p>
                    </div>
                  </div>
                  <Switch
                    checked={academyUpdates}
                    onCheckedChange={setAcademyUpdates}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gradient-brand">
                <Save className="w-4 h-4 mr-2" />
                {t.settings.saveChanges}
              </Button>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.settings.privacy.title}</CardTitle>
                <CardDescription>{t.settings.privacy.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Visibility */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t.settings.privacy.contentVisibility}</Label>
                      <p className="text-xs text-muted-foreground">{t.settings.privacy.contentVisibilityDescription}</p>
                    </div>
                  </div>
                  <Select defaultValue="private" disabled>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">{t.settings.privacy.private}</SelectItem>
                      <SelectItem value="unlisted">{t.settings.privacy.unlisted}</SelectItem>
                      <SelectItem value="public">{t.settings.privacy.public}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Data Usage Notice */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50 mt-0.5">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{t.settings.privacy.dataUsage}</Label>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {t.settings.privacy.dataUsageNotice}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t.settings.privacy.dangerZone}
                </CardTitle>
                <CardDescription>{t.settings.privacy.dangerZoneDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">{t.settings.privacy.deleteAccount}</Label>
                    <p className="text-xs text-muted-foreground">{t.settings.privacy.deleteAccountDescription}</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.settings.privacy.deleteAccount}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gradient-brand">
                <Save className="w-4 h-4 mr-2" />
                {t.settings.saveChanges}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </PageContent>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t.settings.privacy.deleteConfirmTitle}
            </DialogTitle>
            <DialogDescription>
              {t.settings.privacy.deleteConfirmDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-muted-foreground">
            {t.settings.privacy.deleteWarning}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false);
                toast({
                  title: t.settings.privacy.deleteRequested,
                  description: t.settings.privacy.deleteRequestedDescription,
                });
              }}
            >
              {t.settings.privacy.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
