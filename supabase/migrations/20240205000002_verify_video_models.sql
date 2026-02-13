-- Verify and fix video models configuration
-- This script checks video models and ensures they have correct configuration

-- ============================================================================
-- PART 1: Check current video models configuration
-- ============================================================================

DO $$
DECLARE
  model_record RECORD;
  issues_found INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking video models configuration...';
  RAISE NOTICE '========================================';
  
  FOR model_record IN 
    SELECT 
      id,
      key,
      title,
      capabilities,
      capabilities->>'family' as api_family,
      capabilities->>'model_identifier' as model_identifier,
      capabilities->>'requires_callback' as requires_callback
    FROM models 
    WHERE modality = 'video' AND provider = 'kie'
    ORDER BY key
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE 'Model: % (key: %)', model_record.title, model_record.key;
    RAISE NOTICE '  API Family: %', COALESCE(model_record.api_family, 'NULL');
    RAISE NOTICE '  Model Identifier: %', COALESCE(model_record.model_identifier, 'NULL');
    RAISE NOTICE '  Requires Callback: %', COALESCE(model_record.requires_callback, 'NULL');
    
    -- Check for issues
    IF model_record.api_family IS NULL OR model_record.api_family = '' THEN
      RAISE WARNING '  ⚠️  Missing api_family!';
      issues_found := issues_found + 1;
    END IF;
    
    IF model_record.model_identifier IS NULL OR model_record.model_identifier = '' THEN
      RAISE WARNING '  ⚠️  Missing model_identifier!';
      issues_found := issues_found + 1;
    END IF;
    
    IF model_record.api_family IN ('veo3', 'runway', 'luma') AND 
       (model_record.requires_callback IS NULL OR model_record.requires_callback != 'true') THEN
      RAISE WARNING '  ⚠️  requires_callback should be true for special APIs!';
      issues_found := issues_found + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  IF issues_found > 0 THEN
    RAISE WARNING 'Found % issues!', issues_found;
  ELSE
    RAISE NOTICE 'All video models are configured correctly!';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PART 2: Fix common issues
-- ============================================================================

-- Fix missing api_family for video models
DO $$
DECLARE
  model_record RECORD;
  api_family_value TEXT;
  updated_capabilities JSONB;
BEGIN
  FOR model_record IN 
    SELECT id, key, capabilities
    FROM models 
    WHERE modality = 'video' 
      AND provider = 'kie'
      AND (capabilities->>'family' IS NULL OR capabilities->>'family' = '')
  LOOP
    -- Determine api_family based on model key
    IF model_record.key LIKE '%veo3%' OR model_record.key LIKE '%veo-3%' THEN
      api_family_value := 'veo3';
    ELSIF model_record.key LIKE '%runway%' OR model_record.key LIKE '%gen3%' OR model_record.key LIKE '%gen4%' THEN
      api_family_value := 'runway';
    ELSIF model_record.key LIKE '%luma%' OR model_record.key LIKE '%dream-machine%' OR model_record.key LIKE '%ray-2%' THEN
      api_family_value := 'luma';
    ELSE
      api_family_value := 'market';
    END IF;
    
    updated_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb) || jsonb_build_object('family', api_family_value);
    
    UPDATE models 
    SET capabilities = updated_capabilities
    WHERE id = model_record.id;
    
    RAISE NOTICE 'Fixed api_family for model %: %', model_record.key, api_family_value;
  END LOOP;
END $$;

-- Fix missing model_identifier
DO $$
DECLARE
  model_record RECORD;
  model_identifier_value TEXT;
  updated_capabilities JSONB;
BEGIN
  FOR model_record IN 
    SELECT id, key, capabilities
    FROM models 
    WHERE modality = 'video' 
      AND provider = 'kie'
      AND (capabilities->>'model_identifier' IS NULL OR capabilities->>'model_identifier' = '')
  LOOP
    -- Extract model_identifier from key or use key itself
    IF model_record.key LIKE '%veo3%' THEN
      model_identifier_value := 'veo3';
    ELSIF model_record.key LIKE '%gen3a_turbo%' THEN
      model_identifier_value := 'gen3a_turbo';
    ELSIF model_record.key LIKE '%gen4_turbo%' THEN
      model_identifier_value := 'gen4_turbo';
    ELSIF model_record.key LIKE '%dream-machine%' THEN
      model_identifier_value := 'dream-machine';
    ELSIF model_record.key LIKE '%ray-2%' THEN
      model_identifier_value := 'ray-2';
    ELSE
      -- Use key as fallback
      model_identifier_value := model_record.key;
    END IF;
    
    updated_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb) || jsonb_build_object('model_identifier', model_identifier_value);
    
    UPDATE models 
    SET capabilities = updated_capabilities
    WHERE id = model_record.id;
    
    RAISE NOTICE 'Fixed model_identifier for model %: %', model_record.key, model_identifier_value;
  END LOOP;
END $$;

-- Fix requires_callback for special APIs
DO $$
DECLARE
  model_record RECORD;
  updated_capabilities JSONB;
BEGIN
  FOR model_record IN 
    SELECT id, key, capabilities
    FROM models 
    WHERE modality = 'video' 
      AND provider = 'kie'
      AND capabilities->>'family' IN ('veo3', 'runway', 'luma')
      AND (capabilities->>'requires_callback' IS NULL OR capabilities->>'requires_callback' != 'true')
  LOOP
    updated_capabilities := COALESCE(model_record.capabilities, '{}'::jsonb) || jsonb_build_object('requires_callback', true);
    
    UPDATE models 
    SET capabilities = updated_capabilities
    WHERE id = model_record.id;
    
    RAISE NOTICE 'Fixed requires_callback for model %', model_record.key;
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: Final report
-- ============================================================================

SELECT 
  key,
  title,
  capabilities->>'family' as api_family,
  capabilities->>'model_identifier' as model_identifier,
  capabilities->>'requires_callback' as requires_callback,
  is_enabled
FROM models
WHERE modality = 'video' 
  AND provider = 'kie'
ORDER BY key;
