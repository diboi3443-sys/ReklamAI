// Check status of a KIE task
import 'dotenv/config';

const KIE_BASE_URL = process.env.KIE_BASE_URL || 'https://api.kie.ai';
const KIE_API_KEY = process.env.KIE_API_KEY;

if (!KIE_API_KEY) {
  console.error('❌ KIE_API_KEY is not set in environment variables');
  process.exit(1);
}

// Get taskId from command line argument or use a test one
const taskId = process.argv[2] || '15e5f1fb77305de478b64bb88828b98b';

async function checkStatus() {
  console.log(`🔍 Checking status for task: ${taskId}\n`);
  console.log(`Base URL: ${KIE_BASE_URL}`);
  console.log('');

  try {
    const statusUrl = `${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;
    console.log(`📊 Request URL: ${statusUrl}`);
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error: ${errorText.substring(0, 500)}`);
      return;
    }

    const data = await response.json();
    console.log(`   ✅ Response:`, JSON.stringify(data, null, 2));
    
    if (data.code === 200 && data.data) {
      const taskData = data.data;
      console.log('');
      console.log('📋 Task Details:');
      console.log(`   Task ID: ${taskData.taskId || taskId}`);
      console.log(`   Model: ${taskData.model || 'N/A'}`);
      console.log(`   State: ${taskData.state || 'N/A'}`);
      console.log(`   Create Time: ${taskData.createTime ? new Date(taskData.createTime).toISOString() : 'N/A'}`);
      console.log(`   Complete Time: ${taskData.completeTime ? new Date(taskData.completeTime).toISOString() : 'N/A'}`);
      console.log(`   Cost Time: ${taskData.costTime ? `${taskData.costTime}ms` : 'N/A'}`);
      
      if (taskData.failCode || taskData.failMsg) {
        console.log(`   ❌ Failed: ${taskData.failCode || ''} - ${taskData.failMsg || ''}`);
      }
      
      if (taskData.resultJson) {
        try {
          const result = JSON.parse(taskData.resultJson);
          console.log(`   ✅ Result:`, JSON.stringify(result, null, 2));
          
          if (result.url || result.output_url || result.download_url) {
            const downloadUrl = result.url || result.output_url || result.download_url;
            console.log(`   🔗 Download URL: ${downloadUrl}`);
          }
        } catch (e) {
          console.log(`   Result (raw): ${taskData.resultJson}`);
        }
      } else if (taskData.state === 'succeeded' || taskData.state === 'completed') {
        console.log(`   ⚠️  Task completed but no result URL found`);
      }
    }
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
  }

  console.log('');
  console.log('✅ Status check completed!');
}

checkStatus().catch(console.error);
