-- Update existing KIE models with model_identifier and family in capabilities
-- This migration updates models from 20240101000003_kie_models.sql to include
-- proper model_identifier and family fields needed for the new endpoint system

-- Update models with model_identifier and family
-- This uses ON CONFLICT DO UPDATE to merge new capabilities with existing ones

INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
-- Seedream models
('kie', 'seedream-v4-text-to-image', 'image', 'Seedream V4 Text-to-Image',
 '{"model_identifier": "seedream-v4-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/seedream/seedream-v4-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'seedream-v4-edit', 'edit', 'Seedream V4 Edit',
 '{"model_identifier": "seedream-v4-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/seedream/seedream-v4-edit", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'seedream-4.5-text-to-image', 'image', 'Seedream 4.5 Text-to-Image',
 '{"model_identifier": "seedream-4.5-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/seedream/4.5-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'seedream-4.5-edit', 'edit', 'Seedream 4.5 Edit',
 '{"model_identifier": "seedream-4.5-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/seedream/4.5-edit", "supports_image_input": true}'::jsonb, 1.0),

-- Z-image
('kie', 'z-image', 'image', 'Z-Image',
 '{"model_identifier": "z-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/z-image/z-image", "supports_image_input": false}'::jsonb, 1.0),

-- Google Imagen models
('kie', 'google/imagen4', 'image', 'Google Imagen 4',
 '{"model_identifier": "google/imagen4", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/imagen4", "supports_image_input": false}'::jsonb, 1.2),
('kie', 'google/imagen4-fast', 'image', 'Google Imagen 4 Fast',
 '{"model_identifier": "google/imagen4-fast", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/imagen4-fast", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'google/imagen4-ultra', 'image', 'Google Imagen 4 Ultra',
 '{"model_identifier": "google/imagen4-ultra", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/imagen4-ultra", "supports_image_input": false}'::jsonb, 1.5),
('kie', 'google/nano-banana', 'image', 'Google Nano Banana',
 '{"model_identifier": "google/nano-banana", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/nano-banana", "supports_image_input": false}'::jsonb, 0.8),
('kie', 'google/nano-banana-edit', 'edit', 'Google Nano Banana Edit',
 '{"model_identifier": "google/nano-banana-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/google/nano-banana-edit", "supports_image_input": true}'::jsonb, 0.8),
('kie', 'google/pro-image-to-image', 'edit', 'Google Pro Image-to-Image',
 '{"model_identifier": "google/pro-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/google/pro-image-to-image", "supports_image_input": true}'::jsonb, 1.2),

-- Flux2 models
('kie', 'flux2/pro-text-to-image', 'image', 'Flux2 Pro Text-to-Image',
 '{"model_identifier": "flux2/pro-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/flux2/pro-text-to-image", "supports_image_input": false}'::jsonb, 1.3),
('kie', 'flux2/pro-image-to-image', 'edit', 'Flux2 Pro Image-to-Image',
 '{"model_identifier": "flux2/pro-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/flux2/pro-image-to-image", "supports_image_input": true}'::jsonb, 1.3),
('kie', 'flux2/flex-text-to-image', 'image', 'Flux2 Flex Text-to-Image',
 '{"model_identifier": "flux2/flex-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/flux2/flex-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'flux2/flex-image-to-image', 'edit', 'Flux2 Flex Image-to-Image',
 '{"model_identifier": "flux2/flex-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/flux2/flex-image-to-image", "supports_image_input": true}'::jsonb, 1.0),

-- Grok Imagine models
('kie', 'grok-imagine/text-to-image', 'image', 'Grok Imagine Text-to-Image',
 '{"model_identifier": "grok-imagine/text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/grok-imagine/text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'grok-imagine/image-to-image', 'edit', 'Grok Imagine Image-to-Image',
 '{"model_identifier": "grok-imagine/image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/grok-imagine/image-to-image", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'grok-imagine/upscale', 'edit', 'Grok Imagine Upscale',
 '{"model_identifier": "grok-imagine/upscale", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/grok-imagine/upscale", "supports_image_input": true}'::jsonb, 0.8),
('kie', 'grok-imagine/text-to-video', 'video', 'Grok Imagine Text-to-Video',
 '{"model_identifier": "grok-imagine/text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/grok-imagine/text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'grok-imagine/image-to-video', 'video', 'Grok Imagine Image-to-Video',
 '{"model_identifier": "grok-imagine/image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/grok-imagine/image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),

-- GPT Image models
('kie', 'gpt-image/1.5-text-to-image', 'image', 'GPT Image 1.5 Text-to-Image',
 '{"model_identifier": "gpt-image/1.5-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/gpt-image/1.5-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'gpt-image/1.5-image-to-image', 'edit', 'GPT Image 1.5 Image-to-Image',
 '{"model_identifier": "gpt-image/1.5-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/gpt-image/1.5-image-to-image", "supports_image_input": true}'::jsonb, 1.0),

-- Topaz
('kie', 'topaz/image-upscale', 'edit', 'Topaz Image Upscale',
 '{"model_identifier": "topaz/image-upscale", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/topaz/image-upscale", "supports_image_input": true}'::jsonb, 0.8),

-- Recraft models
('kie', 'recraft/remove-background', 'edit', 'Recraft Remove Background',
 '{"model_identifier": "recraft/remove-background", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/recraft/remove-background", "supports_image_input": true}'::jsonb, 0.5),
('kie', 'recraft/crisp-upscale', 'edit', 'Recraft Crisp Upscale',
 '{"model_identifier": "recraft/crisp-upscale", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/recraft/crisp-upscale", "supports_image_input": true}'::jsonb, 0.8),

-- Ideogram models
('kie', 'ideogram/character', 'image', 'Ideogram Character',
 '{"model_identifier": "ideogram/character", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/ideogram/character", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'ideogram/character-edit', 'edit', 'Ideogram Character Edit',
 '{"model_identifier": "ideogram/character-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/ideogram/character-edit", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'ideogram/character-remix', 'edit', 'Ideogram Character Remix',
 '{"model_identifier": "ideogram/character-remix", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/ideogram/character-remix", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'ideogram/v3-reframe', 'edit', 'Ideogram V3 Reframe',
 '{"model_identifier": "ideogram/v3-reframe", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/ideogram/v3-reframe", "supports_image_input": true}'::jsonb, 1.0),

-- Kling models
('kie', 'kling/text-to-video', 'video', 'Kling Text-to-Video',
 '{"model_identifier": "kling/text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/kling/text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/image-to-video', 'video', 'Kling Image-to-Video',
 '{"model_identifier": "kling/image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/ai-avatar-v1-pro', 'video', 'Kling AI Avatar V1 Pro',
 '{"model_identifier": "kling/ai-avatar-v1-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/ai-avatar-v1-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'kling/v1-avatar-standard', 'video', 'Kling V1 Avatar Standard',
 '{"model_identifier": "kling/v1-avatar-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v1-avatar-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-master-text-to-video', 'video', 'Kling V2.1 Master Text-to-Video',
 '{"model_identifier": "kling/v2-1-master-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/kling/v2-1-master-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-master-image-to-video', 'video', 'Kling V2.1 Master Image-to-Video',
 '{"model_identifier": "kling/v2-1-master-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v2-1-master-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-pro', 'video', 'Kling V2.1 Pro',
 '{"model_identifier": "kling/v2-1-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v2-1-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-standard', 'video', 'Kling V2.1 Standard',
 '{"model_identifier": "kling/v2-1-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v2-1-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/motion-control', 'video', 'Kling Motion Control',
 '{"model_identifier": "kling/motion-control", "family": "market", "requires_input": true, "input_kinds": ["image", "start_frame"], "docs_url": "https://docs.kie.ai/market/kling/motion-control", "supports_image_input": true, "supports_video_input": false, "supports_start_frame": true}'::jsonb, 2.5),

-- ByteDance models
('kie', 'bytedance/seedance-1.5-pro', 'video', 'ByteDance Seedance 1.5 Pro',
 '{"model_identifier": "bytedance/seedance-1.5-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/seedance-1.5-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-pro-fast-image-to-video', 'video', 'ByteDance V1 Pro Fast Image-to-Video',
 '{"model_identifier": "bytedance/v1-pro-fast-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/v1-pro-fast-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'bytedance/v1-pro-image-to-video', 'video', 'ByteDance V1 Pro Image-to-Video',
 '{"model_identifier": "bytedance/v1-pro-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/v1-pro-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-pro-text-to-video', 'video', 'ByteDance V1 Pro Text-to-Video',
 '{"model_identifier": "bytedance/v1-pro-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/bytedance/v1-pro-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-lite-image-to-video', 'video', 'ByteDance V1 Lite Image-to-Video',
 '{"model_identifier": "bytedance/v1-lite-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/v1-lite-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'bytedance/v1-lite-text-to-video', 'video', 'ByteDance V1 Lite Text-to-Video',
 '{"model_identifier": "bytedance/v1-lite-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/bytedance/v1-lite-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),

-- Hailuo models
('kie', 'hailuo/02-text-to-video-pro', 'video', 'Hailuo 02 Text-to-Video Pro',
 '{"model_identifier": "hailuo/02-text-to-video-pro", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/hailuo/02-text-to-video-pro", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/02-text-to-video-standard', 'video', 'Hailuo 02 Text-to-Video Standard',
 '{"model_identifier": "hailuo/02-text-to-video-standard", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/hailuo/02-text-to-video-standard", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'hailuo/02-image-to-video-pro', 'video', 'Hailuo 02 Image-to-Video Pro',
 '{"model_identifier": "hailuo/02-image-to-video-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/02-image-to-video-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/02-image-to-video-standard', 'video', 'Hailuo 02 Image-to-Video Standard',
 '{"model_identifier": "hailuo/02-image-to-video-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/02-image-to-video-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'hailuo/2-3-image-to-video-pro', 'video', 'Hailuo 2-3 Image-to-Video Pro',
 '{"model_identifier": "hailuo/2-3-image-to-video-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/2-3-image-to-video-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/2-3-image-to-video-standard', 'video', 'Hailuo 2-3 Image-to-Video Standard',
 '{"model_identifier": "hailuo/2-3-image-to-video-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/2-3-image-to-video-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),

-- Sora2 models
('kie', 'sora2/sora-2-text-to-video', 'video', 'Sora2 Text-to-Video',
 '{"model_identifier": "sora2/sora-2-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora2/sora-2-image-to-video', 'video', 'Sora2 Image-to-Video',
 '{"model_identifier": "sora2/sora-2-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora2/sora-2-pro-text-to-video', 'video', 'Sora2 Pro Text-to-Video',
 '{"model_identifier": "sora2/sora-2-pro-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-pro-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 3.5),
('kie', 'sora2/sora-2-pro-image-to-video', 'video', 'Sora2 Pro Image-to-Video',
 '{"model_identifier": "sora2/sora-2-pro-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-pro-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.5),
('kie', 'sora2/sora-watermark-remover', 'video', 'Sora2 Watermark Remover',
 '{"model_identifier": "sora2/sora-watermark-remover", "family": "market", "requires_input": true, "input_kinds": ["video"], "docs_url": "https://docs.kie.ai/market/sora2/sora-watermark-remover", "supports_video_input": true}'::jsonb, 1.5),
('kie', 'sora2/sora-2-characters', 'video', 'Sora2 Characters',
 '{"model_identifier": "sora2/sora-2-characters", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-characters", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora-2-pro-storyboard', 'video', 'Sora2 Pro Storyboard',
 '{"model_identifier": "sora-2-pro-storyboard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora-2-pro-storyboard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.5),

-- Wan models
('kie', 'wan/2-6-text-to-video', 'video', 'Wan 2-6 Text-to-Video',
 '{"model_identifier": "wan/2-6-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/wan/2-6-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-6-image-to-video', 'video', 'Wan 2-6 Image-to-Video',
 '{"model_identifier": "wan/2-6-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/wan/2-6-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-6-video-to-video', 'video', 'Wan 2-6 Video-to-Video',
 '{"model_identifier": "wan/2-6-video-to-video", "family": "market", "requires_input": true, "input_kinds": ["video"], "docs_url": "https://docs.kie.ai/market/wan/2-6-video-to-video", "supports_video_input": true}'::jsonb, 2.5),
('kie', 'wan/2-2-a14b-text-to-video-turbo', 'video', 'Wan 2-2 A14B Text-to-Video Turbo',
 '{"model_identifier": "wan/2-2-a14b-text-to-video-turbo", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/wan/2-2-a14b-text-to-video-turbo", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-2-a14b-image-to-video-turbo', 'video', 'Wan 2-2 A14B Image-to-Video Turbo',
 '{"model_identifier": "wan/2-2-a14b-image-to-video-turbo", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/wan/2-2-a14b-image-to-video-turbo", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-2-animate-move', 'video', 'Wan 2-2 Animate Move',
 '{"model_identifier": "wan/2-2-animate-move", "family": "market", "requires_input": true, "input_kinds": ["image", "start_frame"], "docs_url": "https://docs.kie.ai/market/wan/2-2-animate-move", "supports_image_input": true, "supports_video_input": false, "supports_start_frame": true}'::jsonb, 2.5),
('kie', 'wan/2-2-animate-replace', 'video', 'Wan 2-2 Animate Replace',
 '{"model_identifier": "wan/2-2-animate-replace", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/wan/2-2-animate-replace", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'wan/2-2-a14b-speech-to-video-turbo', 'video', 'Wan 2-2 A14B Speech-to-Video Turbo',
 '{"model_identifier": "wan/2-2-a14b-speech-to-video-turbo", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/wan/2-2-a14b-speech-to-video-turbo", "supports_audio_input": true}'::jsonb, 2.5),

-- Audio models
('kie', 'elevenlabs/text-to-speech-multilingual-v2', 'audio', 'ElevenLabs Text-to-Speech Multilingual V2',
 '{"model_identifier": "elevenlabs/text-to-speech-multilingual-v2", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2", "supports_audio_input": false}'::jsonb, 1.0),
('kie', 'elevenlabs/speech-to-text', 'audio', 'ElevenLabs Speech-to-Text',
 '{"model_identifier": "elevenlabs/speech-to-text", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/elevenlabs/speech-to-text", "supports_audio_input": true}'::jsonb, 0.8),
('kie', 'elevenlabs/sound-effect-v2', 'audio', 'ElevenLabs Sound Effect V2',
 '{"model_identifier": "elevenlabs/sound-effect-v2", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/elevenlabs/sound-effect-v2", "supports_audio_input": false}'::jsonb, 0.8),
('kie', 'elevenlabs/audio-isolation', 'audio', 'ElevenLabs Audio Isolation',
 '{"model_identifier": "elevenlabs/audio-isolation", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/elevenlabs/audio-isolation", "supports_audio_input": true}'::jsonb, 1.0),
('kie', 'infinitalk/from-audio', 'audio', 'Infinitalk From Audio',
 '{"model_identifier": "infinitalk/from-audio", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/infinitalk/from-audio", "supports_audio_input": true}'::jsonb, 1.0)

ON CONFLICT (key) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  title = EXCLUDED.title,
  modality = EXCLUDED.modality,
  price_multiplier = EXCLUDED.price_multiplier;
