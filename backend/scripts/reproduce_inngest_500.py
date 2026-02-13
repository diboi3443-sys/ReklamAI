import httpx
import asyncio
import json

async def reproduce():
    url = "http://127.0.0.1:8000/api/inngest?fnId=reklamai-process-generation&stepId=step"
    
    # Construct a minimal payload based on validation errors
    # "ctx", "event", "steps", "use_api" are required
    payload = {
        "ctx": {
            "env": "development",
            "run_id": "test-run-id",
            "fn_id": "reklamai-process-generation",
            "attempt": 0,
            "disable_immediate_execution": False,
            "stack": {"stack": []},
        },
        "event": {
            "name": "reklamai/generation.requested",
            "data": {
                "generation_id": "test-generation-id",
                "payload": {}
            },
            "ts": 1700000000000
        },
        "events": [{
            "name": "reklamai/generation.requested",
            "data": {
                "generation_id": "test-generation-id",
                "payload": {}
            },
            "ts": 1700000000000
        }],
        "steps": {},
        "use_api": False
    }
    
    print(f"Sending payload to {url}...")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, timeout=10.0)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(reproduce())
