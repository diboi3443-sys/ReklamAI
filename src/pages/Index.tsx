import * as React from "react";
import {
  Hexagon,
  Sparkles,
  Image,
  Video,
  Mic,
  FileText,
  Settings,
  HelpCircle,
  User,
  Bell,
  Search,
  Plus,
  LayoutGrid,
  Wand2,
  Layers,
  Play,
  Download,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusIndicator, Spinner, ProgressBar } from "@/components/ui/status";
import { Canvas } from "@/components/ui/canvas";
import {
  StudioSidebarProvider,
  StudioSidebar,
  StudioSidebarHeader,
  StudioSidebarContent,
  StudioSidebarSection,
  StudioSidebarItem,
  StudioSidebarFooter,
  StudioSidebarTrigger,
} from "@/components/ui/studio-sidebar";
import {
  TopNav,
  TopNavBrand,
  TopNavSection,
  TopNavItem,
  TopNavSeparator,
  TopNavActions,
} from "@/components/ui/top-nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-glow-sm">
              <Hexagon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight gradient-text">
                ReklamAI UI Kit
              </h1>
              <p className="text-muted-foreground">
                Component library for AI studio interfaces
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">
        {/* Buttons Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Buttons</h2>
            <p className="text-muted-foreground text-sm">
              Interactive elements with multiple variants and states
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Variants */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Variants
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="glow">Glow</Button>
                    <Button variant="gradient">Gradient</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Sizes
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="lg" className="h-14 px-8 text-lg">Extra Large</Button>
                    <Button size="icon-sm">
                      <Plus />
                    </Button>
                    <Button size="icon">
                      <Plus />
                    </Button>
                    <Button size="icon-lg">
                      <Plus />
                    </Button>
                  </div>
                </div>

                {/* With Icons */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    With Icons
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>
                      <Sparkles /> Generate
                    </Button>
                    <Button variant="outline">
                      <Download /> Export
                    </Button>
                    <Button variant="glow">
                      <Wand2 /> Create Magic
                    </Button>
                  </div>
                </div>

                {/* States */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    States
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled>Disabled</Button>
                    <Button variant="glow" disabled>
                      Disabled Glow
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inputs Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Input & Textarea</h2>
            <p className="text-muted-foreground text-sm">
              Form controls with variants and sizes
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Input Variants
                  </h3>
                  <Input placeholder="Default input" />
                  <Input variant="ghost" placeholder="Ghost input" />
                  <Input variant="glow" placeholder="Glow input" />
                  <div className="flex gap-2">
                    <Input inputSize="sm" placeholder="Small" />
                    <Input inputSize="lg" placeholder="Large" />
                  </div>
                  <Input disabled placeholder="Disabled input" />
                </div>

                {/* Textareas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Textarea Variants
                  </h3>
                  <Textarea placeholder="Default textarea" />
                  <Textarea variant="ghost" placeholder="Ghost textarea" />
                  <Textarea variant="glow" placeholder="Glow textarea" />
                  <Textarea disabled placeholder="Disabled textarea" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Cards</h2>
            <p className="text-muted-foreground text-sm">
              Container components with multiple styles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card style</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Basic card with border and subtle shadow.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>With stronger shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stands out from the background with elevation.
                </p>
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Hover for effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Changes appearance on hover.
                </p>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardHeader>
                <CardTitle>Gradient Border</CardTitle>
                <CardDescription>Brand accent border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Premium feel with gradient border.
                </p>
              </CardContent>
            </Card>

            <Card variant="glow">
              <CardHeader>
                <CardTitle>Glow Card</CardTitle>
                <CardDescription>With ambient glow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Subtle glow effect for emphasis.
                </p>
              </CardContent>
            </Card>

            <Card variant="ghost">
              <CardHeader>
                <CardTitle>Ghost Card</CardTitle>
                <CardDescription>Minimal styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transparent background, no border.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Badges</h2>
            <p className="text-muted-foreground text-sm">
              Labels and status indicators
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Variants
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="destructive">Error</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="gradient">Gradient</Badge>
                    <Badge variant="glow">Glow</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Sizes
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge size="sm">Small</Badge>
                    <Badge size="default">Default</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tabs Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Tabs</h2>
            <p className="text-muted-foreground text-sm">
              Navigation tabs with different styles
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-8">
              {/* Default Tabs */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Default
                </h3>
                <Tabs defaultValue="images">
                  <TabsList>
                    <TabsTrigger value="images">Images</TabsTrigger>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                  </TabsList>
                  <TabsContent value="images">
                    <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-lg">
                      Image content goes here
                    </p>
                  </TabsContent>
                  <TabsContent value="videos">
                    <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-lg">
                      Video content goes here
                    </p>
                  </TabsContent>
                  <TabsContent value="audio">
                    <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-lg">
                      Audio content goes here
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Underline Tabs */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Underline
                </h3>
                <Tabs defaultValue="generate">
                  <TabsList variant="underline">
                    <TabsTrigger variant="underline" value="generate">
                      Generate
                    </TabsTrigger>
                    <TabsTrigger variant="underline" value="edit">
                      Edit
                    </TabsTrigger>
                    <TabsTrigger variant="underline" value="enhance">
                      Enhance
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="generate">
                    <p className="text-sm text-muted-foreground p-4">
                      Create new content from scratch
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Pills Tabs */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Pills
                </h3>
                <Tabs defaultValue="all">
                  <TabsList variant="pills">
                    <TabsTrigger variant="pills" value="all">
                      All
                    </TabsTrigger>
                    <TabsTrigger variant="pills" value="recent">
                      Recent
                    </TabsTrigger>
                    <TabsTrigger variant="pills" value="favorites">
                      Favorites
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Status Indicators Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Status Indicators</h2>
            <p className="text-muted-foreground text-sm">
              Loading, success, error, and progress states
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-8">
              {/* Status with Icons */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  With Icons
                </h3>
                <div className="flex flex-wrap gap-6">
                  <StatusIndicator variant="loading">Processing...</StatusIndicator>
                  <StatusIndicator variant="success">Complete</StatusIndicator>
                  <StatusIndicator variant="error">Failed</StatusIndicator>
                  <StatusIndicator variant="warning">Warning</StatusIndicator>
                  <StatusIndicator variant="info">Information</StatusIndicator>
                </div>
              </div>

              {/* Status with Dots */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  With Dots
                </h3>
                <div className="flex flex-wrap gap-6">
                  <StatusIndicator variant="loading" showDot>
                    Processing
                  </StatusIndicator>
                  <StatusIndicator variant="success" showDot>
                    Online
                  </StatusIndicator>
                  <StatusIndicator variant="error" showDot>
                    Offline
                  </StatusIndicator>
                </div>
              </div>

              {/* Spinners */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Spinners
                </h3>
                <div className="flex items-center gap-6">
                  <Spinner size="sm" />
                  <Spinner size="default" />
                  <Spinner size="lg" />
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Progress Bars
                </h3>
                <div className="space-y-4 max-w-md">
                  <ProgressBar value={25} />
                  <ProgressBar value={50} variant="gradient" />
                  <ProgressBar value={75} variant="glow" showValue />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Canvas Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Canvas</h2>
            <p className="text-muted-foreground text-sm">
              Media preview containers for AI-generated content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Default (16:9)
              </h3>
              <Canvas empty emptyMessage="Drop media or generate content" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Loading State
              </h3>
              <Canvas loading />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Square with Glow
              </h3>
              <Canvas variant="glow" size="square" empty />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Portrait with Gradient
              </h3>
              <Canvas variant="gradient" size="portrait" empty />
            </div>
          </div>
        </section>

        {/* Modal & Drawer Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Modal & Drawer</h2>
            <p className="text-muted-foreground text-sm">
              Overlay components for dialogs and panels
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                {/* Modal */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Modal</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>
                        Start a new AI generation project with custom settings.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="Project name" />
                      <Textarea placeholder="Description (optional)" />
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="glow">
                        <Sparkles /> Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Drawer */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open Drawer</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Generation Settings</SheetTitle>
                      <SheetDescription>
                        Configure your AI generation parameters.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quality</label>
                        <Input placeholder="High" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Style</label>
                        <Textarea placeholder="Describe your style..." />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tooltip Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Tooltips</h2>
            <p className="text-muted-foreground text-sm">
              Contextual information on hover
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Wand2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate with AI</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Download />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Share2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Navigation Components Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Navigation</h2>
            <p className="text-muted-foreground text-sm">
              Top nav bar and sidebar components
            </p>
          </div>

          {/* Top Nav Preview */}
          <Card className="overflow-hidden">
            <div className="border-b border-border">
              <TopNav>
                <TopNavBrand>
                  <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                    <Hexagon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold">ReklamAI</span>
                </TopNavBrand>

                <TopNavSection align="center">
                  <TopNavItem active>
                    <LayoutGrid className="w-4 h-4" /> Projects
                  </TopNavItem>
                  <TopNavItem>
                    <Sparkles className="w-4 h-4" /> Create
                  </TopNavItem>
                  <TopNavItem>
                    <Layers className="w-4 h-4" /> Assets
                  </TopNavItem>
                </TopNavSection>

                <TopNavActions>
                  <Button variant="ghost" size="icon-sm">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Bell className="w-4 h-4" />
                  </Button>
                  <TopNavSeparator />
                  <Button variant="glow" size="sm">
                    <Plus className="w-4 h-4" /> New
                  </Button>
                </TopNavActions>
              </TopNav>
            </div>
            <CardContent className="py-3 bg-secondary/30">
              <p className="text-xs text-muted-foreground text-center">
                Top Navigation Bar Preview
              </p>
            </CardContent>
          </Card>

          {/* Sidebar Preview */}
          <Card className="overflow-hidden">
            <div className="flex h-80">
              <StudioSidebarProvider>
                <StudioSidebar>
                  <StudioSidebarHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded gradient-brand flex items-center justify-center">
                        <Hexagon className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span className="font-semibold text-sm">ReklamAI</span>
                    </div>
                    <StudioSidebarTrigger />
                  </StudioSidebarHeader>

                  <StudioSidebarContent>
                    <StudioSidebarSection title="Create">
                      <StudioSidebarItem
                        icon={<Image className="w-4 h-4" />}
                        active
                      >
                        Image
                      </StudioSidebarItem>
                      <StudioSidebarItem icon={<Video className="w-4 h-4" />}>
                        Video
                      </StudioSidebarItem>
                      <StudioSidebarItem icon={<Mic className="w-4 h-4" />}>
                        Audio
                      </StudioSidebarItem>
                      <StudioSidebarItem icon={<FileText className="w-4 h-4" />}>
                        Text
                      </StudioSidebarItem>
                    </StudioSidebarSection>

                    <StudioSidebarSection title="Library">
                      <StudioSidebarItem
                        icon={<Layers className="w-4 h-4" />}
                        badge={<Badge size="sm">12</Badge>}
                      >
                        Assets
                      </StudioSidebarItem>
                    </StudioSidebarSection>
                  </StudioSidebarContent>

                  <StudioSidebarFooter>
                    <StudioSidebarItem icon={<Settings className="w-4 h-4" />}>
                      Settings
                    </StudioSidebarItem>
                  </StudioSidebarFooter>
                </StudioSidebar>

                <div className="flex-1 flex items-center justify-center bg-secondary/30">
                  <p className="text-sm text-muted-foreground">
                    Main Content Area
                  </p>
                </div>
              </StudioSidebarProvider>
            </div>
          </Card>
        </section>

        {/* Theme Toggle Info */}
        <section className="p-6 rounded-xl bg-card border border-border space-y-2">
          <h2 className="text-xl font-semibold">Theme Support</h2>
          <p className="text-sm text-muted-foreground">
            All components support both dark (default) and light themes via the{" "}
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">
              .dark
            </code>{" "}
            class. Remove the class from{" "}
            <code className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs">
              html
            </code>{" "}
            element to switch to light mode.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Index;
