#!/usr/bin/env node
/**
 * Quick KIE.ai connection test
 * Usage: KIE_API_KEY=your-key npx tsx scripts/test-kie-quick.ts
 * Or add KIE_API_KEY to .env file
 */

const KIE_BASE_URL = process.env.KIE_BASE_URL || 'https://api.kie.ai';
const KIE_API_KEY = process.argv[2] || process.env.KIE_API_KEY;

console.log('🔍 KIE.ai Quick Connection Test');
console.log('='.repeat(60));

if (!KIE_API_KEY) {
  console.log('');
  console.log('❌ KIE_API_KEY not provided');
  console.log('');
  console.log('Usage:');
  console.log('  npx tsx scripts/test-kie-quick.ts YOUR_API_KEY');
  console.log('');
  console.log('Or set environment variable:');
  console.log('  export KIE_API_KEY=your-key');
  console.log('  npx tsx scripts/test-kie-quick.ts');
  console.log('');
  console.log('Get your API key at: https://kie.ai/api-key');
  process.exit(1);
}

console.log(`Base URL: ${KIE_BASE_URL}`);
console.log(`API Key: ${KIE_API_KEY.substring(0, 8)}...${KIE_API_KEY.substring(KIE_API_KEY.length - 4)}`);
console.log('');

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function testCredits(): Promise<void> {
  console.log('1️⃣ Testing API access (credits endpoint)...');
  
  try {
    const response = await fetch(`${KIE_BASE_URL}/api/v1/user/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    });

    console.log(`   HTTP Status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      results.push({
        name: 'Credits Check',
        success: false,
        message: `HTTP ${response.status}: ${text.substring(0, 100)}`,
      });
      console.log(`   ❌ Failed: ${text.substring(0, 100)}`);
      return;
    }

    const data = await response.json();
    const credits = data.data?.credits ?? data.credits ?? 'N/A';
    
    results.push({
      name: 'Credits Check',
      success: true,
      message: `Balance: ${credits}`,
      data,
    });
    console.log(`   ✅ Success! Credits: ${credits}`);
  } catch (error: any) {
    results.push({
      name: 'Credits Check',
      success: false,
      message: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function testCreateTask(): Promise<string | null> {
  console.log('');
  console.log('2️⃣ Testing task creation (grok-imagine model)...');
  
  const payload = {
    model: 'grok-imagine',
    input: {
      prompt: 'A red apple on white background, minimalist',
    },
  };
  
  console.log(`   Model: ${payload.model}`);
  console.log(`   Prompt: ${payload.input.prompt}`);

  try {
    const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`   HTTP Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`   Response code: ${data.code}`);
    
    // Check for application-level error
    if (data.code && data.code !== 200 && data.code !== 0) {
      const errorMsg = data.msg || data.message || 'Unknown error';
      results.push({
        name: 'Create Task',
        success: false,
        message: `API Error ${data.code}: ${errorMsg}`,
        data,
      });
      console.log(`   ❌ API Error: ${errorMsg}`);
      
      if (data.code === 422) {
        console.log('');
        console.log('   ℹ️ Model not supported. Try another model or check:');
        console.log('      - https://kie.ai/market (available models)');
        console.log('      - https://kie.ai/api-key (API key permissions)');
      }
      return null;
    }

    if (!response.ok) {
      results.push({
        name: 'Create Task',
        success: false,
        message: `HTTP ${response.status}`,
        data,
      });
      console.log(`   ❌ HTTP Error: ${response.status}`);
      return null;
    }

    // Extract task ID
    const taskId = data.id || data.task_id || data.taskId || data.recordId ||
                  (data.data && (data.data.id || data.data.task_id || data.data.taskId || data.data.recordId));
    
    if (taskId) {
      results.push({
        name: 'Create Task',
        success: true,
        message: `Task ID: ${taskId}`,
        data,
      });
      console.log(`   ✅ Task created: ${taskId}`);
      return String(taskId);
    } else {
      results.push({
        name: 'Create Task',
        success: false,
        message: 'No task ID in response',
        data,
      });
      console.log(`   ❌ No task ID in response`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error: any) {
    results.push({
      name: 'Create Task',
      success: false,
      message: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function testTaskStatus(taskId: string): Promise<void> {
  console.log('');
  console.log(`3️⃣ Testing task status (${taskId})...`);

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

    console.log(`   HTTP Status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      results.push({
        name: 'Task Status',
        success: false,
        message: `HTTP ${response.status}: ${text.substring(0, 100)}`,
      });
      console.log(`   ❌ Failed: ${text.substring(0, 100)}`);
      return;
    }

    const data = await response.json();
    const state = data.data?.state || 'unknown';
    
    results.push({
      name: 'Task Status',
      success: true,
      message: `State: ${state}`,
      data,
    });
    console.log(`   ✅ State: ${state}`);
    
    if (data.data?.failMsg) {
      console.log(`   ⚠️ Fail reason: ${data.data.failMsg}`);
    }
    
    if (data.data?.resultJson) {
      try {
        const result = JSON.parse(data.data.resultJson);
        if (result.resultUrls && result.resultUrls.length > 0) {
          console.log(`   🎨 Output: ${result.resultUrls[0]}`);
        }
      } catch (e) {}
    }
  } catch (error: any) {
    results.push({
      name: 'Task Status',
      success: false,
      message: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function pollUntilComplete(taskId: string): Promise<void> {
  console.log('');
  console.log('4️⃣ Polling for completion (max 2 minutes)...');
  
  const maxAttempts = 24;
  const interval = 5000;
  
  for (let i = 1; i <= maxAttempts; i++) {
    process.stdout.write(`   Attempt ${i}/${maxAttempts}... `);
    
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
        console.log(`${state}`);
        
        if (state === 'succeeded' || state === 'completed' || state === 'done') {
          console.log('');
          console.log('   ✅ TASK COMPLETED!');
          
          if (data.data?.resultJson) {
            try {
              const result = JSON.parse(data.data.resultJson);
              const url = result.resultUrls?.[0] || result.url || result.output_url;
              if (url) {
                console.log(`   🖼️ Result URL: ${url}`);
                results.push({
                  name: 'Task Completion',
                  success: true,
                  message: `URL: ${url}`,
                });
              }
            } catch (e) {}
          }
          return;
        }
        
        if (state === 'failed' || state === 'error') {
          console.log('');
          console.log(`   ❌ TASK FAILED: ${data.data?.failMsg || 'Unknown error'}`);
          results.push({
            name: 'Task Completion',
            success: false,
            message: data.data?.failMsg || 'Task failed',
          });
          return;
        }
      } else {
        console.log(`error (HTTP ${response.status})`);
      }
    } catch (error: any) {
      console.log(`error (${error.message})`);
    }
    
    if (i < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  console.log('');
  console.log('   ⏰ Timeout - task still processing');
  console.log(`   Check later: npx tsx scripts/check-kie-status.ts ${taskId}`);
  results.push({
    name: 'Task Completion',
    success: false,
    message: 'Timeout - still processing',
  });
}

async function main() {
  // Test 1: Credits
  await testCredits();
  
  // Test 2: Create Task
  const taskId = await testCreateTask();
  
  if (taskId) {
    // Test 3: Check Status
    await testTaskStatus(taskId);
    
    // Test 4: Poll until complete
    await pollUntilComplete(taskId);
  }
  
  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  let allPassed = true;
  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (!result.success) allPassed = false;
  }
  
  console.log('');
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - KIE.ai connection is working!');
  } else {
    console.log('⚠️ SOME TESTS FAILED - Check errors above');
  }
  console.log('='.repeat(60));
  
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
