-- Create assets table if it doesn't exist
-- This table stores references to files in storage buckets (uploads, outputs)

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('input', 'output', 'thumb')),
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  provider_url TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_generation ON assets(generation_id);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_kind ON assets(kind);

-- RLS Policies for assets table
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own assets
CREATE POLICY "Users can view own assets"
  ON assets
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Service role can do everything (for Edge Functions)
CREATE POLICY "Service role can manage assets"
  ON assets
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
