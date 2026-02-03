import * as React from "react";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Link,
  Megaphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface BannerItem {
  id: string;
  title: string;
  message: string;
  style: "info" | "success" | "warning" | "promo";
  ctaLabel: string;
  ctaLink: string;
  visible: boolean;
  scheduled: boolean;
  startDate: string;
  endDate: string;
}

const mockBanners: BannerItem[] = [
  {
    id: "1",
    title: "🎉 New Feature",
    message: "Cinema Studio 2.0 is now available! Create cinematic videos with enhanced motion control.",
    style: "promo",
    ctaLabel: "Try Now",
    ctaLink: "/studio?mode=cinema",
    visible: true,
    scheduled: false,
    startDate: "",
    endDate: "",
  },
  {
    id: "2",
    title: "⚡ Performance Update",
    message: "We've improved generation speeds by 40%. Enjoy faster results!",
    style: "success",
    ctaLabel: "",
    ctaLink: "",
    visible: false,
    scheduled: true,
    startDate: "2024-01-15",
    endDate: "2024-01-22",
  },
];

interface BannerEditorProps {
  sectionId: string;
  onChangesMade: () => void;
}

export default function BannerEditor({ sectionId, onChangesMade }: BannerEditorProps) {
  const [banners, setBanners] = useState<BannerItem[]>(mockBanners);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddNew = () => {
    const newBanner: BannerItem = {
      id: Date.now().toString(),
      title: "",
      message: "",
      style: "info",
      ctaLabel: "",
      ctaLink: "",
      visible: false,
      scheduled: false,
      startDate: "",
      endDate: "",
    };
    setEditingBanner(newBanner);
    setIsDialogOpen(true);
  };

  const handleEdit = (banner: BannerItem) => {
    setEditingBanner({ ...banner });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingBanner) return;

    const exists = banners.find((b) => b.id === editingBanner.id);
    if (exists) {
      setBanners((prev) => prev.map((b) => (b.id === editingBanner.id ? editingBanner : b)));
    } else {
      setBanners((prev) => [...prev, editingBanner]);
    }

    setIsDialogOpen(false);
    setEditingBanner(null);
    onChangesMade();
  };

  const handleDelete = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    onChangesMade();
  };

  const handleToggleVisibility = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b))
    );
    onChangesMade();
  };

  const getStyleClasses = (style: string) => {
    switch (style) {
      case "info": return "bg-info/10 border-info/30 text-info";
      case "success": return "bg-success/10 border-success/30 text-success";
      case "warning": return "bg-warning/10 border-warning/30 text-warning";
      case "promo": return "gradient-brand-subtle border-primary/30 text-foreground";
      default: return "bg-secondary";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Banners & Announcements</h3>
          <p className="text-sm text-muted-foreground">Manage site-wide banners and alerts</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map((banner) => (
          <Card key={banner.id} className={!banner.visible ? "opacity-60" : ""}>
            <CardContent className="p-4 space-y-3">
              {/* Preview */}
              <div className={`p-4 rounded-lg border ${getStyleClasses(banner.style)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {banner.title && <p className="font-semibold">{banner.title}</p>}
                    <p className="text-sm mt-1">{banner.message || "No message"}</p>
                  </div>
                  {banner.ctaLabel && (
                    <Button size="sm" variant="secondary">
                      {banner.ctaLabel}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{banner.style}</Badge>
                  {banner.visible ? (
                    <Badge variant="default" size="sm">Live</Badge>
                  ) : (
                    <Badge variant="outline" size="sm">Hidden</Badge>
                  )}
                  {banner.scheduled && (
                    <Badge variant="secondary" size="sm" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      Scheduled
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleVisibility(banner.id)}
                  >
                    {banner.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(banner)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <div className="p-12 text-center border border-dashed border-border rounded-lg">
            <Megaphone className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No banners configured</p>
            <Button variant="outline" className="mt-4" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Banner
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBanner && banners.find((b) => b.id === editingBanner.id) ? "Edit Banner" : "Add Banner"}
            </DialogTitle>
          </DialogHeader>

          {editingBanner && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  placeholder="🎉 New Feature"
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={editingBanner.message}
                  onChange={(e) => setEditingBanner({ ...editingBanner, message: e.target.value })}
                  placeholder="Banner message..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Style</Label>
                <Select
                  value={editingBanner.style}
                  onValueChange={(v) => setEditingBanner({ ...editingBanner, style: v as BannerItem["style"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (Blue)</SelectItem>
                    <SelectItem value="success">Success (Green)</SelectItem>
                    <SelectItem value="warning">Warning (Yellow)</SelectItem>
                    <SelectItem value="promo">Promo (Gradient)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CTA Label (optional)</Label>
                  <Input
                    value={editingBanner.ctaLabel}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaLabel: e.target.value })}
                    placeholder="Try Now"
                  />
                </div>

                <div className="space-y-2">
                  <Label>CTA Link</Label>
                  <Input
                    value={editingBanner.ctaLink}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                    placeholder="/studio"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Schedule Banner</Label>
                <Switch
                  checked={editingBanner.scheduled}
                  onCheckedChange={(v) => setEditingBanner({ ...editingBanner, scheduled: v })}
                />
              </div>

              {editingBanner.scheduled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={editingBanner.startDate}
                      onChange={(e) => setEditingBanner({ ...editingBanner, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={editingBanner.endDate}
                      onChange={(e) => setEditingBanner({ ...editingBanner, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Visible</Label>
                <Switch
                  checked={editingBanner.visible}
                  onCheckedChange={(v) => setEditingBanner({ ...editingBanner, visible: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
