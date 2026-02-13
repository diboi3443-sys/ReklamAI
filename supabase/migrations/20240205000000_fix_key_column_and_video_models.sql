-- Fix key column issue and video models configuration
-- This migration addresses:
-- 1. The 'key' column is a reserved word in Postgres, causing 400 errors in PostgREST
-- 2. Video models may have incorrect api_family configuration

-- ============================================================================
-- PART 1: Check current structure and prepare for key column rename
-- ============================================================================

-- Check if key column exists in models and presets
DO $$
DECLARE
  models_has_key BOOLEAN;
  presets_has_key BOOLEAN;
BEGIN
  -- Check models table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'models' 
    AND column_name = 'key'
  ) INTO models_has_key;
  
  -- Check presets table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'presets' 
    AND column_name = 'key'
  ) INTO presets_has_key;
  
  RAISE NOTICE 'Models table has key column: %', models_has_key;
  RAISE NOTICE 'Presets table has key column: %', presets_has_key;
END $$;

-- ============================================================================
-- PART 2: Add is_enabled column if it doesn't exist
-- ============================================================================

-- Add is_enabled column to models table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'models' 
    AND column_name = 'is_enabled'
  ) THEN
    ALTER TABLE models ADD COLUMN is_enabled BOOLEAN DEFAULT true NOT NULL;
    RAISE NOTICE 'Added is_enabled column to models table';
  ELSE
    RAISE NOTICE 'is_enabled column already exists in models table';
  END IF;
END $$;

-- ============================================================================
-- PART 3: Add special video models if they don't exist (Veo3, Runway, Luma)
-- ============================================================================

-- Insert special video models if they don't exist
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier, is_enabled) VALUES
-- Veo3 models
('kie', 'veo3/text-to-video', 'video', 'Google Veo 3 Text-to-Video',
 '{"model_identifier": "veo3/text-to-video", "family": "veo3", "requires_input": false, "input_kinds": [], "requires_callback": true, "docs_url": "https://docs.kie.ai/veo3-api/quickstart"}'::jsonb, 3.0, true),
('kie', 'veo3/image-to-video', 'video', 'Google Veo 3 Image-to-Video',
 '{"model_identifier": "veo3/image-to-video", "family": "veo3", "requires_input": true, "input_kinds": ["image"], "requires_callback": true, "docs_url": "https://docs.kie.ai/veo3-api/quickstart"}'::jsonb, 3.0, true),

-- Runway models (model_identifier should match KIE API format)
('kie', 'runway/gen3a_turbo', 'video', 'Runway Gen-3 Alpha Turbo',
 '{"model_identifier": "gen3a_turbo", "family": "runway", "requires_input": false, "input_kinds": [], "requires_callback": true, "docs_url": "https://docs.kie.ai/runway-api/quickstart"}'::jsonb, 2.5, true),
('kie', 'runway/gen4_turbo', 'video', 'Runway Gen-4 Turbo',
 '{"model_identifier": "gen4_turbo", "family": "runway", "requires_input": false, "input_kinds": [], "requires_callback": true, "docs_url": "https://docs.kie.ai/runway-api/quickstart"}'::jsonb, 3.0, true),

-- Luma models
('kie', 'luma/dream-machine', 'video', 'Luma Dream Machine',
 '{"model_identifier": "dream-machine", "family": "luma", "requires_input": false, "input_kinds": [], "requires_callback": true, "docs_url": "https://docs.kie.ai/luma-api/quickstart"}'::jsonb, 2.5, true),
('kie', 'luma/ray-2', 'video', 'Luma Ray-2',
 '{"model_identifier": "ray-2", "family": "luma", "requires_input": false, "input_kinds": [], "requires_callback": true, "docs_url": "https://docs.kie.ai/luma-api/quickstart"}'::jsonb, 2.5, true)

ON CONFLICT (key) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  title = EXCLUDED.title,
  modality = EXCLUDED.modality,
  price_multiplier = EXCLUDED.price_multiplier,
  is_enabled = EXCLUDED.is_enabled;

-- ============================================================================
-- PART 4: Fix video models - ensure correct api_family in capabilities
-- ============================================================================

-- Update video models to have correct api_family in capabilities JSONB
-- This ensures video models use the correct KIE API endpoints

DO $$
DECLARE
  model_record RECORD;
  current_capabilities JSONB;
  updated_capabilities JSONB;
  api_family_value TEXT;
BEGIN
  -- Loop through all video models
  FOR model_record IN 
    SELECT id, key, title, capabilities, provider
    FROM models 
    WHERE modality = 'video' AND provider = 'kie'
  LOOP
    current_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb);
    api_family_value := current_capabilities->>'family';
    
    -- Determine correct api_family based on model key
    IF model_record.key LIKE '%veo3%' OR model_record.key LIKE '%veo-3%' THEN
      api_family_value := 'veo3';
    ELSIF model_record.key LIKE '%runway%' OR model_record.key LIKE '%gen3%' OR model_record.key LIKE '%gen4%' THEN
      api_family_value := 'runway';
    ELSIF model_record.key LIKE '%luma%' OR model_record.key LIKE '%dream-machine%' OR model_record.key LIKE '%ray-2%' THEN
      api_family_value := 'luma';
    ELSIF model_record.key LIKE '%kling%' THEN
      api_family_value := 'market'; -- Kling uses Market API
    ELSE
      -- Default to market if not specified
      IF api_family_value IS NULL OR api_family_value = '' THEN
        api_family_value := 'market';
      END IF;
    END IF;
    
    -- Update capabilities if api_family is missing or incorrect
    IF (current_capabilities->>'family') IS DISTINCT FROM api_family_value THEN
      updated_capabilities := current_capabilities || jsonb_build_object('family', api_family_value);
      
      UPDATE models 
      SET capabilities = updated_capabilities
      WHERE id = model_record.id;
      
      RAISE NOTICE 'Updated model % (key: %) with api_family: %', 
        model_record.title, model_record.key, api_family_value;
    END IF;
    
    -- Ensure requires_callback is set for special APIs
    IF api_family_value IN ('veo3', 'runway', 'luma', 'flux-kontext', '4o-image', 'suno') THEN
      IF (current_capabilities->>'requires_callback') IS DISTINCT FROM 'true' THEN
        updated_capabilities := COALESCE(updated_capabilities, current_capabilities) 
          || jsonb_build_object('requires_callback', true);
        
        UPDATE models 
        SET capabilities = updated_capabilities
        WHERE id = model_record.id;
        
        RAISE NOTICE 'Set requires_callback=true for model % (key: %)', 
          model_record.title, model_record.key;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 5: Ensure model_identifier is set in capabilities for all KIE models
-- ============================================================================

-- For KIE models, model_identifier should match the key (or be explicitly set)
DO $$
DECLARE
  model_record RECORD;
  current_capabilities JSONB;
  updated_capabilities JSONB;
  model_identifier_value TEXT;
BEGIN
  FOR model_record IN 
    SELECT id, key, title, capabilities
    FROM models 
    WHERE provider = 'kie'
  LOOP
    current_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb);
    model_identifier_value := current_capabilities->>'model_identifier';
    
    -- If model_identifier is missing, use key as default
    IF model_identifier_value IS NULL OR model_identifier_value = '' THEN
      updated_capabilities := current_capabilities || jsonb_build_object('model_identifier', model_record.key);
      
      UPDATE models 
      SET capabilities = updated_capabilities
      WHERE id = model_record.id;
      
      RAISE NOTICE 'Set model_identifier=% for model % (key: %)', 
        model_record.key, model_record.title, model_record.key;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 6: Create a view that aliases 'key' to avoid PostgREST issues
-- ============================================================================

-- Create views with aliased columns to avoid 'key' reserved word issues
-- These views can be used as an alternative to direct table queries

DROP VIEW IF EXISTS models_view;
CREATE VIEW models_view AS
SELECT 
  id,
  provider,
  key AS model_key,  -- Alias 'key' to 'model_key'
  modality,
  title,
  capabilities,
  price_multiplier,
  is_enabled,
  created_at
FROM models;

DROP VIEW IF EXISTS presets_view;
CREATE VIEW presets_view AS
SELECT 
  id,
  type,
  key AS preset_key,  -- Alias 'key' to 'preset_key'
  title_ru,
  title_en,
  description_ru,
  description_en,
  defaults,
  created_at
FROM presets;

-- Grant permissions on views
GRANT SELECT ON models_view TO authenticated;
GRANT SELECT ON presets_view TO authenticated;

-- ============================================================================
-- PART 7: Summary report
-- ============================================================================

-- Generate a summary of video models and their configuration
DO $$
DECLARE
  video_model_count INTEGER;
  veo3_count INTEGER;
  runway_count INTEGER;
  luma_count INTEGER;
  market_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO video_model_count
  FROM models 
  WHERE modality = 'video' AND provider = 'kie';
  
  SELECT COUNT(*) INTO veo3_count
  FROM models 
  WHERE modality = 'video' 
    AND provider = 'kie'
    AND capabilities->>'family' = 'veo3';
  
  SELECT COUNT(*) INTO runway_count
  FROM models 
  WHERE modality = 'video' 
    AND provider = 'kie'
    AND capabilities->>'family' = 'runway';
  
  SELECT COUNT(*) INTO luma_count
  FROM models 
  WHERE modality = 'video' 
    AND provider = 'kie'
    AND capabilities->>'family' = 'luma';
  
  SELECT COUNT(*) INTO market_count
  FROM models 
  WHERE modality = 'video' 
    AND provider = 'kie'
    AND capabilities->>'family' = 'market';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Video Models Summary:';
  RAISE NOTICE 'Total video models: %', video_model_count;
  RAISE NOTICE 'Veo3 models: %', veo3_count;
  RAISE NOTICE 'Runway models: %', runway_count;
  RAISE NOTICE 'Luma models: %', luma_count;
  RAISE NOTICE 'Market API models: %', market_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. The 'key' column is NOT renamed in this migration because:
--    - It would require updating all code that references model.key and preset.key
--    - The frontend code has been updated to exclude 'key' from select queries
--    - Views are created as an alternative (models_view, presets_view)
--
-- 2. To use the views instead of tables:
--    - Change: SELECT * FROM models
--    - To: SELECT * FROM models_view
--    - Then use model_key instead of key
--
-- 3. Video models are automatically configured with correct api_family:
--    - Veo3 models → api_family: 'veo3'
--    - Runway models → api_family: 'runway'
--    - Luma models → api_family: 'luma'
--    - Kling models → api_family: 'market'
--
-- 4. Special API models have requires_callback=true set automatically
-- ============================================================================
