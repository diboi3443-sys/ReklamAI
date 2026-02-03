// Test script to check KIE API key access and credits
import 'dotenv/config';

const KIE_BASE_URL = process.env.KIE_BASE_URL || 'https://api.kie.ai';
const KIE_API_KEY = process.env.KIE_API_KEY;

if (!KIE_API_KEY) {
  console.error('❌ KIE_API_KEY is not set in environment variables');
  console.error('   Please set KIE_API_KEY in your .env file or environment');
  process.exit(1);
}

async function checkKieAccess() {
  console.log('🔍 Checking KIE API key access...\n');
  console.log(`Base URL: ${KIE_BASE_URL}`);
  console.log(`API Key: ${KIE_API_KEY.substring(0, 20)}...${KIE_API_KEY.substring(KIE_API_KEY.length - 4)}`);
  console.log('');

  // Test 1: Check credits (try multiple possible endpoints)
  console.log('📊 Test 1: Checking credits balance...');
  const creditEndpoints = [
    '/api/v1/common/get-account-credits',
    '/api/v1/chat/credit',
    '/api/v1/user/credits',
  ];
  
  let creditsFound = false;
  for (const endpoint of creditEndpoints) {
    try {
      const creditsUrl = `${KIE_BASE_URL}${endpoint}`;
      console.log(`   Trying: ${creditsUrl}`);
      
      const response = await fetch(creditsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Response:`, JSON.stringify(data, null, 2));
        
        const credits = data.data?.credits || data.credits || data.data?.balance;
        if (credits !== undefined) {
          console.log(`   💰 Credits balance: ${credits}`);
          creditsFound = true;
          break;
        }
      } else {
        const errorText = await response.text();
        console.log(`   ⚠️  ${response.status}: ${errorText.substring(0, 200)}`);
      }
    } catch (error: any) {
      console.log(`   ⚠️  Failed: ${error.message}`);
    }
  }
  
  if (!creditsFound) {
    console.log(`   ⚠️  Could not find working credits endpoint`);
    console.log(`   → This might indicate API key access issues`);
  }

  console.log('');

  // Test 2: Try to create a task with a simple model
  console.log('🧪 Test 2: Testing createTask with grok-imagine/text-to-image...');
  try {
    const createTaskUrl = `${KIE_BASE_URL}/api/v1/jobs/createTask`;
    console.log(`   URL: ${createTaskUrl}`);
    
    const requestBody = {
      model: 'grok-imagine/text-to-image',
      input: {
        prompt: 'A simple test image',
        aspect_ratio: '16:9', // Required for grok-imagine
      },
    };
    
    console.log(`   Request body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(createTaskUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`   Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (data.code && data.code !== 200 && data.code !== 0) {
      console.error(`   ❌ Application error: code=${data.code}, msg=${data.msg || data.message}`);
      
      if (data.code === 422 && data.msg?.toLowerCase().includes('model') && data.msg?.toLowerCase().includes('not supported')) {
        console.error(`   ⚠️  Model not supported. Possible reasons:`);
        console.error(`      1. API key does not have access to Market API`);
        console.error(`      2. Model is not available in your plan/region`);
        console.error(`      3. Check available models at: https://kie.ai/market`);
      } else if (data.code === 422 && data.msg?.toLowerCase().includes('aspect_ratio')) {
        console.error(`   ⚠️  aspect_ratio is required for this model`);
      }
    } else if (data.data?.taskId || data.data?.id || data.data?.recordId || data.id || data.taskId || data.task_id || data.recordId) {
      const taskId = data.data?.taskId || data.data?.id || data.data?.recordId || data.id || data.taskId || data.task_id || data.recordId;
      console.log(`   ✅ Task created successfully! Task ID: ${taskId}`);
      
      // Test 3: Check task status
      console.log('');
      console.log(`📊 Test 3: Checking task status for ${taskId}...`);
      try {
        const statusUrl = `${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;
        console.log(`   URL: ${statusUrl}`);
        
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${KIE_API_KEY}`,
          },
        });
        
        console.log(`   Status: ${statusResponse.status}`);
        const statusData = await statusResponse.json();
        console.log(`   Response:`, JSON.stringify(statusData, null, 2));
      } catch (statusError: any) {
        console.error(`   ⚠️  Status check failed: ${statusError.message}`);
      }
    } else {
      console.log(`   ⚠️  Unexpected response format`);
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
  }

  console.log('');
  console.log('✅ Access check completed!');
}

checkKieAccess().catch(console.error);
