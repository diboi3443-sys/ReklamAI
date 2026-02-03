// Simplified test version of upload function for debugging
// This version should respond immediately to verify the function is reachable

export default async function handler(req: Request): Promise<Response> {
  const t0 = Date.now();
  const method = req.method;
  
  console.log(`[UPLOAD-TEST] start method=${method} at ${new Date().toISOString()}`);
  
  // Immediate response for any request
  const duration = Date.now() - t0;
  console.log(`[UPLOAD-TEST] responding in ${duration}ms`);
  
  return new Response(
    JSON.stringify({
      test: 'ok',
      method,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    }
  );
}
