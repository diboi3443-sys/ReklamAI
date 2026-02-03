-- SQL script to create Storage buckets via Supabase Dashboard
-- Note: Storage buckets cannot be created via SQL directly
-- Use Supabase Dashboard > Storage > New bucket

-- Instructions:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Create bucket "uploads" with:
--    - Name: uploads
--    - Public: OFF (private)
--    - File size limit: 50MB (or as needed)
-- 4. Create bucket "outputs" with:
--    - Name: outputs
--    - Public: OFF (private)
--    - File size limit: 100MB (or as needed)

-- Alternative: Use Supabase CLI (if available)
-- supabase storage create uploads --public false
-- supabase storage create outputs --public false

-- Storage policies (RLS for Storage) - can be set via Dashboard or SQL:
-- Note: These are Storage policies, not table RLS policies

-- Policy: Users can upload to their own folder in uploads bucket
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
  'Users can upload to their own folder',
  'uploads',
  '(bucket_id = ''uploads''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)',
  '(bucket_id = ''uploads''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)'
) ON CONFLICT DO NOTHING;

-- Policy: Users can read from their own folder in uploads bucket
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
  'Users can read from their own folder in uploads',
  'uploads',
  '(bucket_id = ''uploads''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)',
  '(bucket_id = ''uploads''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)'
) ON CONFLICT DO NOTHING;

-- Policy: Users can read from outputs bucket (for their generations)
-- Note: This assumes outputs are organized by generation_id or user_id
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
  'Users can read outputs',
  'outputs',
  '(bucket_id = ''outputs''::text) AND EXISTS (
    SELECT 1 FROM public.generations g
    WHERE g.owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.generation_id = g.id
      AND a.storage_path = name
    )
  )',
  '(bucket_id = ''outputs''::text) AND EXISTS (
    SELECT 1 FROM public.generations g
    WHERE g.owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.generation_id = g.id
      AND a.storage_path = name
    )
  )'
) ON CONFLICT DO NOTHING;
