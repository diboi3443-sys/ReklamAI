#!/usr/bin/env node
/**
 * Full KIE.ai connection test
 * Tests: API Key access, credits, creating a task, checking status
 */
import 'dotenv/config';

const KIE_BASE_URL = process.env.KIE_BASE_URL || 'https://api.kie.ai';
const KIE_API_KEY = process.env.KIE_API_KEY;

console.log('🔍 KIE.ai Full Connection Test');
console.log('='.repeat(60));
console.log(`KIE Base URL: ${KIE_BASE_URL}`);
console.log(`KIE API Key: ${KIE_API_KEY ? `✅ Set (${KIE_API_KEY.length} chars)` : '❌ NOT SET'}`);
console.log('');

if (!KIE_API_KEY) {
  console.error('❌ KIE_API_KEY is not set in environment variables');
  console.error('   Set KIE_API_KEY in .env file or environment');
  process.exit(1);
}

async function checkCredits(): Promise<number | null> {
  console.log('📊 Step 1: Checking API access and credits...');
  
  try {
    const response = await fetch(`${KIE_BASE_URL}/api/v1/user/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error: ${errorText.substring(0, 300)}`);
      return null;
    }

    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    const credits = data.data?.credits ?? data.credits ?? null;
    if (credits !== null) {
      console.log(`   ✅ Credits balance: ${credits}`);
    }
    
    return credits;
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function createTestTask(): Promise<string | null> {
  console.log('');
  console.log('🚀 Step 2: Creating test image generation task...');
  
  // Using a simple, reliable model for testing
  const testPayload = {
    model: 'grok-imagine',  // Free/cheap model for testing
    input: {
      prompt: 'A simple red apple on white background, minimalist style',
    },
  };
  
  console.log(`   Model: ${testPayload.model}`);
  console.log(`   Prompt: ${testPayload.input.prompt}`);
  console.log(`   Request URL: ${KIE_BASE_URL}/api/v1/jobs/createTask`);
  
  try {
    const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`   Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (!response.ok || (data.code && data.code !== 200 && data.code !== 0)) {
      console.error(`   ❌ Error: ${data.msg || data.message || 'Unknown error'}`);
      
      if (data.code === 422) {
        console.error('');
        console.error('   ⚠️  Model not supported. Possible reasons:');
        console.error('   1. API key does not have access to this model');
        console.error('   2. Model is not available in your plan');
        console.error('   3. Model name is incorrect');
        console.error('');
        console.error('   Available models at: https://kie.ai/market');
        console.error('   Check API key access at: https://kie.ai/api-key');
      }
      
      return null;
    }

    // Extract task ID from various possible fields
    const taskId = data.id ||
                  data.task_id ||
                  data.taskId ||
                  data.job_id ||
                  data.jobId ||
                  data.recordId ||
                  (data.data && (data.data.id || data.data.task_id || data.data.taskId || data.data.recordId));
    
    if (taskId) {
      console.log(`   ✅ Task created: ${taskId}`);
      return String(taskId);
    } else {
      console.error(`   ❌ No task ID in response`);
      return null;
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function checkTaskStatus(taskId: string): Promise<void> {
  console.log('');
  console.log(`📋 Step 3: Checking task status for: ${taskId}...`);
  
  try {
    const response = await fetch(
      `${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error: ${errorText.substring(0, 500)}`);
      return;
    }

    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (data.code === 200 && data.data) {
      const taskData = data.data;
      console.log('');
      console.log('   📋 Task Details:');
      console.log(`   - State: ${taskData.state || 'N/A'}`);
      console.log(`   - Model: ${taskData.model || 'N/A'}`);
      
      if (taskData.failCode || taskData.failMsg) {
        console.log(`   - ❌ Failed: ${taskData.failCode || ''} - ${taskData.failMsg || ''}`);
      }
      
      if (taskData.resultJson) {
        try {
          const result = JSON.parse(taskData.resultJson);
          if (result.resultUrls && result.resultUrls.length > 0) {
            console.log(`   - ✅ Output URL: ${result.resultUrls[0]}`);
          } else if (result.url || result.output_url) {
            console.log(`   - ✅ Output URL: ${result.url || result.output_url}`);
          }
        } catch (e) {
          console.log(`   - Result (raw): ${taskData.resultJson.substring(0, 200)}`);
        }
      }
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
  }
}

async function pollTaskUntilComplete(taskId: string, maxAttempts = 30): Promise<void> {
  console.log('');
  console.log(`⏳ Step 4: Polling task status (max ${maxAttempts} attempts, 5s interval)...`);
  
  for (let i = 1; i <= maxAttempts; i++) {
    console.log(`   Attempt ${i}/${maxAttempts}...`);
    
    try {
      const response = await fetch(
        `${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KIE_API_KEY}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const state = data.data?.state || 'unknown';
        console.log(`   State: ${state}`);
        
        if (state === 'succeeded' || state === 'completed' || state === 'done') {
          console.log(`   ✅ Task completed successfully!`);
          
          // Extract result URL
          if (data.data?.resultJson) {
            try {
              const result = JSON.parse(data.data.resultJson);
              const outputUrl = result.resultUrls?.[0] || result.url || result.output_url;
              if (outputUrl) {
                console.log(`   🎨 Result URL: ${outputUrl}`);
              }
            } catch (e) {}
          }
          return;
        }
        
        if (state === 'failed' || state === 'error') {
          console.error(`   ❌ Task failed: ${data.data?.failMsg || 'Unknown error'}`);
          return;
        }
      }
    } catch (error: any) {
      console.log(`   ⚠️ Error: ${error.message}`);
    }
    
    // Wait 5 seconds before next poll
    if (i < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('   ⏰ Timeout - task still processing. Check status later with:');
  console.log(`   npx tsx scripts/check-kie-status.ts ${taskId}`);
}

async function main() {
  // Step 1: Check credits
  const credits = await checkCredits();
  
  if (credits === null) {
    console.log('');
    console.log('⚠️  Could not check credits. Continuing with task creation...');
  }
  
  // Step 2: Create test task
  const taskId = await createTestTask();
  
  if (!taskId) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ FAILED: Could not create test task');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check if KIE_API_KEY is correct');
    console.log('2. Check API key access at: https://kie.ai/api-key');
    console.log('3. Check available models at: https://kie.ai/market');
    console.log('='.repeat(60));
    process.exit(1);
  }
  
  // Step 3: Check initial status
  await checkTaskStatus(taskId);
  
  // Step 4: Poll until complete (with timeout)
  await pollTaskUntilComplete(taskId, 24); // 24 attempts * 5s = 2 minutes max
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ KIE.ai connection test complete!');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
