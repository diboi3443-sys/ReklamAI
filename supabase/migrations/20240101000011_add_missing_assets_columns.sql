-- Safe migration: Add missing columns to assets table if they don't exist
-- This migration is idempotent and safe to run multiple times
-- It will NOT drop or modify existing data

-- Add missing columns to assets table (if they don't exist)
DO $$
BEGIN
  -- Add 'kind' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'kind'
  ) THEN
    ALTER TABLE assets ADD COLUMN kind TEXT;
    -- Set default value for existing rows
    UPDATE assets SET kind = 'output' WHERE kind IS NULL;
    -- Add NOT NULL constraint and CHECK constraint
    ALTER TABLE assets ALTER COLUMN kind SET NOT NULL;
    ALTER TABLE assets ADD CONSTRAINT assets_kind_check CHECK (kind IN ('input', 'output', 'thumb'));
  END IF;

  -- Add 'storage_bucket' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'storage_bucket'
  ) THEN
    ALTER TABLE assets ADD COLUMN storage_bucket TEXT;
    -- Set default value for existing rows
    UPDATE assets SET storage_bucket = 'outputs' WHERE storage_bucket IS NULL;
    ALTER TABLE assets ALTER COLUMN storage_bucket SET NOT NULL;
  END IF;

  -- Add 'storage_path' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE assets ADD COLUMN storage_path TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add 'provider_url' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'provider_url'
  ) THEN
    ALTER TABLE assets ADD COLUMN provider_url TEXT;
  END IF;

  -- Add 'meta' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'meta'
  ) THEN
    ALTER TABLE assets ADD COLUMN meta JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add 'generation_id' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'generation_id'
  ) THEN
    ALTER TABLE assets ADD COLUMN generation_id UUID REFERENCES generations(id) ON DELETE CASCADE;
  END IF;

  -- Add 'owner_id' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE assets ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    -- Set default value for existing rows (if possible)
    -- Note: This might fail if there's no way to determine owner_id from existing data
    -- In that case, you'll need to set it manually
    ALTER TABLE assets ALTER COLUMN owner_id SET NOT NULL;
  END IF;

  -- Add 'created_at' column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'assets'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE assets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;
END $$;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_assets_generation ON assets(generation_id);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_kind ON assets(kind);

-- Enable RLS (idempotent)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
DROP POLICY IF EXISTS "Users can create assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;
DROP POLICY IF EXISTS "Service role can manage assets" ON assets;
DROP POLICY IF EXISTS "Admins can view all assets" ON assets;

-- Create RLS policies
CREATE POLICY "Users can view their own assets"
  ON assets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create assets"
  ON assets FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  USING (owner_id = auth.uid());

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role can manage assets"
  ON assets FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Optional: Admins can view all assets (if needed)
CREATE POLICY "Admins can view all assets"
  ON assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
