import * as React from "react";
import { useState, useCallback } from "react";
import {
  Upload,
  X,
  Image,
  Video,
  Music,
  FileUp,
  Check,
  Loader2,
  Tag,
  LayoutGrid,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { mockBoards } from "@/lib/boards";
import { useTranslation } from "@/i18n";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: (files: File[]) => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  preview?: string;
}

const ACCEPTED_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
};

const ALL_ACCEPTED = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video, ...ACCEPTED_TYPES.audio];

function getFileType(mimeType: string): "image" | "video" | "audio" | null {
  if (ACCEPTED_TYPES.image.includes(mimeType)) return "image";
  if (ACCEPTED_TYPES.video.includes(mimeType)) return "video";
  if (ACCEPTED_TYPES.audio.includes(mimeType)) return "audio";
  return null;
}

const typeIcons = {
  image: Image,
  video: Video,
  audio: Music,
};

export function UploadModal({ open, onOpenChange, onUploadComplete }: UploadModalProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedBoard, setSelectedBoard] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => ALL_ACCEPTED.includes(file.type));
    const uploadFiles: UploadFile[] = validFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: "pending",
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const simulateUpload = async () => {
    setIsUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" } : f))
      );

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
        );
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "complete", progress: 100 } : f))
      );
    }

    setIsUploading(false);
    onUploadComplete?.(files.map((f) => f.file));
    
    // Reset after short delay
    setTimeout(() => {
      setFiles([]);
      setTags([]);
      setSelectedBoard("");
      onOpenChange(false);
    }, 1000);
  };

  const handleClose = () => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setTags([]);
    setSelectedBoard("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t.assets.uploadAssets}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 transition-all text-center",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
              files.length > 0 && "py-4"
            )}
          >
            <input
              type="file"
              multiple
              accept={ALL_ACCEPTED.join(",")}
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {files.length === 0 ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
                  <FileUp className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{t.assets.dragAndDrop}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.assets.orClickToSelect}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" size="sm">
                    <Image className="w-3 h-3" /> Images
                  </Badge>
                  <Badge variant="outline" size="sm">
                    <Video className="w-3 h-3" /> Videos
                  </Badge>
                  <Badge variant="outline" size="sm">
                    <Music className="w-3 h-3" /> Audio
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileUp className="w-4 h-4" />
                {t.assets.dropMoreFiles}
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file) => {
                const fileType = getFileType(file.file.type);
                const Icon = fileType ? typeIcons[fileType] : Image;
                
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                  >
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {(file.file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        {file.status === "uploading" && (
                          <Progress value={file.progress} className="h-1 flex-1" />
                        )}
                        {file.status === "complete" && (
                          <Badge variant="success" size="sm">
                            <Check className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                    {file.status === "uploading" ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : file.status !== "complete" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t.assets.addTags}
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder={t.assets.typeAndEnter}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addTag}>
                {t.common.apply}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Assign to Board */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              {t.assets.assignToBoard}
            </label>
            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
              <SelectTrigger>
                <SelectValue placeholder={t.assets.selectBoardOptional} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t.assets.noBoard}</SelectItem>
                {mockBoards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="glow"
            onClick={simulateUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.assets.uploading}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {t.assets.uploadFiles} ({files.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
