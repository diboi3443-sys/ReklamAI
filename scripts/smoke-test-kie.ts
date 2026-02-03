#!/usr/bin/env node
/**
 * Smoke Test for KIE.ai Integration
 * Tests: generate function with KIE.ai models
 */

// Load environment variables from .env.smoke
import { config } from "dotenv";
import { resolve } from "path";

// Try to load .env.smoke first, then fallback to .env
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

// Validate required environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  TEST_EMAIL: process.env.TEST_EMAIL,
  TEST_PASSWORD: process.env.TEST_PASSWORD,
  EDGE_BASE_URL: process.env.EDGE_BASE_URL,
};

const missing = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error(
    "\n💡 Copy .env.smoke.example to .env.smoke and fill in the values"
  );
  process.exit(1);
}

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TEST_EMAIL,
  TEST_PASSWORD,
  EDGE_BASE_URL,
} = requiredEnvVars as Record<string, string>;

// Helper: Authenticate user
async function authenticateUser(): Promise<{ userId: string; token: string }> {
  console.log("\n📝 Authenticating user...");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: TEST_EMAIL!,
      password: TEST_PASSWORD!,
    });

  if (signInError) {
    // Try signup if user doesn't exist
    console.log("  → Attempting signup...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: TEST_EMAIL!,
        password: TEST_PASSWORD!,
      }
    );

    if (signUpError) {
      console.error(`  ❌ Signup failed: ${signUpError.message}`);
      process.exit(1);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL!,
      password: TEST_PASSWORD!,
    });

    if (result.error || !result.data.user || !result.data.session) {
      console.error(
        `  ❌ Signin failed: ${result.error?.message || "No user/session"}`
      );
      process.exit(1);
    }

    signInData = result.data;
  }

  if (!signInData?.user || !signInData?.session) {
    console.error("  ❌ Authentication failed");
    process.exit(1);
  }

  // Ensure credit account
  await supabase.from("credit_accounts").upsert(
    {
      owner_id: signInData.user.id,
      balance: 1000,
    },
    {
      onConflict: "owner_id",
    }
  );

  console.log(`  ✅ Authenticated as: ${signInData.user.email}`);
  return { userId: signInData.user.id, token: signInData.session.access_token };
}

// Helper: Get available models from DB
async function getAvailableModels(
  token: string
): Promise<
  Array<{ key: string; title: string; modality: string; provider: string }>
> {
  console.log("\n🔍 Fetching available models from database...");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: models, error } = await supabase
    .from("models")
    .select("key, title, modality, provider")
    .eq("provider", "kie")
    .order("modality")
    .order("title");

  if (error) {
    console.error(`  ❌ Error fetching models: ${error.message}`);
    process.exit(1);
  }

  if (!models || models.length === 0) {
    console.error("  ❌ No KIE models found in database");
    console.error(
      "  → Run migration: supabase/migrations/20240101000003_kie_models.sql"
    );
    process.exit(1);
  }

  console.log(`  ✅ Found ${models.length} KIE models`);
  return models;
}

// Helper: Get first image preset
async function getFirstPreset(token: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: presets, error } = await supabase
    .from("presets")
    .select("key")
    .eq("type", "image")
    .limit(1);

  if (error || !presets || presets.length === 0) {
    console.error("  ❌ No image preset found");
    process.exit(1);
  }

  return presets[0].key;
}

// Main test: Try to create generation with KIE model
async function testKieIntegration(
  token: string,
  presetKey: string,
  modelKey: string
): Promise<void> {
  console.log("\n🚀 Testing KIE integration...");
  console.log(`  → Preset: ${presetKey}`);
  console.log(`  → Model: ${modelKey}`);

  const payload = {
    presetKey,
    modelKey,
    prompt: "A simple test image: a red apple on a white background",
  };

  console.log(`  → Calling ${EDGE_BASE_URL}/generate`);
  console.log(`  → Payload: ${JSON.stringify(payload, null, 2)}`);

  const response = await fetch(`${EDGE_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log(`  → Response status: ${response.status}`);
  console.log(`  → Response: ${JSON.stringify(data, null, 2)}`);

  if (!response.ok) {
    // Check for 422 model not supported error (can come as 502 with 422 in message)
    const is422Error =
      response.status === 422 ||
      (response.status === 502 &&
        data.message &&
        data.message.includes("422")) ||
      data.code === 422;

    if (is422Error) {
      console.error("\n❌ KIE returned 422: Model not supported");
      console.error(`  → Model sent to KIE: ${data.modelSent || modelKey}`);
      console.error(`  → Model key in DB: ${data.modelKey || modelKey}`);
      console.error(`  → Message: ${data.message || "Model not supported"}`);
      console.error(
        `  → Hint: ${data.hint || "Check KIE.ai market for available models"}`
      );

      // Show available models
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const { data: allModels } = await supabase
        .from("models")
        .select("key, title, modality")
        .eq("provider", "kie")
        .eq("modality", "image")
        .order("title");

      if (allModels && allModels.length > 0) {
        console.error("\n  📋 Available image models in DB:");
        allModels.forEach((m) => {
          console.error(`    - ${m.key} (${m.title})`);
        });
        console.error(
          `\n  💡 Total: ${allModels.length} image models in database`
        );
      }

      console.error("\n  🔍 Debugging steps:");
      console.error("    1. Check KIE.ai market: https://kie.ai/market");
      console.error(
        "    2. Verify API key has Market API access: https://kie.ai/api-key"
      );
      console.error(
        "    3. Check Edge Functions logs for detailed KIE API response"
      );
      console.error("    4. Try a different model from the list above");
      process.exit(1);
    }

    console.error(
      `  ❌ Generation failed: ${response.status} - ${
        data.error || data.message || "Unknown error"
      }`
    );
    if (data.provider === "kie" && data.modelSent) {
      console.error(`  → Model sent: ${data.modelSent}`);
      console.error(`  → Hint: ${data.hint || "Check KIE.ai integration"}`);
    }
    process.exit(1);
  }

  if (!data.generationId) {
    console.error(`  ❌ Response missing generationId`);
    process.exit(1);
  }

  console.log(`  ✅ Generation created: ${data.generationId}`);
  console.log(`  ✅ Status: ${data.status}`);
  console.log(`  ✅ Provider task ID: ${data.providerTaskId || "N/A"}`);

  console.log("\n✅ KIE integration test passed!");
  console.log("  → Generation was successfully created and sent to KIE.ai");
  console.log(
    "  → Check Supabase Dashboard > Edge Functions logs for detailed KIE API logs"
  );
}

// Main execution
async function main() {
  console.log("🧪 KIE.ai Integration Smoke Test");
  console.log("=".repeat(60));

  try {
    // Step 1: Authenticate
    const { token } = await authenticateUser();

    // Step 2: Get available models
    const models = await getAvailableModels(token);

    // Step 3: Get first preset
    const presetKey = await getFirstPreset(token);

    // Step 4: Try first image model
    const imageModels = models.filter((m) => m.modality === "image");
    if (imageModels.length === 0) {
      console.error("  ❌ No image models found");
      process.exit(1);
    }

    const testModel = imageModels[0];
    console.log(`\n📋 Using model: ${testModel.key} (${testModel.title})`);

    // Step 5: Test KIE integration
    await testKieIntegration(token, presetKey, testModel.key);

    console.log("\n" + "=".repeat(60));
    console.log("✅ SMOKE TEST PASSED");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ SMOKE TEST FAILED");
    console.error("=".repeat(60));
    console.error(`Error: ${error.message || error}`);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    console.error("=".repeat(60));
    process.exit(1);
  }
}

main();
