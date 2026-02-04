-- Add Flux-2 models that use Market API (work with recordInfo endpoint)

INSERT INTO models (key, title, modality, provider, capabilities) VALUES
  ('flux-2/pro-text-to-image', 'Flux 2 Pro (Text to Image)', 'image', 'kie', 
   '{"family": "market", "model_identifier": "flux-2/pro-text-to-image", "docs_url": "https://docs.kie.ai/market/flux2/pro-text-to-image"}'::jsonb),
  ('flux-2/pro-image-to-image', 'Flux 2 Pro (Image to Image)', 'edit', 'kie',
   '{"family": "market", "model_identifier": "flux-2/pro-image-to-image", "supports_image_input": true, "docs_url": "https://docs.kie.ai/market/flux2/pro-image-to-image"}'::jsonb),
  ('flux-2/flex-text-to-image', 'Flux 2 Flex (Text to Image)', 'image', 'kie',
   '{"family": "market", "model_identifier": "flux-2/flex-text-to-image", "docs_url": "https://docs.kie.ai/market/flux2/flex-text-to-image"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  modality = EXCLUDED.modality,
  capabilities = EXCLUDED.capabilities;

-- Update Flux Kontext models to use callback approach
-- (They need callBackUrl parameter for status updates)
UPDATE models 
SET capabilities = capabilities || '{"requires_callback": true}'::jsonb
WHERE key IN ('flux-kontext-pro', 'flux-kontext-max');
