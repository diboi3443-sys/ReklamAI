// Asset types
export type AssetType = "image" | "video" | "audio";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  thumbnail: string;
  size: number; // in bytes
  width?: number;
  height?: number;
  duration?: number; // in seconds for video/audio
  tags: string[];
  boardId?: string;
  createdAt: string;
  updatedAt: string;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Format duration
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Mock assets data
export const mockAssets: Asset[] = [
  // Images
  {
    id: "asset-img-1",
    name: "summer-beach.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop",
    size: 2457600,
    width: 1920,
    height: 1080,
    tags: ["summer", "beach", "vacation"],
    boardId: "board-1",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "asset-img-2",
    name: "product-shot.png",
    type: "image",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=1200&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    size: 1843200,
    width: 1200,
    height: 1200,
    tags: ["product", "watch", "minimal"],
    boardId: "board-2",
    createdAt: "2024-01-14T15:45:00Z",
    updatedAt: "2024-01-14T15:45:00Z",
  },
  {
    id: "asset-img-3",
    name: "portrait-model.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=1500&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    size: 3072000,
    width: 1200,
    height: 1500,
    tags: ["portrait", "model", "fashion"],
    createdAt: "2024-01-13T09:00:00Z",
    updatedAt: "2024-01-13T09:00:00Z",
  },
  {
    id: "asset-img-4",
    name: "city-skyline.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&h=1080&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop",
    size: 2867200,
    width: 1920,
    height: 1080,
    tags: ["city", "urban", "night"],
    createdAt: "2024-01-12T11:00:00Z",
    updatedAt: "2024-01-12T11:00:00Z",
  },
  {
    id: "asset-img-5",
    name: "nature-landscape.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    size: 3276800,
    width: 1920,
    height: 1080,
    tags: ["nature", "mountains", "landscape"],
    boardId: "board-1",
    createdAt: "2024-01-11T14:30:00Z",
    updatedAt: "2024-01-11T14:30:00Z",
  },
  {
    id: "asset-img-6",
    name: "food-photography.jpg",
    type: "image",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=1200&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
    size: 1638400,
    width: 1200,
    height: 1200,
    tags: ["food", "pizza", "restaurant"],
    createdAt: "2024-01-10T16:00:00Z",
    updatedAt: "2024-01-10T16:00:00Z",
  },
  // Videos
  {
    id: "asset-vid-1",
    name: "ocean-waves.mp4",
    type: "video",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&h=1080&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&h=400&fit=crop",
    size: 15728640,
    width: 1920,
    height: 1080,
    duration: 12,
    tags: ["ocean", "waves", "nature"],
    boardId: "board-3",
    createdAt: "2024-01-14T12:00:00Z",
    updatedAt: "2024-01-14T12:00:00Z",
  },
  {
    id: "asset-vid-2",
    name: "city-timelapse.mp4",
    type: "video",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=400&fit=crop",
    size: 31457280,
    width: 1920,
    height: 1080,
    duration: 30,
    tags: ["city", "timelapse", "urban"],
    createdAt: "2024-01-13T18:00:00Z",
    updatedAt: "2024-01-13T18:00:00Z",
  },
  {
    id: "asset-vid-3",
    name: "product-demo.mp4",
    type: "video",
    url: "https://images.unsplash.com/photo-1491553895911-0055uj66ef46?w=1280&h=720&fit=crop",
    thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop",
    size: 20971520,
    width: 1280,
    height: 720,
    duration: 18,
    tags: ["product", "demo", "commercial"],
    boardId: "board-2",
    createdAt: "2024-01-12T09:00:00Z",
    updatedAt: "2024-01-12T09:00:00Z",
  },
  // Audio
  {
    id: "asset-aud-1",
    name: "background-music.mp3",
    type: "audio",
    url: "#",
    thumbnail: "",
    size: 4194304,
    duration: 180,
    tags: ["music", "background", "ambient"],
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "asset-aud-2",
    name: "voiceover-intro.wav",
    type: "audio",
    url: "#",
    thumbnail: "",
    size: 8388608,
    duration: 45,
    tags: ["voiceover", "intro", "professional"],
    createdAt: "2024-01-09T14:00:00Z",
    updatedAt: "2024-01-09T14:00:00Z",
  },
];

// Get assets by type
export function getAssetsByType(type: AssetType): Asset[] {
  return mockAssets.filter((asset) => asset.type === type);
}

// Get asset by ID
export function getAssetById(id: string): Asset | undefined {
  return mockAssets.find((asset) => asset.id === id);
}

// Get all unique tags
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  mockAssets.forEach((asset) => {
    asset.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
