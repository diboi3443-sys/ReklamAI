-- Remove old placeholder KIE models that don't have proper model_identifier
-- These were from initial seed and are replaced by real models from registry

DELETE FROM models
WHERE provider = 'kie'
  AND (
    key = 'kie-flux-pro'
    OR key = 'kie-video-1'
    OR key = 'kie-edit-1'
  )
  AND (capabilities->>'model_identifier' IS NULL OR capabilities->>'model_identifier' = '');
