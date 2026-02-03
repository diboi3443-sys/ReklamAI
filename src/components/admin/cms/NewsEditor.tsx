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
  Link,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  link: string;
  linkType: "internal" | "external";
  status: "published" | "draft";
  order: number;
}

const mockNewsItems: NewsItem[] = [
  {
    id: "1",
    title: "Cinema Studio 2.0 Released",
    description: "Create cinematic videos with enhanced motion control and new camera presets.",
    mediaUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=120&fit=crop",
    mediaType: "image",
    link: "/studio?mode=cinema",
    linkType: "internal",
    status: "published",
    order: 1,
  },
  {
    id: "2",
    title: "New Flux Pro Model Available",
    description: "Experience faster, higher quality image generation with our latest AI model.",
    mediaUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=120&fit=crop",
    mediaType: "image",
    link: "/studio",
    linkType: "internal",
    status: "published",
    order: 2,
  },
  {
    id: "3",
    title: "Academy Launch Announcement",
    description: "Learn from the best with our new Academy training platform.",
    mediaUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=120&fit=crop",
    mediaType: "image",
    link: "/academy",
    linkType: "internal",
    status: "draft",
    order: 3,
  },
];

interface NewsEditorProps {
  sectionId: string;
  onChangesMade: () => void;
}

export default function NewsEditor({ sectionId, onChangesMade }: NewsEditorProps) {
  const [items, setItems] = useState<NewsItem[]>(mockNewsItems);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddNew = () => {
    const newItem: NewsItem = {
      id: Date.now().toString(),
      title: "",
      description: "",
      mediaUrl: "",
      mediaType: "image",
      link: "",
      linkType: "internal",
      status: "draft",
      order: items.length + 1,
    };
    setEditingItem(newItem);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: NewsItem) => {
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

  const handleToggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: i.status === "published" ? "draft" : "published" } : i
      )
    );
    onChangesMade();
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    onChangesMade();
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    onChangesMade();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">News & Updates</h3>
          <p className="text-sm text-muted-foreground">Manage news items displayed on the home page</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add News Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={item.id} className={item.status === "draft" ? "opacity-70" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <div className="flex flex-col items-center gap-1 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 cursor-grab"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                </div>

                {/* Media Preview */}
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {item.mediaUrl ? (
                    <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{item.title || "Untitled"}</h4>
                    <Badge
                      variant={item.status === "published" ? "default" : "outline"}
                      size="sm"
                      className={item.status === "draft" ? "text-warning border-warning/30" : ""}
                    >
                      {item.status}
                    </Badge>
                    {item.mediaType === "video" && (
                      <Badge variant="secondary" size="sm">
                        <Video className="w-3 h-3 mr-1" />
                        Video
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Link className="w-3 h-3" />
                    <span>{item.link || "No link"}</span>
                    <Badge variant="outline" size="sm">{item.linkType}</Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleStatus(item.id)}
                  >
                    {item.status === "published" ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleMoveUp(index)} disabled={index === 0}>
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMoveDown(index)} disabled={index === items.length - 1}>
                        Move Down
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="p-12 text-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No news items yet</p>
            <Button variant="outline" className="mt-4" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem && items.find((i) => i.id === editingItem.id) ? "Edit News Item" : "Add News Item"}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
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
                  <Label>Status</Label>
                  <Select
                    value={editingItem.status}
                    onValueChange={(v) => setEditingItem({ ...editingItem, status: v as "published" | "draft" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                  <Label>Link</Label>
                  <Input
                    value={editingItem.link}
                    onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                    placeholder="/studio or https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link Type</Label>
                  <Select
                    value={editingItem.linkType}
                    onValueChange={(v) => setEditingItem({ ...editingItem, linkType: v as "internal" | "external" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
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
