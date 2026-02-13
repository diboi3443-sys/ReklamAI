import aiohttp
import asyncio

async def test():
    url = "http://127.0.0.1:8288/"
    print(f"Testing {url} with aiohttp...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                print(f"Status: {resp.status}")
                print(await resp.text())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
