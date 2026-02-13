"""
ReklamAI v2.0 — Seed Data
Populates the database with AI models and presets on first startup.
Idempotent: skips existing records (matched by slug).
"""
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AIModel, Preset

logger = logging.getLogger("uvicorn")


# ═══════════════════════════════════════════════════════════════
# AI MODELS — KIE.ai supported models
# ═══════════════════════════════════════════════════════════════
SEED_MODELS = [
    # ── IMAGE MODELS ──
    {
        "name": "FLUX.1",
        "slug": "flux-1",
        "provider": "kie",
        "provider_model_id": "flux-1",
        "category": "image",
        "price_multiplier": 1.0,
        "config": {
            "family": "market",
            "supports_image_input": False,
            "aspect_ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
        },
    },
    {
        "name": "Flux 2",
        "slug": "flux-2",
        "provider": "kie",
        "provider_model_id": "flux-2",
        "category": "image",
        "price_multiplier": 1.5,
        "config": {
            "family": "market",
            "supports_image_input": False,
            "aspect_ratios": ["1:1", "16:9", "9:16", "4:3"],
            "requires_resolution": True,
        },
    },
    {
        "name": "Flux Kontext",
        "slug": "flux-kontext",
        "provider": "kie",
        "provider_model_id": "flux-kontext",
        "category": "image",
        "price_multiplier": 1.5,
        "config": {
            "family": "flux-kontext",
            "supports_image_input": True,
            "aspect_ratios": ["1:1", "16:9", "9:16"],
        },
    },
    {
        "name": "SDXL",
        "slug": "sdxl",
        "provider": "kie",
        "provider_model_id": "sdxl",
        "category": "image",
        "price_multiplier": 0.8,
        "config": {
            "family": "market",
            "supports_image_input": False,
            "aspect_ratios": ["1:1", "16:9", "9:16"],
        },
    },
    {
        "name": "Seedream 3.0",
        "slug": "seedream-3",
        "provider": "kie",
        "provider_model_id": "seedream-3",
        "category": "image",
        "price_multiplier": 1.2,
        "config": {
            "family": "market",
            "supports_image_input": False,
            "aspect_ratios": ["1:1", "16:9", "9:16", "4:3"],
        },
    },
    {
        "name": "GPT Image (4o)",
        "slug": "gpt-image",
        "provider": "kie",
        "provider_model_id": "gpt-image",
        "category": "image",
        "price_multiplier": 2.0,
        "config": {
            "family": "4o-image",
            "supports_image_input": True,
            "aspect_ratios": ["1:1", "16:9", "9:16"],
        },
    },
    {
        "name": "Ideogram",
        "slug": "ideogram",
        "provider": "kie",
        "provider_model_id": "ideogram",
        "category": "image",
        "price_multiplier": 1.0,
        "config": {
            "family": "market",
            "supports_image_input": False,
            "aspect_ratios": ["1:1", "16:9", "9:16"],
        },
    },
    {
        "name": "Recraft V3",
        "slug": "recraft-v3",
        "provider": "kie",
        "provider_model_id": "recraft-v3",
        "category": "image",
        "price_multiplier": 1.0,
        "config": {
            "family": "market",
            "supports_image_input": False,
            "aspect_ratios": ["1:1", "16:9", "9:16"],
        },
    },
    {
        "name": "Grok Imagine",
        "slug": "grok-imagine",
        "provider": "kie",
        "provider_model_id": "grok-imagine",
        "category": "image",
        "price_multiplier": 1.5,
        "config": {
            "family": "market",
            "supports_image_input": False,
            "aspect_ratios": ["1:1", "16:9", "9:16"],
        },
    },

    # ── VIDEO MODELS ──
    {
        "name": "Kling v2",
        "slug": "kling-v2",
        "provider": "kie",
        "provider_model_id": "kling-v2",
        "category": "video",
        "price_multiplier": 5.0,
        "config": {
            "family": "market",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },
    {
        "name": "Kling v2 Pro",
        "slug": "kling-v2-pro",
        "provider": "kie",
        "provider_model_id": "kling-v2-pro",
        "category": "video",
        "price_multiplier": 8.0,
        "config": {
            "family": "market",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },
    {
        "name": "Runway Gen-4 Turbo",
        "slug": "gen4-turbo",
        "provider": "kie",
        "provider_model_id": "gen4_turbo",
        "category": "video",
        "price_multiplier": 8.0,
        "config": {
            "family": "runway",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },
    {
        "name": "Runway Gen-3a Turbo",
        "slug": "gen3a-turbo",
        "provider": "kie",
        "provider_model_id": "gen3a_turbo",
        "category": "video",
        "price_multiplier": 6.0,
        "config": {
            "family": "runway",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },
    {
        "name": "Luma Ray 2",
        "slug": "ray-2",
        "provider": "kie",
        "provider_model_id": "ray-2",
        "category": "video",
        "price_multiplier": 6.0,
        "config": {
            "family": "luma",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },
    {
        "name": "Veo 3",
        "slug": "veo3",
        "provider": "kie",
        "provider_model_id": "veo3",
        "category": "video",
        "price_multiplier": 10.0,
        "config": {
            "family": "veo3",
            "supports_image_input": False,
            "max_duration": 8,
            "aspect_ratios": ["16:9", "9:16"],
        },
    },
    {
        "name": "Seedance 1.0",
        "slug": "seedance-1",
        "provider": "kie",
        "provider_model_id": "seedance-1.0",
        "category": "video",
        "price_multiplier": 5.0,
        "config": {
            "family": "market",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },
    {
        "name": "Wan 2.1",
        "slug": "wan-2-1",
        "provider": "kie",
        "provider_model_id": "wan-2.1",
        "category": "video",
        "price_multiplier": 4.0,
        "config": {
            "family": "market",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },
    {
        "name": "Hailuo",
        "slug": "hailuo",
        "provider": "kie",
        "provider_model_id": "hailuo",
        "category": "video",
        "price_multiplier": 5.0,
        "config": {
            "family": "market",
            "supports_image_input": True,
            "max_duration": 10,
            "aspect_ratios": ["16:9", "9:16", "1:1"],
        },
    },

    # ── AUDIO MODELS ──
    {
        "name": "ElevenLabs TTS",
        "slug": "elevenlabs-tts",
        "provider": "kie",
        "provider_model_id": "elevenlabs-tts",
        "category": "voice",
        "price_multiplier": 2.0,
        "config": {
            "family": "market",
            "supports_text_input": True,
        },
    },
    {
        "name": "ElevenLabs Sound FX",
        "slug": "elevenlabs-sound-effect",
        "provider": "kie",
        "provider_model_id": "elevenlabs-sound-effect",
        "category": "voice",
        "price_multiplier": 2.0,
        "config": {
            "family": "market",
            "supports_text_input": True,
        },
    },
    {
        "name": "Suno V4 Music",
        "slug": "suno-v4",
        "provider": "kie",
        "provider_model_id": "chirp-v4",
        "category": "voice",
        "price_multiplier": 3.0,
        "config": {
            "family": "suno",
            "supports_text_input": True,
        },
    },
]


# ═══════════════════════════════════════════════════════════════
# PRESETS — Generation templates
# ═══════════════════════════════════════════════════════════════
SEED_PRESETS = [
    {
        "name": "Image Generation",
        "slug": "image-gen",
        "category": "image",
        "description": "Create images from text prompts using AI models",
        "defaults": {
            "credits": 1.0,
            "aspect_ratio": "1:1",
            "models": ["flux-1", "sdxl", "flux-2", "seedream-3", "gpt-image", "ideogram", "recraft-v3", "grok-imagine", "flux-kontext"],
        },
    },
    {
        "name": "Video Generation",
        "slug": "video-gen",
        "category": "video",
        "description": "Generate video clips from text and images",
        "defaults": {
            "credits": 5.0,
            "aspect_ratio": "16:9",
            "duration": 10,
            "models": ["kling-v2", "kling-v2-pro", "gen4-turbo", "gen3a-turbo", "ray-2", "veo3", "seedance-1", "wan-2-1", "hailuo"],
        },
    },
    {
        "name": "Voice Generation",
        "slug": "voice-gen",
        "category": "voice",
        "description": "Create voiceovers, sound effects, and music",
        "defaults": {
            "credits": 2.0,
            "models": ["elevenlabs-tts", "elevenlabs-sound-effect", "suno-v4"],
        },
    },
    {
        "name": "Text Generation",
        "slug": "text-gen",
        "category": "text",
        "description": "Generate copy, scripts, and text content",
        "defaults": {
            "credits": 0.5,
            "models": [],
        },
    },
]


async def seed_database(db: AsyncSession) -> None:
    """
    Populate models and presets if they don't exist yet.
    Safe to call on every startup — idempotent.
    """
    # ── Seed Models ──
    models_added = 0
    for model_data in SEED_MODELS:
        slug = model_data["slug"]
        result = await db.execute(
            select(AIModel).where(AIModel.slug == slug)
        )
        if result.scalar_one_or_none() is None:
            model = AIModel(**model_data)
            db.add(model)
            models_added += 1

    # ── Seed Presets ──
    presets_added = 0
    for preset_data in SEED_PRESETS:
        slug = preset_data["slug"]
        result = await db.execute(
            select(Preset).where(Preset.slug == slug)
        )
        if result.scalar_one_or_none() is None:
            preset = Preset(**preset_data)
            db.add(preset)
            presets_added += 1

    if models_added or presets_added:
        await db.commit()
        logger.info(f"✅  Seed: added {models_added} models, {presets_added} presets")
    else:
        logger.info("✅  Seed: all data already present")
