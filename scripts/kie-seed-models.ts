#!/usr/bin/env node
/**
 * Seed KIE.ai models from registry JSON into Supabase database
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.smoke") });
config({ path: resolve(process.cwd(), ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
// Try different env var names for service role key
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("💡 Set SUPABASE_SERVICE_ROLE_KEY in .env or .env.smoke");
  console.error("💡 You can find it in Supabase Dashboard > Settings > API > service_role key");
  process.exit(1);
}

interface ModelRecord {
  key: string;
  provider: "kie";
  modality: "image" | "video" | "edit" | "audio" | "upscale" | "remove-bg" | "lipsync";
  family: "market" | "veo3" | "4o-image" | "runway" | "luma" | "flux-kontext";
  model_identifier: string;
  display_name: string;
  requires_input: boolean;
  input_kinds: string[];
  default_params?: Record<string, any>;
  docs_url: string;
  is_enabled: boolean;
}

interface Registry {
  version: string;
  generated_at: string;
  models: ModelRecord[];
}

async function main() {
  console.log("🌱 KIE.ai Models Seeder");
  console.log("=".repeat(60));

  // Load registry
  const registryPath = join(process.cwd(), "supabase", "seed", "kie_models_registry.json");
  console.log(`📂 Loading registry: ${registryPath}`);

  let registry: Registry;
  try {
    const registryContent = readFileSync(registryPath, "utf-8");
    registry = JSON.parse(registryContent);
  } catch (error: any) {
    console.error(`❌ Failed to load registry: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ Loaded ${registry.models.length} models from registry\n`);

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check if models table exists and has required columns
  console.log("🔍 Checking database schema...");
  const { data: tableInfo, error: tableError } = await supabase
    .from("models")
    .select("id")
    .limit(1);

  if (tableError && tableError.code === "PGRST116") {
    console.error("❌ Table 'models' does not exist. Run migrations first.");
    process.exit(1);
  }

  console.log("✅ Models table exists\n");

  // Seed models
  console.log("📥 Seeding models...");
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ key: string; error: string }> = [];

  for (const model of registry.models) {
    try {
      // Map modality: upscale/remove-bg -> edit for DB compatibility
      // DB only supports: image, video, edit, audio
      let dbModality: "image" | "video" | "edit" | "audio";
      if (model.modality === "image") {
        dbModality = "image";
      } else if (model.modality === "video") {
        dbModality = "video";
      } else if (model.modality === "audio") {
        dbModality = "audio";
      } else {
        // upscale, remove-bg, lipsync -> edit
        dbModality = "edit";
      }

      // Build capabilities JSONB
      const capabilities: Record<string, any> = {
        requires_input: model.requires_input,
        input_kinds: model.input_kinds,
        family: model.family,
        model_identifier: model.model_identifier,
        docs_url: model.docs_url,
      };

      // Upsert model (update if exists, insert if not)
      const { error } = await supabase
        .from("models")
        .upsert(
          {
            provider: model.provider,
            key: model.key,
            modality: dbModality,
            title: model.display_name,
            capabilities: capabilities,
            price_multiplier: 1.0, // Default, can be adjusted later
            // Note: is_enabled column might not exist, so we'll try to set it if column exists
          },
          {
            onConflict: "key",
          }
        );

      if (error) {
        // Try without is_enabled if column doesn't exist
        if (error.message.includes("is_enabled")) {
          const { error: error2 } = await supabase
            .from("models")
            .upsert(
              {
                provider: model.provider,
                key: model.key,
                modality: dbModality,
                title: model.display_name,
                capabilities: capabilities,
                price_multiplier: 1.0,
              },
              {
                onConflict: "key",
              }
            );

          if (error2) {
            console.error(`  ❌ ${model.key}: ${error2.message}`);
            errorCount++;
            errors.push({ key: model.key, error: error2.message });
            continue;
          }
        } else {
          console.error(`  ❌ ${model.key}: ${error.message}`);
          errorCount++;
          errors.push({ key: model.key, error: error.message });
          continue;
        }
      }

      successCount++;
      console.log(`  ✅ ${model.key} (${model.model_identifier})`);
    } catch (error: any) {
      console.error(`  ❌ ${model.key}: ${error.message}`);
      errorCount++;
      errors.push({ key: model.key, error: error.message });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Seeded: ${successCount} models`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} models`);
    console.log("\nErrors:");
    errors.forEach(({ key, error }) => {
      console.log(`  - ${key}: ${error}`);
    });
  }

  // Verify count
  const { count } = await supabase
    .from("models")
    .select("*", { count: "exact", head: true })
    .eq("provider", "kie");

  console.log(`\n📊 Total KIE models in database: ${count || 0}`);
  console.log("=".repeat(60));
  console.log("✅ Done!");
}

main().catch(console.error);
