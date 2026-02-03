-- Seed all KIE.ai models into models table
-- This migration adds all supported KIE.ai models with proper metadata

-- Image models
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
-- Seedream models
('kie', 'seedream-v4-text-to-image', 'image', 'Seedream V4 Text-to-Image', '{"supports_image_input": false}'::jsonb, 1.0),
('kie', 'seedream-v4-edit', 'edit', 'Seedream V4 Edit', '{"supports_image_input": true}'::jsonb, 1.0),
('kie', 'seedream-4.5-text-to-image', 'image', 'Seedream 4.5 Text-to-Image', '{"supports_image_input": false}'::jsonb, 1.0),
('kie', 'seedream-4.5-edit', 'edit', 'Seedream 4.5 Edit', '{"supports_image_input": true}'::jsonb, 1.0),

-- Z-image
('kie', 'z-image', 'image', 'Z-Image', '{"supports_image_input": false}'::jsonb, 1.0),

-- Google Imagen models
('kie', 'google/imagen4', 'image', 'Google Imagen 4', '{"supports_image_input": false}'::jsonb, 1.2),
('kie', 'google/imagen4-fast', 'image', 'Google Imagen 4 Fast', '{"supports_image_input": false}'::jsonb, 1.0),
('kie', 'google/imagen4-ultra', 'image', 'Google Imagen 4 Ultra', '{"supports_image_input": false}'::jsonb, 1.5),
('kie', 'google/nano-banana', 'image', 'Google Nano Banana', '{"supports_image_input": false}'::jsonb, 0.8),
('kie', 'google/nano-banana-edit', 'edit', 'Google Nano Banana Edit', '{"supports_image_input": true}'::jsonb, 0.8),
('kie', 'google/pro-image-to-image', 'edit', 'Google Pro Image-to-Image', '{"supports_image_input": true}'::jsonb, 1.2),

-- Flux2 models
('kie', 'flux2/pro-text-to-image', 'image', 'Flux2 Pro Text-to-Image', '{"supports_image_input": false}'::jsonb, 1.3),
('kie', 'flux2/pro-image-to-image', 'edit', 'Flux2 Pro Image-to-Image', '{"supports_image_input": true}'::jsonb, 1.3),
('kie', 'flux2/flex-text-to-image', 'image', 'Flux2 Flex Text-to-Image', '{"supports_image_input": false}'::jsonb, 1.0),
('kie', 'flux2/flex-image-to-image', 'edit', 'Flux2 Flex Image-to-Image', '{"supports_image_input": true}'::jsonb, 1.0),

-- Grok Imagine models
('kie', 'grok-imagine/text-to-image', 'image', 'Grok Imagine Text-to-Image', '{"supports_image_input": false}'::jsonb, 1.0),
('kie', 'grok-imagine/image-to-image', 'edit', 'Grok Imagine Image-to-Image', '{"supports_image_input": true}'::jsonb, 1.0),
('kie', 'grok-imagine/upscale', 'edit', 'Grok Imagine Upscale', '{"supports_image_input": true}'::jsonb, 0.8),

-- GPT Image models
('kie', 'gpt-image/1.5-text-to-image', 'image', 'GPT Image 1.5 Text-to-Image', '{"supports_image_input": false}'::jsonb, 1.0),
('kie', 'gpt-image/1.5-image-to-image', 'edit', 'GPT Image 1.5 Image-to-Image', '{"supports_image_input": true}'::jsonb, 1.0),

-- Topaz
('kie', 'topaz/image-upscale', 'edit', 'Topaz Image Upscale', '{"supports_image_input": true}'::jsonb, 0.8),

-- Recraft models
('kie', 'recraft/remove-background', 'edit', 'Recraft Remove Background', '{"supports_image_input": true}'::jsonb, 0.5),
('kie', 'recraft/crisp-upscale', 'edit', 'Recraft Crisp Upscale', '{"supports_image_input": true}'::jsonb, 0.8),

-- Ideogram models
('kie', 'ideogram/character', 'image', 'Ideogram Character', '{"supports_image_input": false}'::jsonb, 1.0),
('kie', 'ideogram/character-edit', 'edit', 'Ideogram Character Edit', '{"supports_image_input": true}'::jsonb, 1.0),
('kie', 'ideogram/character-remix', 'edit', 'Ideogram Character Remix', '{"supports_image_input": true}'::jsonb, 1.0),
('kie', 'ideogram/v3-reframe', 'edit', 'Ideogram V3 Reframe', '{"supports_image_input": true}'::jsonb, 1.0)

ON CONFLICT (key) DO NOTHING;

-- Video models
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
-- Grok Imagine video
('kie', 'grok-imagine/text-to-video', 'video', 'Grok Imagine Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'grok-imagine/image-to-video', 'video', 'Grok Imagine Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),

-- Kling models
('kie', 'kling/text-to-video', 'video', 'Kling Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/image-to-video', 'video', 'Kling Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/ai-avatar-v1-pro', 'video', 'Kling AI Avatar V1 Pro', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'kling/v1-avatar-standard', 'video', 'Kling V1 Avatar Standard', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-master-text-to-video', 'video', 'Kling V2.1 Master Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-master-image-to-video', 'video', 'Kling V2.1 Master Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-pro', 'video', 'Kling V2.1 Pro', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-standard', 'video', 'Kling V2.1 Standard', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/motion-control', 'video', 'Kling Motion Control', '{"supports_image_input": true, "supports_video_input": false, "supports_start_frame": true}'::jsonb, 2.5),

-- ByteDance models
('kie', 'bytedance/seedance-1.5-pro', 'video', 'ByteDance Seedance 1.5 Pro', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-pro-fast-image-to-video', 'video', 'ByteDance V1 Pro Fast Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'bytedance/v1-pro-image-to-video', 'video', 'ByteDance V1 Pro Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-pro-text-to-video', 'video', 'ByteDance V1 Pro Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-lite-image-to-video', 'video', 'ByteDance V1 Lite Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'bytedance/v1-lite-text-to-video', 'video', 'ByteDance V1 Lite Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),

-- Hailuo models
('kie', 'hailuo/02-text-to-video-pro', 'video', 'Hailuo 02 Text-to-Video Pro', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/02-text-to-video-standard', 'video', 'Hailuo 02 Text-to-Video Standard', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'hailuo/02-image-to-video-pro', 'video', 'Hailuo 02 Image-to-Video Pro', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/02-image-to-video-standard', 'video', 'Hailuo 02 Image-to-Video Standard', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'hailuo/2-3-image-to-video-pro', 'video', 'Hailuo 2-3 Image-to-Video Pro', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/2-3-image-to-video-standard', 'video', 'Hailuo 2-3 Image-to-Video Standard', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),

-- Sora2 models
('kie', 'sora2/sora-2-text-to-video', 'video', 'Sora2 Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora2/sora-2-image-to-video', 'video', 'Sora2 Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora2/sora-2-pro-text-to-video', 'video', 'Sora2 Pro Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 3.5),
('kie', 'sora2/sora-2-pro-image-to-video', 'video', 'Sora2 Pro Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 3.5),
('kie', 'sora2/sora-watermark-remover', 'video', 'Sora2 Watermark Remover', '{"supports_video_input": true}'::jsonb, 1.5),
('kie', 'sora2/sora-2-characters', 'video', 'Sora2 Characters', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora-2-pro-storyboard', 'video', 'Sora2 Pro Storyboard', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 3.5),

-- Wan models
('kie', 'wan/2-6-text-to-video', 'video', 'Wan 2-6 Text-to-Video', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-6-image-to-video', 'video', 'Wan 2-6 Image-to-Video', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-6-video-to-video', 'video', 'Wan 2-6 Video-to-Video', '{"supports_video_input": true}'::jsonb, 2.5),
('kie', 'wan/2-2-a14b-text-to-video-turbo', 'video', 'Wan 2-2 A14B Text-to-Video Turbo', '{"supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-2-a14b-image-to-video-turbo', 'video', 'Wan 2-2 A14B Image-to-Video Turbo', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-2-animate-move', 'video', 'Wan 2-2 Animate Move', '{"supports_image_input": true, "supports_video_input": false, "supports_start_frame": true}'::jsonb, 2.5),
('kie', 'wan/2-2-animate-replace', 'video', 'Wan 2-2 Animate Replace', '{"supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'wan/2-2-a14b-speech-to-video-turbo', 'video', 'Wan 2-2 A14B Speech-to-Video Turbo', '{"supports_audio_input": true}'::jsonb, 2.5)

ON CONFLICT (key) DO NOTHING;

-- Audio models
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
-- ElevenLabs models
('kie', 'elevenlabs/text-to-speech-multilingual-v2', 'audio', 'ElevenLabs Text-to-Speech Multilingual V2', '{"supports_audio_input": false}'::jsonb, 1.0),
('kie', 'elevenlabs/speech-to-text', 'audio', 'ElevenLabs Speech-to-Text', '{"supports_audio_input": true}'::jsonb, 0.8),
('kie', 'elevenlabs/sound-effect-v2', 'audio', 'ElevenLabs Sound Effect V2', '{"supports_audio_input": false}'::jsonb, 0.8),
('kie', 'elevenlabs/audio-isolation', 'audio', 'ElevenLabs Audio Isolation', '{"supports_audio_input": true}'::jsonb, 1.0),

-- Infinitalk
('kie', 'infinitalk/from-audio', 'audio', 'Infinitalk From Audio', '{"supports_audio_input": true}'::jsonb, 1.0)

ON CONFLICT (key) DO NOTHING;
