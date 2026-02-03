import * as React from "react";
import { Sparkles, Flame, TrendingUp, Wand2, Users, Star, Zap } from "lucide-react";

// Preset Categories
export type PresetCategory = "all" | "new" | "viral" | "effects" | "ugc";

export interface PresetCategoryInfo {
  id: PresetCategory;
  labelKey: string; // i18n key
  icon: React.ElementType;
}

export const presetCategories: PresetCategoryInfo[] = [
  { id: "all", labelKey: "all", icon: Sparkles },
  { id: "new", labelKey: "new", icon: Zap },
  { id: "viral", labelKey: "viral", icon: Flame },
  { id: "effects", labelKey: "effects", icon: Wand2 },
  { id: "ugc", labelKey: "ugc", icon: Users },
];

// Preset badge types
export type PresetBadge = "HOT" | "NEW" | "TOP" | "VIRAL";

// Preset definition
export interface Preset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  badges?: PresetBadge[];
  thumbnail: string;
  // Template settings that get auto-applied
  promptTemplate?: string;
  motionPreset?: string;
  cameraPreset?: string;
  stylePreset?: string;
  // Compatible features (which features can use this preset)
  compatibleFeatures: string[];
  // Default model for this preset
  defaultModel?: string;
}

// Mock preset thumbnails
const presetImages = {
  dynamicZoom: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=225&fit=crop",
  cinematicPan: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
  productShowcase: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=225&fit=crop",
  ugcTestimonial: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=225&fit=crop",
  viralHook: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=225&fit=crop",
  smoothGlide: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=225&fit=crop",
  explosiveReveal: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop",
  softFocus: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=225&fit=crop",
  energeticBurst: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop",
  elegantSlow: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=225&fit=crop",
  trendingStyle: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop",
  reelsMagic: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop",
};

// Presets organized by what they do (creative templates)
export const presets: Preset[] = [
  // NEW presets
  {
    id: "dynamic-zoom",
    name: "Dynamic Zoom",
    description: "Smooth zoom in/out with cinematic feel",
    category: "new",
    badges: ["NEW", "HOT"],
    thumbnail: presetImages.dynamicZoom,
    promptTemplate: "cinematic smooth zoom, dynamic camera movement",
    motionPreset: "zoom-smooth",
    cameraPreset: "dolly-in",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Runway Gen-3",
  },
  {
    id: "cinematic-pan",
    name: "Cinematic Pan",
    description: "Hollywood-style horizontal camera movement",
    category: "new",
    badges: ["NEW"],
    thumbnail: presetImages.cinematicPan,
    promptTemplate: "cinematic horizontal pan, smooth tracking shot",
    motionPreset: "pan-horizontal",
    cameraPreset: "tracking",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Kling Pro",
  },
  
  // VIRAL presets
  {
    id: "viral-hook",
    name: "Viral Hook",
    description: "Attention-grabbing opener for social media",
    category: "viral",
    badges: ["VIRAL", "TOP"],
    thumbnail: presetImages.viralHook,
    promptTemplate: "dynamic energetic motion, attention-grabbing, social media style",
    motionPreset: "fast-punch",
    cameraPreset: "shake-light",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Minimax",
  },
  {
    id: "reels-magic",
    name: "Reels Magic",
    description: "Perfect for Instagram Reels & TikTok",
    category: "viral",
    badges: ["VIRAL"],
    thumbnail: presetImages.reelsMagic,
    promptTemplate: "vertical video, trendy social media style, engaging motion",
    motionPreset: "bounce-rhythm",
    cameraPreset: "handheld-light",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Pika",
  },
  {
    id: "trending-style",
    name: "Trending Style",
    description: "Current trending motion patterns",
    category: "viral",
    badges: ["HOT"],
    thumbnail: presetImages.trendingStyle,
    promptTemplate: "trendy motion, viral style, contemporary aesthetic",
    motionPreset: "trend-wave",
    cameraPreset: "dynamic",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Runway Gen-3",
  },
  
  // EFFECTS presets
  {
    id: "explosive-reveal",
    name: "Explosive Reveal",
    description: "Dramatic reveal with particle effects",
    category: "effects",
    badges: ["TOP"],
    thumbnail: presetImages.explosiveReveal,
    promptTemplate: "dramatic reveal, particle explosion, epic motion",
    motionPreset: "explode-out",
    cameraPreset: "push-in",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Runway Gen-3",
  },
  {
    id: "soft-focus",
    name: "Soft Focus",
    description: "Dreamy blur transitions",
    category: "effects",
    badges: ["NEW"],
    thumbnail: presetImages.softFocus,
    promptTemplate: "soft focus, dreamy blur, gentle motion",
    motionPreset: "gentle-float",
    cameraPreset: "slow-drift",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Kling",
  },
  {
    id: "energetic-burst",
    name: "Energetic Burst",
    description: "High-energy motion with quick cuts",
    category: "effects",
    badges: ["HOT"],
    thumbnail: presetImages.energeticBurst,
    promptTemplate: "energetic burst, fast motion, dynamic cuts",
    motionPreset: "burst-quick",
    cameraPreset: "shake-intense",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Minimax",
  },
  {
    id: "elegant-slow",
    name: "Elegant Slow",
    description: "Luxurious slow-motion effect",
    category: "effects",
    thumbnail: presetImages.elegantSlow,
    promptTemplate: "elegant slow motion, luxurious feel, smooth movement",
    motionPreset: "slow-mo",
    cameraPreset: "steady-glide",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Kling Pro",
  },
  
  // UGC presets
  {
    id: "ugc-testimonial",
    name: "UGC Testimonial",
    description: "Authentic user-generated content style",
    category: "ugc",
    badges: ["TOP"],
    thumbnail: presetImages.ugcTestimonial,
    promptTemplate: "authentic UGC style, natural lighting, genuine feel",
    motionPreset: "handheld-natural",
    cameraPreset: "selfie-angle",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Pika",
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    description: "Clean product demonstration style",
    category: "ugc",
    badges: ["NEW"],
    thumbnail: presetImages.productShowcase,
    promptTemplate: "clean product showcase, professional lighting, clear demonstration",
    motionPreset: "rotate-smooth",
    cameraPreset: "orbit",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Runway Gen-3",
  },
  {
    id: "smooth-glide",
    name: "Smooth Glide",
    description: "Buttery smooth camera movement",
    category: "ugc",
    thumbnail: presetImages.smoothGlide,
    promptTemplate: "smooth gliding motion, stable camera, professional feel",
    motionPreset: "glide-steady",
    cameraPreset: "gimbal",
    compatibleFeatures: ["create-video", "image-to-video"],
    defaultModel: "Kling",
  },
];

// Get presets by category
export function getPresetsByCategory(category: PresetCategory): Preset[] {
  if (category === "all") {
    return presets;
  }
  return presets.filter(p => p.category === category);
}

// Get presets compatible with a feature
export function getPresetsForFeature(featureId: string): Preset[] {
  return presets.filter(p => p.compatibleFeatures.includes(featureId));
}

// Get badge variant for styling
export function getPresetBadgeVariant(badge: PresetBadge) {
  switch (badge) {
    case "HOT":
      return "destructive" as const;
    case "NEW":
      return "info" as const;
    case "TOP":
      return "gradient" as const;
    case "VIRAL":
      return "success" as const;
  }
}
