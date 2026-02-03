import * as React from "react";
import {
  Image,
  Video,
  Wand2,
  UserCircle,
  Paintbrush,
  Clapperboard,
  Sparkles,
  Star,
  Zap,
  TrendingUp,
} from "lucide-react";

// Mode definitions
export type ModeId = "image" | "video" | "edit" | "character" | "inpaint" | "cinema";

export interface Mode {
  id: ModeId;
  name: string;
  icon: React.ElementType;
  description: string;
}

export const modes: Mode[] = [
  { id: "image", name: "Image", icon: Image, description: "Generate images" },
  { id: "video", name: "Video", icon: Video, description: "Generate videos" },
  { id: "edit", name: "Edit", icon: Wand2, description: "AI-powered editing" },
  { id: "character", name: "Character", icon: UserCircle, description: "Character generation" },
  { id: "inpaint", name: "Inpaint", icon: Paintbrush, description: "Inpaint & outpaint" },
  { id: "cinema", name: "Cinema Studio", icon: Clapperboard, description: "Cinematic creations" },
];

// Feature definitions
export type FeatureBadge = "TOP" | "NEW" | "BEST";

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badges?: FeatureBadge[];
  requiredInputs: ("prompt" | "image" | "video" | "mask" | "reference" | "audio")[];
  editorTools: ("crop" | "inpaint" | "relight" | "motion" | "upscale" | "mask")[];
  supportedModels: string[];
  defaultModel: string;
  baseCost: number;
}

export interface FeaturesByMode {
  [key: string]: Feature[];
}

export const featuresByMode: FeaturesByMode = {
  image: [
    {
      id: "create-image",
      name: "Create Image",
      description: "Generate images from text prompts",
      icon: Sparkles,
      badges: ["TOP"],
      requiredInputs: ["prompt"],
      editorTools: ["crop", "upscale"],
      supportedModels: ["FLUX.1 Pro", "FLUX.1 Dev", "SDXL", "Midjourney"],
      defaultModel: "FLUX.1 Pro",
      baseCost: 1,
    },
    {
      id: "cinema-image",
      name: "Cinema Studio Image",
      description: "Cinematic quality image generation",
      icon: Clapperboard,
      badges: ["BEST"],
      requiredInputs: ["prompt", "reference"],
      editorTools: ["crop", "relight", "upscale"],
      supportedModels: ["FLUX.1 Pro", "Midjourney"],
      defaultModel: "FLUX.1 Pro",
      baseCost: 2,
    },
    {
      id: "relight",
      name: "Relight",
      description: "Change lighting in existing images",
      icon: Zap,
      badges: ["NEW"],
      requiredInputs: ["image", "prompt"],
      editorTools: ["relight"],
      supportedModels: ["IC-Light", "FLUX.1 Dev"],
      defaultModel: "IC-Light",
      baseCost: 1,
    },
    {
      id: "image-upscale",
      name: "Image Upscale",
      description: "Enhance resolution and details",
      icon: TrendingUp,
      requiredInputs: ["image"],
      editorTools: ["upscale"],
      supportedModels: ["Real-ESRGAN", "Topaz"],
      defaultModel: "Real-ESRGAN",
      baseCost: 0.5,
    },
    {
      id: "face-swap",
      name: "Face Swap",
      description: "Swap faces in images",
      icon: UserCircle,
      requiredInputs: ["image", "reference"],
      editorTools: ["mask"],
      supportedModels: ["InsightFace", "FaceSwap Pro"],
      defaultModel: "InsightFace",
      baseCost: 1,
    },
  ],
  video: [
    {
      id: "create-video",
      name: "Create Video",
      description: "Generate videos from text or image",
      icon: Video,
      badges: ["TOP"],
      requiredInputs: ["prompt"],
      editorTools: ["crop", "motion"],
      supportedModels: ["Runway Gen-3", "Kling", "Pika", "Minimax"],
      defaultModel: "Runway Gen-3",
      baseCost: 5,
    },
    {
      id: "image-to-video",
      name: "Image to Video",
      description: "Animate a static image",
      icon: Sparkles,
      badges: ["BEST"],
      requiredInputs: ["image", "prompt"],
      editorTools: ["motion", "crop"],
      supportedModels: ["Runway Gen-3", "Kling", "Pika"],
      defaultModel: "Runway Gen-3",
      baseCost: 5,
    },
    {
      id: "video-extend",
      name: "Video Extend",
      description: "Extend video duration with AI",
      icon: TrendingUp,
      badges: ["NEW"],
      requiredInputs: ["video", "prompt"],
      editorTools: ["motion"],
      supportedModels: ["Runway Gen-3", "Kling"],
      defaultModel: "Runway Gen-3",
      baseCost: 8,
    },
  ],
  edit: [
    {
      id: "draw-to-edit",
      name: "Draw to Edit",
      description: "Sketch changes and AI fills in",
      icon: Paintbrush,
      badges: ["NEW"],
      requiredInputs: ["image", "mask", "prompt"],
      editorTools: ["mask", "inpaint"],
      supportedModels: ["FLUX.1 Fill", "SDXL Inpaint"],
      defaultModel: "FLUX.1 Fill",
      baseCost: 1,
    },
    {
      id: "photodump",
      name: "Photodump Studio",
      description: "Batch process multiple images",
      icon: Image,
      requiredInputs: ["image", "prompt"],
      editorTools: ["crop", "upscale"],
      supportedModels: ["FLUX.1 Dev", "SDXL"],
      defaultModel: "FLUX.1 Dev",
      baseCost: 0.5,
    },
    {
      id: "fashion-factory",
      name: "Fashion Factory",
      description: "Virtual try-on and fashion editing",
      icon: Star,
      badges: ["BEST"],
      requiredInputs: ["image", "reference"],
      editorTools: ["mask"],
      supportedModels: ["Virtual Try-On", "Fashion AI"],
      defaultModel: "Virtual Try-On",
      baseCost: 2,
    },
  ],
  character: [
    {
      id: "character-create",
      name: "Create Character",
      description: "Generate consistent characters",
      icon: UserCircle,
      badges: ["TOP"],
      requiredInputs: ["prompt", "reference"],
      editorTools: ["crop"],
      supportedModels: ["FLUX.1 Pro", "Midjourney"],
      defaultModel: "FLUX.1 Pro",
      baseCost: 2,
    },
    {
      id: "character-swap",
      name: "Character Swap",
      description: "Replace characters in scenes",
      icon: Wand2,
      requiredInputs: ["image", "reference"],
      editorTools: ["mask"],
      supportedModels: ["InsightFace", "Character AI"],
      defaultModel: "InsightFace",
      baseCost: 1.5,
    },
  ],
  inpaint: [
    {
      id: "inpaint-remove",
      name: "Remove & Fill",
      description: "Remove objects and fill background",
      icon: Paintbrush,
      badges: ["TOP"],
      requiredInputs: ["image", "mask"],
      editorTools: ["mask", "inpaint"],
      supportedModels: ["FLUX.1 Fill", "LaMa"],
      defaultModel: "FLUX.1 Fill",
      baseCost: 1,
    },
    {
      id: "inpaint-replace",
      name: "Replace Object",
      description: "Replace selected area with new content",
      icon: Wand2,
      requiredInputs: ["image", "mask", "prompt"],
      editorTools: ["mask", "inpaint"],
      supportedModels: ["FLUX.1 Fill", "SDXL Inpaint"],
      defaultModel: "FLUX.1 Fill",
      baseCost: 1,
    },
  ],
  cinema: [
    {
      id: "storyboard",
      name: "Create Storyboard",
      description: "Generate visual storyboards",
      icon: Clapperboard,
      badges: ["BEST"],
      requiredInputs: ["prompt"],
      editorTools: ["crop"],
      supportedModels: ["FLUX.1 Pro", "Midjourney"],
      defaultModel: "FLUX.1 Pro",
      baseCost: 3,
    },
    {
      id: "cinema-video",
      name: "Cinema Video",
      description: "Cinematic video generation",
      icon: Video,
      badges: ["NEW"],
      requiredInputs: ["prompt", "reference"],
      editorTools: ["motion", "crop"],
      supportedModels: ["Runway Gen-3", "Kling Pro"],
      defaultModel: "Runway Gen-3",
      baseCost: 10,
    },
  ],
};

// Model capability definitions
export interface ModelCapability {
  motion?: boolean;
  inpaint?: boolean;
  startEndFrame?: boolean;
  audio?: boolean;
  upscale?: boolean;
}

export interface Model {
  id: string;
  name: string;
  capabilities: ModelCapability;
  costMultiplier: number;
}

export const modelCapabilities: Record<string, Model> = {
  "FLUX.1 Pro": { id: "flux-pro", name: "FLUX.1 Pro", capabilities: { upscale: true }, costMultiplier: 1.5 },
  "FLUX.1 Dev": { id: "flux-dev", name: "FLUX.1 Dev", capabilities: { upscale: true }, costMultiplier: 1 },
  "FLUX.1 Fill": { id: "flux-fill", name: "FLUX.1 Fill", capabilities: { inpaint: true }, costMultiplier: 1 },
  "SDXL": { id: "sdxl", name: "SDXL", capabilities: {}, costMultiplier: 0.8 },
  "SDXL Inpaint": { id: "sdxl-inpaint", name: "SDXL Inpaint", capabilities: { inpaint: true }, costMultiplier: 0.8 },
  "Midjourney": { id: "midjourney", name: "Midjourney", capabilities: { upscale: true }, costMultiplier: 2 },
  "Runway Gen-3": { id: "runway", name: "Runway Gen-3", capabilities: { motion: true, startEndFrame: true }, costMultiplier: 1.5 },
  "Kling": { id: "kling", name: "Kling", capabilities: { motion: true, startEndFrame: true }, costMultiplier: 1.2 },
  "Kling Pro": { id: "kling-pro", name: "Kling Pro", capabilities: { motion: true, startEndFrame: true, audio: true }, costMultiplier: 2 },
  "Pika": { id: "pika", name: "Pika", capabilities: { motion: true }, costMultiplier: 1 },
  "Minimax": { id: "minimax", name: "Minimax", capabilities: { motion: true, audio: true }, costMultiplier: 1.3 },
  "IC-Light": { id: "ic-light", name: "IC-Light", capabilities: {}, costMultiplier: 0.8 },
  "Real-ESRGAN": { id: "esrgan", name: "Real-ESRGAN", capabilities: { upscale: true }, costMultiplier: 0.5 },
  "Topaz": { id: "topaz", name: "Topaz", capabilities: { upscale: true }, costMultiplier: 1 },
  "InsightFace": { id: "insightface", name: "InsightFace", capabilities: {}, costMultiplier: 0.8 },
  "FaceSwap Pro": { id: "faceswap", name: "FaceSwap Pro", capabilities: {}, costMultiplier: 1 },
  "LaMa": { id: "lama", name: "LaMa", capabilities: { inpaint: true }, costMultiplier: 0.5 },
  "Virtual Try-On": { id: "tryon", name: "Virtual Try-On", capabilities: {}, costMultiplier: 1.5 },
  "Fashion AI": { id: "fashion", name: "Fashion AI", capabilities: {}, costMultiplier: 1.2 },
  "Character AI": { id: "char-ai", name: "Character AI", capabilities: {}, costMultiplier: 1.5 },
};

// Aspect ratio options
export const aspectRatios = [
  { value: "1:1", label: "1:1", width: 1024, height: 1024 },
  { value: "16:9", label: "16:9", width: 1920, height: 1080 },
  { value: "9:16", label: "9:16", width: 1080, height: 1920 },
  { value: "4:3", label: "4:3", width: 1440, height: 1080 },
  { value: "3:4", label: "3:4", width: 1080, height: 1440 },
  { value: "21:9", label: "21:9", width: 2560, height: 1080 },
];

// Duration options for video
export const videoDurations = [
  { value: "5", label: "5 sec", multiplier: 1 },
  { value: "10", label: "10 sec", multiplier: 2 },
  { value: "15", label: "15 sec", multiplier: 3 },
];
