#!/usr/bin/env node
/**
 * KIE.ai Models Scraper
 * Extracts model information from KIE.ai documentation pages
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// List of documentation URLs to scrape
const DOCS_URLS = [
  // Market API Quickstart
  "https://docs.kie.ai/market/quickstart",

  // Seedream models
  "https://docs.kie.ai/market/seedream/seedream",
  "https://docs.kie.ai/market/seedream/seedream-v4-text-to-image",
  "https://docs.kie.ai/market/seedream/seedream-v4-edit",
  "https://docs.kie.ai/market/seedream/4.5-text-to-image",
  "https://docs.kie.ai/market/seedream/4.5-edit",

  // Z-Image
  "https://docs.kie.ai/market/z-image/z-image",

  // Google models
  "https://docs.kie.ai/market/google/imagen4-fast",
  "https://docs.kie.ai/market/google/imagen4-ultra",
  "https://docs.kie.ai/market/google/imagen4",
  "https://docs.kie.ai/market/google/nano-banana-edit",
  "https://docs.kie.ai/market/google/nano-banana",
  "https://docs.kie.ai/market/google/pro-image-to-image",

  // Flux2 models
  "https://docs.kie.ai/market/flux2/pro-image-to-image",
  "https://docs.kie.ai/market/flux2/pro-text-to-image",
  "https://docs.kie.ai/market/flux2/flex-image-to-image",
  "https://docs.kie.ai/market/flux2/flex-text-to-image",

  // Grok Imagine
  "https://docs.kie.ai/market/grok-imagine/text-to-image",
  "https://docs.kie.ai/market/grok-imagine/image-to-image",
  "https://docs.kie.ai/market/grok-imagine/upscale",
  "https://docs.kie.ai/market/grok-imagine/text-to-video",
  "https://docs.kie.ai/market/grok-imagine/image-to-video",

  // GPT Image
  "https://docs.kie.ai/market/gpt-image/1.5-text-to-image",
  "https://docs.kie.ai/market/gpt-image/1.5-image-to-image",

  // Topaz
  "https://docs.kie.ai/market/topaz/image-upscale",
  "https://docs.kie.ai/market/topaz/video-upscale",

  // Recraft
  "https://docs.kie.ai/market/recraft/remove-background",
  "https://docs.kie.ai/market/recraft/crisp-upscale",

  // Ideogram
  "https://docs.kie.ai/market/ideogram/v3-reframe",
  "https://docs.kie.ai/market/ideogram/character-edit",
  "https://docs.kie.ai/market/ideogram/character-remix",
  "https://docs.kie.ai/market/ideogram/character",

  // Kling models
  "https://docs.kie.ai/market/kling/text-to-video",
  "https://docs.kie.ai/market/kling/image-to-video",
  "https://docs.kie.ai/market/kling/ai-avatar-v1-pro",
  "https://docs.kie.ai/market/kling/v1-avatar-standard",
  "https://docs.kie.ai/market/kling/v2-1-master-image-to-video",
  "https://docs.kie.ai/market/kling/v2-1-master-text-to-video",
  "https://docs.kie.ai/market/kling/v2-1-pro",
  "https://docs.kie.ai/market/kling/v2-1-standard",
  "https://docs.kie.ai/market/kling/motion-control",

  // ByteDance
  "https://docs.kie.ai/market/bytedance/seedance-1.5-pro",
  "https://docs.kie.ai/market/bytedance/v1-pro-fast-image-to-video",
  "https://docs.kie.ai/market/bytedance/v1-pro-image-to-video",
  "https://docs.kie.ai/market/bytedance/v1-pro-text-to-video",
  "https://docs.kie.ai/market/bytedance/v1-lite-image-to-video",
  "https://docs.kie.ai/market/bytedance/v1-lite-text-to-video",

  // Hailuo
  "https://docs.kie.ai/market/hailuo/2-3-image-to-video-pro",
  "https://docs.kie.ai/market/hailuo/2-3-image-to-video-standard",
  "https://docs.kie.ai/market/hailuo/02-text-to-video-pro",
  "https://docs.kie.ai/market/hailuo/02-text-to-video-standard",
  "https://docs.kie.ai/market/hailuo/02-image-to-video-pro",
  "https://docs.kie.ai/market/hailuo/02-image-to-video-standard",

  // Sora2
  "https://docs.kie.ai/market/sora2/sora-2-image-to-video",
  "https://docs.kie.ai/market/sora2/sora-2-text-to-video",
  "https://docs.kie.ai/market/sora2/sora-2-pro-image-to-video",
  "https://docs.kie.ai/market/sora2/sora-2-pro-text-to-video",
  "https://docs.kie.ai/market/sora2/sora-watermark-remover",
  "https://docs.kie.ai/market/sora-2-pro-storyboard",
  "https://docs.kie.ai/market/sora2/sora-2-characters",

  // Wan
  "https://docs.kie.ai/market/wan/2-6-image-to-video",
  "https://docs.kie.ai/market/wan/2-6-text-to-video",
  "https://docs.kie.ai/market/wan/2-6-video-to-video",
  "https://docs.kie.ai/market/wan/2-2-a14b-image-to-video-turbo",
  "https://docs.kie.ai/market/wan/2-2-a14b-text-to-video-turbo",
  "https://docs.kie.ai/market/wan/2-2-animate-move",
  "https://docs.kie.ai/market/wan/2-2-animate-replace",
  "https://docs.kie.ai/market/wan/2-2-a14b-speech-to-video-turbo",

  // Audio
  "https://docs.kie.ai/market/infinitalk/from-audio",
  "https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2",
  "https://docs.kie.ai/market/elevenlabs/speech-to-text",
  "https://docs.kie.ai/market/elevenlabs/sound-effect-v2",
  "https://docs.kie.ai/market/elevenlabs/audio-isolation",

  // Other API families
  "https://docs.kie.ai/veo3-api/quickstart",
  "https://docs.kie.ai/veo3-api/generate-veo-3-video",
  "https://docs.kie.ai/4o-image-api/quickstart",
  "https://docs.kie.ai/4o-image-api/generate-4-o-image",
  "https://docs.kie.ai/flux-kontext-api/quickstart",
  "https://docs.kie.ai/flux-kontext-api/generate-or-edit-image",
  "https://docs.kie.ai/runway-api/quickstart",
  "https://docs.kie.ai/runway-api/generate-ai-video",
  "https://docs.kie.ai/luma-api/quickstart",
  "https://docs.kie.ai/luma-api/generate-luma-modify-video",
];

interface ModelRecord {
  key: string;                    // Unique key (e.g., "flux2-pro-text-to-image")
  provider: "kie";
  modality: "image" | "video" | "edit" | "audio" | "upscale" | "remove-bg" | "lipsync";
  family: "market" | "veo3" | "4o-image" | "runway" | "luma" | "flux-kontext";
  model_identifier: string;       // Exact identifier KIE accepts (e.g., "flux2/pro-text-to-image")
  display_name: string;           // Human-readable name
  requires_input: boolean;         // Whether model requires input file
  input_kinds: string[];          // ["image", "video", "audio", "start_frame", "end_frame"]
  default_params?: Record<string, any>;
  docs_url: string;
  is_enabled: boolean;
  needs_manual?: boolean;         // If extraction failed, needs manual review
  extraction_notes?: string;      // Notes about extraction
}

const extractedModels: ModelRecord[] = [];
const needsManual: Array<{ url: string; reason: string }> = [];

/**
 * Extract model identifier from HTML/text
 * Looks for patterns like: "model": "...", modelName, model_id, etc.
 */
function extractModelIdentifier(html: string, url: string): string | null {
  // Try to find in code blocks (JSON examples)
  const jsonMatches = html.match(/"model"\s*:\s*"([^"]+)"/gi);
  if (jsonMatches) {
    for (const match of jsonMatches) {
      const modelMatch = match.match(/"model"\s*:\s*"([^"]+)"/i);
      if (modelMatch && modelMatch[1]) {
        return modelMatch[1];
      }
    }
  }

  // Try modelName
  const modelNameMatches = html.match(/"modelName"\s*:\s*"([^"]+)"/gi);
  if (modelNameMatches) {
    for (const match of modelNameMatches) {
      const modelMatch = match.match(/"modelName"\s*:\s*"([^"]+)"/i);
      if (modelMatch && modelMatch[1]) {
        return modelMatch[1];
      }
    }
  }

  // Try to extract from URL path (fallback)
  const urlMatch = url.match(/market\/([^\/]+(?:\/[^\/]+)?)$/);
  if (urlMatch) {
    return urlMatch[1].replace(/\//g, "/");
  }

  return null;
}

/**
 * Determine modality from URL and content
 */
function determineModality(url: string, html: string): ModelRecord["modality"] {
  const urlLower = url.toLowerCase();
  const htmlLower = html.toLowerCase();

  if (urlLower.includes("video") || htmlLower.includes("video generation")) {
    return "video";
  }
  if (urlLower.includes("audio") || htmlLower.includes("audio") || htmlLower.includes("speech") || htmlLower.includes("tts")) {
    return "audio";
  }
  if (urlLower.includes("upscale") || htmlLower.includes("upscale")) {
    return "upscale";
  }
  if (urlLower.includes("remove-background") || htmlLower.includes("remove background")) {
    return "remove-bg";
  }
  if (urlLower.includes("edit") || urlLower.includes("image-to-image") || htmlLower.includes("edit")) {
    return "edit";
  }
  if (urlLower.includes("text-to-image") || urlLower.includes("image")) {
    return "image";
  }

  return "image"; // Default
}

/**
 * Determine API family from URL
 */
function determineFamily(url: string): ModelRecord["family"] {
  if (url.includes("/veo3-api/")) return "veo3";
  if (url.includes("/4o-image-api/")) return "4o-image";
  if (url.includes("/runway-api/")) return "runway";
  if (url.includes("/luma-api/")) return "luma";
  if (url.includes("/flux-kontext-api/")) return "flux-kontext";
  return "market"; // Default
}

/**
 * Extract required input fields from content
 */
function extractInputKinds(html: string, url: string): string[] {
  const kinds: string[] = [];
  const htmlLower = html.toLowerCase();

  if (htmlLower.includes("image_url") || htmlLower.includes("image input") || url.includes("image-to-")) {
    kinds.push("image");
  }
  if (htmlLower.includes("video_url") || htmlLower.includes("video input") || url.includes("video-to-")) {
    kinds.push("video");
  }
  if (htmlLower.includes("audio_url") || htmlLower.includes("audio input") || htmlLower.includes("speech")) {
    kinds.push("audio");
  }
  if (htmlLower.includes("start_frame") || htmlLower.includes("start frame")) {
    kinds.push("start_frame");
  }
  if (htmlLower.includes("end_frame") || htmlLower.includes("end frame")) {
    kinds.push("end_frame");
  }

  return kinds;
}

/**
 * Generate key from model identifier or URL
 */
function generateKey(modelIdentifier: string | null, url: string): string {
  if (modelIdentifier) {
    return modelIdentifier.replace(/\//g, "-").replace(/[^a-z0-9-]/gi, "-");
  }

  // Fallback: extract from URL
  const urlMatch = url.match(/\/([^\/]+(?:\/[^\/]+)?)$/);
  if (urlMatch) {
    return urlMatch[1].replace(/\//g, "-");
  }

  return `model-${Date.now()}`;
}

/**
 * Extract display name from HTML
 */
function extractDisplayName(html: string, url: string, modelIdentifier: string | null): string {
  // Try to find h1 or title
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].trim();
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].replace(/ - KIE.ai.*$/i, "").trim();
  }

  // Fallback: format model identifier
  if (modelIdentifier) {
    return modelIdentifier
      .split("/")
      .map(part => part.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))
      .join(" ");
  }

  return "Unknown Model";
}

/**
 * Scrape a single documentation page
 */
async function scrapePage(url: string): Promise<void> {
  try {
    console.log(`  📄 Scraping: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`    ⚠️  Failed to fetch: ${response.status}`);
      needsManual.push({ url, reason: `HTTP ${response.status}` });
      return;
    }

    const html = await response.text();

    // Extract model identifier
    const modelIdentifier = extractModelIdentifier(html, url);

    if (!modelIdentifier) {
      console.warn(`    ⚠️  Could not extract model identifier`);
      needsManual.push({
        url,
        reason: "Could not extract model identifier from page"
      });
      return;
    }

    // Determine properties
    const modality = determineModality(url, html);
    const family = determineFamily(url);
    const inputKinds = extractInputKinds(html, url);
    const key = generateKey(modelIdentifier, url);
    const displayName = extractDisplayName(html, url, modelIdentifier);

    const model: ModelRecord = {
      key,
      provider: "kie",
      modality,
      family,
      model_identifier: modelIdentifier,
      display_name: displayName,
      requires_input: inputKinds.length > 0,
      input_kinds: inputKinds,
      docs_url: url,
      is_enabled: true,
    };

    extractedModels.push(model);
    console.log(`    ✅ Extracted: ${modelIdentifier} (${modality}, ${family})`);

  } catch (error: any) {
    console.error(`    ❌ Error scraping ${url}:`, error.message);
    needsManual.push({ url, reason: error.message });
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🔍 KIE.ai Models Scraper");
  console.log("=".repeat(60));
  console.log(`📋 Processing ${DOCS_URLS.length} documentation pages...\n`);

  // Scrape all pages (with rate limiting)
  for (let i = 0; i < DOCS_URLS.length; i++) {
    await scrapePage(DOCS_URLS[i]);

    // Rate limiting: wait 200ms between requests
    if (i < DOCS_URLS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Extracted ${extractedModels.length} models`);
  console.log(`⚠️  ${needsManual.length} pages need manual review\n`);

  // Save results
  const outputDir = join(process.cwd(), "supabase", "seed");
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, "kie_models.generated.json");
  writeFileSync(outputPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    models: extractedModels,
    needs_manual: needsManual,
  }, null, 2));

  console.log(`💾 Saved to: ${outputPath}`);

  if (needsManual.length > 0) {
    console.log("\n📋 Pages needing manual review:");
    needsManual.forEach(({ url, reason }) => {
      console.log(`  - ${url}`);
      console.log(`    Reason: ${reason}`);
    });
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
