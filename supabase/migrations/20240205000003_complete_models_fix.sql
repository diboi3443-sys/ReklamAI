-- Complete fix for all models configuration
-- This migration ensures ALL models have correct capabilities

-- ============================================================================
-- PART 1: Add is_enabled column if missing
-- ============================================================================
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
  END IF;
END $$;

-- ============================================================================
-- PART 2: Fix ALL KIE models - ensure model_identifier exists
-- ============================================================================
DO $$
DECLARE
  model_record RECORD;
  updated_capabilities JSONB;
  model_identifier_value TEXT;
BEGIN
  FOR model_record IN 
    SELECT id, key, capabilities
    FROM models 
    WHERE provider = 'kie'
      AND (capabilities->>'model_identifier' IS NULL OR capabilities->>'model_identifier' = '')
  LOOP
    -- Use key as model_identifier (KIE model keys should be KIE identifiers)
    model_identifier_value := model_record.key;
    
    updated_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb) 
      || jsonb_build_object('model_identifier', model_identifier_value);
    
    UPDATE models 
    SET capabilities = updated_capabilities
    WHERE id = model_record.id;
    
    RAISE NOTICE 'Added model_identifier for: %', model_record.key;
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: Fix VIDEO models - set correct api_family
-- ============================================================================
DO $$
DECLARE
  model_record RECORD;
  api_family_value TEXT;
  updated_capabilities JSONB;
BEGIN
  FOR model_record IN 
    SELECT id, key, capabilities
    FROM models 
    WHERE modality = 'video' AND provider = 'kie'
  LOOP
    -- Determine correct api_family
    IF model_record.key LIKE '%veo3%' OR model_record.key LIKE '%veo-3%' THEN
      api_family_value := 'veo3';
    ELSIF model_record.key LIKE '%runway%' OR model_record.key LIKE '%gen3%' OR model_record.key LIKE '%gen4%' THEN
      api_family_value := 'runway';
    ELSIF model_record.key LIKE '%luma%' OR model_record.key LIKE '%dream-machine%' OR model_record.key LIKE '%ray%' THEN
      api_family_value := 'luma';
    ELSE
      api_family_value := 'market'; -- Default for Kling, etc.
    END IF;
    
    -- Update if different
    IF (model_record.capabilities->>'family') IS DISTINCT FROM api_family_value THEN
      updated_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb) 
        || jsonb_build_object('family', api_family_value);
      
      -- Also set requires_callback for special APIs
      IF api_family_value IN ('veo3', 'runway', 'luma') THEN
        updated_capabilities := updated_capabilities || jsonb_build_object('requires_callback', true);
      END IF;
      
      UPDATE models 
      SET capabilities = updated_capabilities
      WHERE id = model_record.id;
      
      RAISE NOTICE 'Updated video model %: family=%, requires_callback=%', 
        model_record.key, api_family_value, 
        CASE WHEN api_family_value IN ('veo3', 'runway', 'luma') THEN 'true' ELSE 'false' END;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 4: Fix IMAGE models - set correct api_family
-- ============================================================================
DO $$
DECLARE
  model_record RECORD;
  api_family_value TEXT;
  updated_capabilities JSONB;
BEGIN
  FOR model_record IN 
    SELECT id, key, capabilities
    FROM models 
    WHERE modality = 'image' AND provider = 'kie'
  LOOP
    -- Determine correct api_family
    IF model_record.key LIKE '%flux-kontext%' THEN
      api_family_value := 'flux-kontext';
    ELSIF model_record.key LIKE '%gpt4o%' OR model_record.key LIKE '%4o-image%' THEN
      api_family_value := '4o-image';
    ELSE
      api_family_value := 'market'; -- Default for most image models
    END IF;
    
    -- Update if different
    IF (model_record.capabilities->>'family') IS DISTINCT FROM api_family_value THEN
      updated_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb) 
        || jsonb_build_object('family', api_family_value);
      
      -- Set requires_callback for special APIs
      IF api_family_value IN ('flux-kontext', '4o-image') THEN
        updated_capabilities := updated_capabilities || jsonb_build_object('requires_callback', true);
      END IF;
      
      UPDATE models 
      SET capabilities = updated_capabilities
      WHERE id = model_record.id;
      
      RAISE NOTICE 'Updated image model %: family=%', model_record.key, api_family_value;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 5: Fix AUDIO models - set correct api_family
-- ============================================================================
DO $$
DECLARE
  model_record RECORD;
  api_family_value TEXT;
  updated_capabilities JSONB;
BEGIN
  FOR model_record IN 
    SELECT id, key, capabilities
    FROM models 
    WHERE modality = 'audio' AND provider = 'kie'
  LOOP
    -- Determine correct api_family
    IF model_record.key LIKE '%suno%' OR model_record.key LIKE '%chirp%' THEN
      api_family_value := 'suno';
    ELSE
      api_family_value := 'market'; -- Default for ElevenLabs, etc.
    END IF;
    
    -- Update if different
    IF (model_record.capabilities->>'family') IS DISTINCT FROM api_family_value THEN
      updated_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb) 
        || jsonb_build_object('family', api_family_value);
      
      -- Set requires_callback for Suno
      IF api_family_value = 'suno' THEN
        updated_capabilities := updated_capabilities || jsonb_build_object('requires_callback', true);
      END IF;
      
      UPDATE models 
      SET capabilities = updated_capabilities
      WHERE id = model_record.id;
      
      RAISE NOTICE 'Updated audio model %: family=%', model_record.key, api_family_value;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 6: Enable all models by default
-- ============================================================================
UPDATE models SET is_enabled = true WHERE is_enabled IS NULL OR is_enabled = false;

-- ============================================================================
-- PART 7: Final report
-- ============================================================================
DO $$
DECLARE
  total_count INTEGER;
  video_count INTEGER;
  image_count INTEGER;
  audio_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM models WHERE provider = 'kie';
  SELECT COUNT(*) INTO video_count FROM models WHERE provider = 'kie' AND modality = 'video';
  SELECT COUNT(*) INTO image_count FROM models WHERE provider = 'kie' AND modality = 'image';
  SELECT COUNT(*) INTO audio_count FROM models WHERE provider = 'kie' AND modality = 'audio';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Models configuration complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total KIE models: %', total_count;
  RAISE NOTICE '  Video models: %', video_count;
  RAISE NOTICE '  Image models: %', image_count;
  RAISE NOTICE '  Audio models: %', audio_count;
  RAISE NOTICE '========================================';
END $$;

-- Show final state
SELECT 
  modality,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE capabilities->>'family' IS NOT NULL) as with_family,
  COUNT(*) FILTER (WHERE capabilities->>'model_identifier' IS NOT NULL) as with_identifier,
  COUNT(*) FILTER (WHERE (capabilities->>'requires_callback')::boolean = true) as with_callback
FROM models
WHERE provider = 'kie'
GROUP BY modality
ORDER BY modality;
