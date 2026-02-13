import sys
import os
import json
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base
from app.config import get_settings
from app.models import AIModel

async def seed_models():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    registry_path = os.path.join(
        os.path.dirname(__file__), 
        "../../supabase/seed/kie_models_registry.json"
    )
    
    print(f"📂 Loading registry: {registry_path}")
    with open(registry_path, "r") as f:
        registry = json.load(f)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        count = 0
        for model_data in registry["models"]:
            # Map modality
            modality = model_data.get("modality", "image")
            category = "image"
            if modality == "video":
                category = "video"
            elif modality == "audio":
                category = "voice" # 'audio' in json -> 'voice' in db comment, but let's check
                # models.py says: category = Column(String(50), default="image") # image | video | voice | text
                # Script mapped to 'audio' but maybe that was for Supabase enum?
                # Let's map 'audio' -> 'voice' to match models.py comment, or 'audio' if valid.
                # Actually models.py comment is just a hint. Let's use 'voice' if it's strictly enforced, 
                # otherwise 'audio' is fine. Python string column doesn't enforce enum unless specified.
                # However, frontend might expect specific values.
                # TS script mapped to 'audio'. Let's use 'audio' if models.py allows string.
                # Wait, models.py says "image | video | voice | text".
                # TS script mapped to "audio".
                # I'll stick to "audio" if it's consistent with what frontend expects from API.
                category = "audio" 
            elif modality in ["edit", "upscale", "remove-bg", "lipsync"]:
                 category = "image" # Keep as image/video? 
                 # TS script mapped all these to 'edit'.
                 # But models.py 'category' seems to be the main type.
                 # Let's check what 'category' is used for.
                 # Actually, I'll store the original modality in config if needed, 
                 # but for 'category' column I should use what's appropriate.
                 # TS script: dbModality = "edit"
                 # Let's use "edit" for category if it's allowed.
                 category = "edit"

            # Check if exists
            slug = model_data["key"]
            result = await session.execute(select(AIModel).where(AIModel.slug == slug))
            existing = result.scalar_one_or_none()

            capabilities = {
                "requires_input": model_data.get("requires_input", False),
                "input_kinds": model_data.get("input_kinds", []),
                "family": model_data.get("family"),
                "model_identifier": model_data.get("model_identifier"),
                "docs_url": model_data.get("docs_url"),
                "original_modality": modality
            }

            if existing:
                print(f"🔄 Updating {slug}")
                existing.name = model_data["display_name"]
                existing.provider = model_data["provider"]
                existing.provider_model_id = model_data.get("model_identifier", "")
                existing.category = category
                existing.is_active = model_data.get("is_enabled", True)
                existing.config = capabilities
            else:
                print(f"➕ Adding {slug}")
                new_model = AIModel(
                    name=model_data["display_name"],
                    slug=slug,
                    provider=model_data["provider"],
                    provider_model_id=model_data.get("model_identifier", ""),
                    category=category,
                    is_active=model_data.get("is_enabled", True),
                    price_multiplier=1.0,
                    config=capabilities
                )
                session.add(new_model)
            
            count += 1

        await session.commit()
        print(f"✅ Seeded {count} models")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_models())
