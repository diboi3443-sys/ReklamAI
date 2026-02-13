import aiohttp
import asyncio

async def test_connect():
    url = "http://127.0.0.1:8288/e/local"
    print(f"Testing connection to {url} with aiohttp...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={"test": "data"}) as resp:
                print(f"Response: {resp.status}")
                print(await resp.text())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_connect())
