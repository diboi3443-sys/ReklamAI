import sys
import os
import asyncio
import logging
from inngest import Event

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.inngest_client import inngest_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_inngest")

async def main():
    print("🚀 Sending test event to Inngest...")
    
    # Create a dummy event
    event = Event(
        name="reklamai/generation.requested",
        data={
            "generation_id": "test-gen-id",
            "payload": {
                "model": "test-model",
                "input": {"prompt": "test prompt"}
            }
        }
    )
    
    print("🚀 Sending test event to Inngest...")
    try:
        await inngest_client.send(event)
        print("✅ Event sent successfully!")
        print("Check Inngest Dev Server UI (http://localhost:8288) to see if it triggered.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Failed to send event: {e}")

if __name__ == "__main__":
    asyncio.run(main())
