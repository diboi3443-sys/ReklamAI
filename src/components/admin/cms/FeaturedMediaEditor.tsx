import * as React from "react";
import { useState } from "react";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Image,
  Video,
  Star,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

interface FeaturedItem {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string;
  link: string;
  badges: ("new" | "featured" | "trending")[];
  visible: boolean;
  order: number;
}

const mockFeaturedItems: FeaturedItem[] = [
  {
    id: "1",
    mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop",
    mediaType: "image",
    caption: "Abstract AI Art Collection",
    link: "/studio?load=featured-1",
    badges: ["featured"],
    visible: true,
    order: 1,
  },
  {
    id: "2",
    mediaUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
    mediaType: "video",
    caption: "Cinematic Product Video",
    link: "/studio?load=featured-2",
    badges: ["new", "featured"],
    visible: true,
    order: 2,
  },
  {
    id: "3",
    mediaUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=300&h=200&fit=crop",
    mediaType: "image",
    caption: "Fantasy Landscape",
    link: "/studio?load=featured-3",
    badges: ["trending"],
    visible: true,
    order: 3,
  },
  {
    id: "4",
    mediaUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=200&fit=crop",
    mediaType: "image",
    caption: "Neon Portrait Series",
    link: "/studio?load=featured-4",
    badges: [],
    visible: false,
    order: 4,
  },
];

interface FeaturedMediaEditorProps {
  sectionId: string;
  onChangesMade: () => void;
}

export default function FeaturedMediaEditor({ sectionId, onChangesMade }: FeaturedMediaEditorProps) {
  const [items, setItems] = useState<FeaturedItem[]>(mockFeaturedItems);
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddNew = () => {
    const newItem: FeaturedItem = {
      id: Date.now().toString(),
      mediaUrl: "",
      mediaType: "image",
      caption: "",
      link: "",
      badges: [],
      visible: true,
      order: items.length + 1,
    };
    setEditingItem(newItem);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: FeaturedItem) => {
    setEditingItem({ ...item });
    setIsDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!editingItem) return;

    const exists = items.find((i) => i.id === editingItem.id);
    if (exists) {
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? editingItem : i)));
    } else {
      setItems((prev) => [...prev, editingItem]);
    }

    setIsDialogOpen(false);
    setEditingItem(null);
    onChangesMade();
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    onChangesMade();
  };

  const handleToggleVisibility = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i))
    );
    onChangesMade();
  };

  const toggleBadge = (badge: "new" | "featured" | "trending") => {
    if (!editingItem) return;
    const hasBadge = editingItem.badges.includes(badge);
    setEditingItem({
      ...editingItem,
      badges: hasBadge
        ? editingItem.badges.filter((b) => b !== badge)
        : [...editingItem.badges, badge],
    });
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "new": return <Sparkles className="w-3 h-3" />;
      case "featured": return <Star className="w-3 h-3" />;
      case "trending": return <Star className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Featured Media</h3>
          <p className="text-sm text-muted-foreground">Curate featured images and videos</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Media
        </Button>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <Card
            key={item.id}
            className={`group overflow-hidden ${!item.visible ? "opacity-50" : ""}`}
          >
            <div className="relative aspect-video bg-secondary">
              {item.mediaUrl ? (
                <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              {/* Type indicator */}
              {item.mediaType === "video" && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" size="sm">
                    <Video className="w-3 h-3" />
                  </Badge>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-2 right-2 flex gap-1">
                {item.badges.map((badge) => (
                  <Badge key={badge} variant="default" size="sm" className="capitalize gap-1">
                    {getBadgeIcon(badge)}
                    {badge}
                  </Badge>
                ))}
              </div>

              {/* Order indicator */}
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" size="sm">#{index + 1}</Badge>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleEdit(item)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => handleToggleVisibility(item.id)}
                >
                  {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium truncate">{item.caption || "No caption"}</p>
              {item.link && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ExternalLink className="w-3 h-3" />
                  {item.link}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <Card
          className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={handleAddNew}
        >
          <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground">
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm">Add Media</span>
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem && items.find((i) => i.id === editingItem.id) ? "Edit Media" : "Add Media"}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Media URL</Label>
                <Input
                  value={editingItem.mediaUrl}
                  onChange={(e) => setEditingItem({ ...editingItem, mediaUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Media Type</Label>
                  <Select
                    value={editingItem.mediaType}
                    onValueChange={(v) => setEditingItem({ ...editingItem, mediaType: v as "image" | "video" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={editingItem.visible ? "visible" : "hidden"}
                    onValueChange={(v) => setEditingItem({ ...editingItem, visible: v === "visible" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Caption</Label>
                <Input
                  value={editingItem.caption}
                  onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                  placeholder="Enter caption"
                />
              </div>

              <div className="space-y-2">
                <Label>Link (Studio or Preview)</Label>
                <Input
                  value={editingItem.link}
                  onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                  placeholder="/studio?load=..."
                />
              </div>

              <div className="space-y-2">
                <Label>Badges</Label>
                <div className="flex gap-4">
                  {(["new", "featured", "trending"] as const).map((badge) => (
                    <div key={badge} className="flex items-center gap-2">
                      <Checkbox
                        id={`badge-${badge}`}
                        checked={editingItem.badges.includes(badge)}
                        onCheckedChange={() => toggleBadge(badge)}
                      />
                      <Label htmlFor={`badge-${badge}`} className="capitalize text-sm">
                        {badge}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
