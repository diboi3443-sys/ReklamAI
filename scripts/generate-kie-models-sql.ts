#!/usr/bin/env node
/**
 * Generate SQL migration from KIE models registry JSON
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const registryPath = join(process.cwd(), "supabase", "seed", "kie_models_registry.json");
const outputPath = join(process.cwd(), "supabase", "migrations", "20240101000005_kie_models_from_registry.sql");

console.log("📂 Reading registry...");
const registry = JSON.parse(readFileSync(registryPath, "utf-8"));

console.log(`✅ Found ${registry.models.length} models`);

let sql = `-- Seed KIE.ai models from registry
-- Generated from: supabase/seed/kie_models_registry.json
-- Generated at: ${new Date().toISOString()}

-- Map modality: upscale/remove-bg -> edit for DB compatibility
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
`;

const values: string[] = [];

for (const model of registry.models) {
  // Map modality
  let dbModality: string;
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

  // Build capabilities JSON
  const capabilities = {
    model_identifier: model.model_identifier,
    family: model.family,
    requires_input: model.requires_input,
    input_kinds: model.input_kinds,
    docs_url: model.docs_url,
  };

  const capabilitiesJson = JSON.stringify(capabilities).replace(/'/g, "''");
  const titleEscaped = model.display_name.replace(/'/g, "''");
  const keyEscaped = model.key.replace(/'/g, "''");

  values.push(
    `('${model.provider}', '${keyEscaped}', '${dbModality}', '${titleEscaped}', '${capabilitiesJson}'::jsonb, 1.0)`
  );
}

sql += values.join(",\n");
sql += `
ON CONFLICT (key) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  title = EXCLUDED.title,
  modality = EXCLUDED.modality,
  price_multiplier = EXCLUDED.price_multiplier;
`;

writeFileSync(outputPath, sql);
console.log(`✅ Generated SQL migration: ${outputPath}`);
console.log(`   Total models: ${registry.models.length}`);
