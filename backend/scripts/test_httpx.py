import sys
import os
import asyncio
import httpx

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.inngest_client import inngest_client

async def test_connect():
    url = "http://127.0.0.1:8288/"
    print(f"Testing connection to {url}")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            print(f"Response: {resp.status_code}")
            print(resp.text[:100])
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connect())
