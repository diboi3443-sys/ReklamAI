#!/usr/bin/env node
/**
 * Smoke Test: Check KIE.ai model support
 * Tests each model in DB with minimal payload to verify KIE API support
 */

import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.smoke") });
config({ path: resolve(process.cwd(), ".env") });
import { createClient } from "@supabase/supabase-js";

// Auto-fill EDGE_BASE_URL from SUPABASE_URL if not set
if (!process.env.EDGE_BASE_URL && process.env.SUPABASE_URL) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match) {
    const projectRef = match[1];
    process.env.EDGE_BASE_URL = `https://${projectRef}.supabase.co/functions/v1`;
  }
}

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  TEST_EMAIL,
  TEST_PASSWORD,
  EDGE_BASE_URL,
} = process.env;

if (!SUPABASE_URL || !EDGE_BASE_URL) {
  console.error("❌ Missing required environment variables: SUPABASE_URL, EDGE_BASE_URL");
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");
  process.exit(1);
}

interface ModelTestResult {
  key: string;
  model_identifier: string;
  modality: string;
  family: string;
  status: "supported" | "failed" | "skipped";
  error_code?: number;
  error_message?: string;
  requires_input: boolean;
  test_duration_ms?: number;
}

const results: ModelTestResult[] = [];

// Authenticate user
async function authenticateUser(): Promise<string> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("TEST_EMAIL and TEST_PASSWORD required");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

  if (signInError) {
    // Try signup
    await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (result.error || !result.data.user || !result.data.session) {
      throw new Error("Authentication failed");
    }
    signInData = result.data;
  }

  if (!signInData?.user || !signInData?.session) {
    throw new Error("Authentication failed");
  }

  // Ensure credit account
  await supabase.from("credit_accounts").upsert(
    {
      owner_id: signInData.user.id,
      balance: 10000, // Large balance for testing
    },
    {
      onConflict: "owner_id",
    }
  );

  return signInData.session.access_token;
}

// Get first preset for modality
async function getPresetForModality(
  token: string,
  modality: string
): Promise<string | null> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: presets } = await supabase
    .from("presets")
    .select("key")
    .eq("type", modality)
    .limit(1);

  return presets && presets.length > 0 ? presets[0].key : null;
}

// Test a single model
async function testModel(
  token: string,
  model: any,
  presetKey: string | null
): Promise<ModelTestResult> {
  const startTime = Date.now();
  const result: ModelTestResult = {
    key: model.key,
    model_identifier: model.capabilities?.model_identifier || model.key,
    modality: model.modality,
    family: model.capabilities?.family || "market",
    status: "skipped",
    requires_input: model.capabilities?.requires_input || false,
  };

  // Skip if requires input and we don't have test files
  if (result.requires_input) {
    result.status = "skipped";
    result.error_message = "Requires input file (skipped)";
    return result;
  }

  // Skip if no preset available
  if (!presetKey) {
    result.status = "skipped";
    result.error_message = "No preset available for modality";
    return result;
  }

  try {
    const payload = {
      presetKey,
      modelKey: model.key,
      prompt: "Test image: a red apple",
    };

    const response = await fetch(`${EDGE_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    result.test_duration_ms = Date.now() - startTime;

    if (response.ok && data.generationId) {
      result.status = "supported";
    } else {
      result.status = "failed";
      result.error_code = response.status;
      result.error_message =
        data.message || data.error || `HTTP ${response.status}`;

      // If 422, it's a model support issue
      if (response.status === 422 || data.code === 422) {
        result.error_message = `Model not supported: ${result.error_message}`;
      }
    }
  } catch (error: any) {
    result.status = "failed";
    result.error_message = error.message || "Unknown error";
    result.test_duration_ms = Date.now() - startTime;
  }

  return result;
}

// Main execution
async function main() {
  console.log("🧪 KIE.ai Models Support Test");
  console.log("=".repeat(60));

  // Authenticate
  console.log("\n📝 Authenticating...");
  const token = await authenticateUser();
  console.log("✅ Authenticated\n");

  // Load all KIE models from DB
  // Use ANON_KEY if SERVICE_ROLE_KEY not available (RLS allows public read for models)
  const dbKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!dbKey) {
    console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, dbKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("🔍 Loading models from database...");
  const { data: models, error } = await supabase
    .from("models")
    .select("*")
    .eq("provider", "kie")
    .order("modality")
    .order("title");

  if (error) {
    console.error(`❌ Error loading models: ${error.message}`);
    process.exit(1);
  }

  if (!models || models.length === 0) {
    console.error("❌ No KIE models found in database");
    process.exit(1);
  }

  console.log(`✅ Found ${models.length} KIE models\n`);

  // Group by modality and get presets
  const modalityPresets: Record<string, string | null> = {};
  for (const model of models) {
    if (!modalityPresets[model.modality]) {
      modalityPresets[model.modality] = await getPresetForModality(
        token,
        model.modality
      );
    }
  }

  // Test each model
  console.log("🚀 Testing models...\n");
  let tested = 0;
  let supported = 0;
  let failed = 0;
  let skipped = 0;

  for (const model of models) {
    tested++;
    const presetKey = modalityPresets[model.modality];
    const result = await testModel(token, model, presetKey);

    results.push(result);

    if (result.status === "supported") {
      supported++;
      console.log(`  ✅ ${model.key} (${result.model_identifier})`);
    } else if (result.status === "failed") {
      failed++;
      console.log(
        `  ❌ ${model.key} (${result.model_identifier}): ${result.error_message}`
      );
    } else {
      skipped++;
      console.log(`  ⏭️  ${model.key} (${result.model_identifier}): skipped`);
    }

    // Rate limiting: wait 500ms between tests
    if (tested < models.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Save report
  const reportsDir = join(process.cwd(), "reports");
  mkdirSync(reportsDir, { recursive: true });

  const reportPath = join(reportsDir, "kie-models-report.json");
  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      total: models.length,
      supported,
      failed,
      skipped,
    },
    results,
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total models:     ${models.length}`);
  console.log(`✅ Supported:     ${supported}`);
  console.log(`❌ Failed:        ${failed}`);
  console.log(`⏭️  Skipped:       ${skipped}`);
  console.log(`\n💾 Report saved to: ${reportPath}`);

  if (failed > 0) {
    console.log("\n❌ Failed models:");
    results
      .filter((r) => r.status === "failed")
      .forEach((r) => {
        console.log(`  - ${r.key} (${r.model_identifier})`);
        console.log(`    Error: ${r.error_message}`);
      });
  }

  console.log("=".repeat(60));
}

main().catch(console.error);
