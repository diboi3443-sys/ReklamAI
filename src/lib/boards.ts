import { ModeId } from "./features";

// Board types
export interface Board {
  id: string;
  title: string;  // Changed from 'name' to match DB schema
  description: string;
  thumbnail: string | null;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface BoardItem {
  id: string;
  boardId: string;
  thumbnail: string;
  prompt: string;
  mode: ModeId;
  featureName: string;
  model: string;
  status: "ready" | "generating" | "error";
  createdAt: string;
  version: number;
}

// Mock boards data
export const mockBoards: Board[] = [
  {
    id: "board-1",
    title: "Summer Campaign 2024",
    description: "Beach and outdoor lifestyle ads for summer collection launch",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    itemsCount: 24,
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    isPinned: true,
  },
  {
    id: "board-2",
    title: "Product Demos",
    description: "AI-generated product showcase videos and images",
    thumbnail: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=300&fit=crop",
    itemsCount: 18,
    createdAt: "2024-01-08T10:00:00Z",
    updatedAt: "2024-01-14T09:15:00Z",
    isPinned: true,
  },
  {
    id: "board-3",
    title: "UGC Style Experiments",
    description: "Testing different UGC formats and styles",
    thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop",
    itemsCount: 32,
    createdAt: "2024-01-05T12:00:00Z",
    updatedAt: "2024-01-13T18:45:00Z",
  },
  {
    id: "board-4",
    title: "Brand Refresh",
    description: "New visual identity explorations",
    thumbnail: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop",
    itemsCount: 15,
    createdAt: "2024-01-03T09:00:00Z",
    updatedAt: "2024-01-12T11:20:00Z",
  },
  {
    id: "board-5",
    title: "Social Media Content",
    description: "Instagram and TikTok content pieces",
    thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop",
    itemsCount: 45,
    createdAt: "2024-01-01T14:00:00Z",
    updatedAt: "2024-01-11T16:00:00Z",
  },
  {
    id: "board-6",
    title: "Cinematic Ads",
    description: "High-end cinematic advertisement concepts",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop",
    itemsCount: 8,
    createdAt: "2023-12-28T11:00:00Z",
    updatedAt: "2024-01-10T13:30:00Z",
  },
];

// Mock board items
export const mockBoardItems: BoardItem[] = [
  {
    id: "item-1",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    prompt: "Mountain landscape at golden hour with dramatic clouds",
    mode: "image",
    featureName: "Create Image",
    model: "FLUX.1 Pro",
    status: "ready",
    createdAt: "2024-01-15T10:30:00Z",
    version: 1,
  },
  {
    id: "item-2",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop",
    prompt: "Mountain landscape at golden hour with dramatic clouds",
    mode: "image",
    featureName: "Create Image",
    model: "FLUX.1 Pro",
    status: "ready",
    createdAt: "2024-01-15T10:35:00Z",
    version: 2,
  },
  {
    id: "item-3",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
    prompt: "Sunset lighting from the left",
    mode: "image",
    featureName: "Relight",
    model: "IC-Light",
    status: "ready",
    createdAt: "2024-01-15T10:40:00Z",
    version: 3,
  },
  {
    id: "item-4",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop",
    prompt: "Futuristic city skyline at night with neon lights",
    mode: "image",
    featureName: "Cinema Studio Image",
    model: "FLUX.1 Pro",
    status: "ready",
    createdAt: "2024-01-14T15:45:00Z",
    version: 1,
  },
  {
    id: "item-5",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop",
    prompt: "Forest with morning mist slowly moving",
    mode: "video",
    featureName: "Create Video",
    model: "Runway Gen-3",
    status: "ready",
    createdAt: "2024-01-13T09:00:00Z",
    version: 1,
  },
  {
    id: "item-6",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
    prompt: "Waterfall in tropical forest with gentle motion",
    mode: "video",
    featureName: "Image to Video",
    model: "Kling",
    status: "generating",
    createdAt: "2024-01-12T11:00:00Z",
    version: 1,
  },
  {
    id: "item-7",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop",
    prompt: "Add a wooden cabin by the lake",
    mode: "edit",
    featureName: "Draw to Edit",
    model: "FLUX.1 Fill",
    status: "error",
    createdAt: "2024-01-11T14:30:00Z",
    version: 1,
  },
  {
    id: "item-8",
    boardId: "board-1",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    prompt: "Professional portrait of a young entrepreneur",
    mode: "character",
    featureName: "Create Character",
    model: "FLUX.1 Pro",
    status: "ready",
    createdAt: "2024-01-10T16:00:00Z",
    version: 1,
  },
];

// Board context for Studio
export interface BoardContext {
  currentBoardId: string | null;
  currentBoardTitle: string | null;
}

// Get board by ID
export function getBoardById(id: string): Board | undefined {
  return mockBoards.find(board => board.id === id);
}

// Get items for a board
export function getBoardItems(boardId: string): BoardItem[] {
  return mockBoardItems.filter(item => item.boardId === boardId);
}
