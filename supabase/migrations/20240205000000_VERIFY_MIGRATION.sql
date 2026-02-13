-- Verification queries for migration 20240205000000_fix_key_column_and_video_models.sql
-- Run these queries to verify that the migration was applied successfully

-- 1. Check if is_enabled column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'models' 
  AND column_name = 'is_enabled';

-- 2. Check special video models (Veo3, Runway, Luma)
SELECT 
  key,
  title,
  modality,
  capabilities->>'family' AS api_family,
  capabilities->>'model_identifier' AS model_identifier,
  capabilities->>'requires_callback' AS requires_callback,
  is_enabled
FROM models 
WHERE provider = 'kie' 
  AND modality = 'video'
  AND (
    key LIKE '%veo3%' OR 
    key LIKE '%runway%' OR 
    key LIKE '%luma%'
  )
ORDER BY key;

-- 3. Check all video models and their api_family
SELECT 
  key,
  title,
  capabilities->>'family' AS api_family,
  capabilities->>'model_identifier' AS model_identifier,
  capabilities->>'requires_callback' AS requires_callback
FROM models 
WHERE provider = 'kie' 
  AND modality = 'video'
ORDER BY capabilities->>'family', key;

-- 4. Count video models by api_family
SELECT 
  capabilities->>'family' AS api_family,
  COUNT(*) AS model_count
FROM models 
WHERE provider = 'kie' 
  AND modality = 'video'
GROUP BY capabilities->>'family'
ORDER BY api_family;

-- 5. Check if views exist
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('models_view', 'presets_view')
ORDER BY table_name;

-- 6. Check models_view structure
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'models_view'
ORDER BY ordinal_position;

-- 7. Verify that all KIE models have model_identifier
SELECT 
  COUNT(*) AS total_kie_models,
  COUNT(CASE WHEN capabilities->>'model_identifier' IS NOT NULL THEN 1 END) AS with_model_identifier,
  COUNT(CASE WHEN capabilities->>'model_identifier' IS NULL THEN 1 END) AS without_model_identifier
FROM models 
WHERE provider = 'kie';

-- 8. List models without model_identifier (should be 0)
SELECT 
  key,
  title,
  modality
FROM models 
WHERE provider = 'kie' 
  AND (capabilities->>'model_identifier' IS NULL OR capabilities->>'model_identifier' = '');
