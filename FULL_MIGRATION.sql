-- ============================================
-- Migration: 20240101000000_initial_schema.sql
-- ============================================

-- Initial schema for ReklamAI Studio
-- This migration creates all necessary tables, RLS policies, triggers, and functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Board members table (optional minimal collaboration)
CREATE TABLE IF NOT EXISTS board_members (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'owner')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (board_id, user_id)
);

-- Presets table
CREATE TABLE IF NOT EXISTS presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'edit')),
  key TEXT UNIQUE NOT NULL,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ru TEXT,
  description_en TEXT,
  defaults JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  modality TEXT NOT NULL CHECK (modality IN ('image', 'video', 'edit', 'audio')),
  title TEXT NOT NULL,
  capabilities JSONB DEFAULT '{}'::jsonb,
  price_multiplier NUMERIC DEFAULT 1.0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  preset_id UUID REFERENCES presets(id) ON DELETE SET NULL,
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  modality TEXT NOT NULL CHECK (modality IN ('image', 'video', 'edit', 'audio')),
  prompt TEXT NOT NULL,
  input JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')),
  provider_task_id TEXT,
  estimated_credits NUMERIC,
  reserved_credits NUMERIC,
  final_credits NUMERIC,
  error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Assets table
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

-- Credit accounts table
CREATE TABLE IF NOT EXISTS credit_accounts (
  owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Credit ledger table
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'reserve', 'finalize', 'refund', 'adjust')),
  amount NUMERIC NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  markup_percent NUMERIC DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Provider tasks table (tracking provider API calls)
CREATE TABLE IF NOT EXISTS provider_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processing', 'succeeded', 'failed')),
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_owner ON generations(owner_id);
CREATE INDEX IF NOT EXISTS idx_generations_board ON generations(board_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_provider_task ON generations(provider_task_id);
CREATE INDEX IF NOT EXISTS idx_assets_generation ON assets(generation_id);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_owner ON credit_ledger(owner_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_generation ON credit_ledger(generation_id);
CREATE INDEX IF NOT EXISTS idx_provider_tasks_generation ON provider_tasks(generation_id);
CREATE INDEX IF NOT EXISTS idx_provider_tasks_task_id ON provider_tasks(provider, task_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_tasks_updated_at BEFORE UPDATE ON provider_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_board_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user');

  -- Create default board
  INSERT INTO public.boards (owner_id, title, description)
  VALUES (NEW.id, 'My Board', 'Default board')
  RETURNING id INTO default_board_id;

  -- Create credit account with initial balance (e.g., 100 credits)
  INSERT INTO public.credit_accounts (owner_id, balance)
  VALUES (NEW.id, 100);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Credit management functions (atomic operations)
CREATE OR REPLACE FUNCTION rpc_credit_reserve(
  p_owner_id UUID,
  p_generation_id UUID,
  p_amount NUMERIC,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Check balance (with lock)
  SELECT balance INTO current_balance
  FROM credit_accounts
  WHERE owner_id = p_owner_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    -- Create account if doesn't exist
    INSERT INTO credit_accounts (owner_id, balance)
    VALUES (p_owner_id, 0)
    ON CONFLICT (owner_id) DO NOTHING;
    current_balance := 0;
  END IF;

  -- Check if already reserved for this generation (idempotent)
  IF EXISTS (
    SELECT 1 FROM credit_ledger
    WHERE owner_id = p_owner_id
      AND generation_id = p_generation_id
      AND type = 'reserve'
  ) THEN
    RETURN TRUE; -- Already reserved
  END IF;

  -- Check sufficient balance
  IF current_balance < p_amount THEN
    RETURN FALSE; -- Insufficient balance
  END IF;

  -- Reserve credits
  UPDATE credit_accounts
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE owner_id = p_owner_id;

  INSERT INTO credit_ledger (owner_id, generation_id, type, amount, meta)
  VALUES (p_owner_id, p_generation_id, 'reserve', p_amount, p_meta);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_credit_finalize(
  p_owner_id UUID,
  p_generation_id UUID,
  p_final_amount NUMERIC,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  reserved_amount NUMERIC;
  diff_amount NUMERIC;
BEGIN
  -- Get reserved amount
  SELECT COALESCE(SUM(amount), 0) INTO reserved_amount
  FROM credit_ledger
  WHERE owner_id = p_owner_id
    AND generation_id = p_generation_id
    AND type = 'reserve';

  -- Check if already finalized (idempotent)
  IF EXISTS (
    SELECT 1 FROM credit_ledger
    WHERE owner_id = p_owner_id
      AND generation_id = p_generation_id
      AND type = 'finalize'
  ) THEN
    RETURN TRUE; -- Already finalized
  END IF;

  -- Calculate difference
  diff_amount := reserved_amount - p_final_amount;

  -- If final amount is less, refund the difference
  IF diff_amount > 0 THEN
    UPDATE credit_accounts
    SET balance = balance + diff_amount,
        updated_at = NOW()
    WHERE owner_id = p_owner_id;

    INSERT INTO credit_ledger (owner_id, generation_id, type, amount, meta)
    VALUES (p_owner_id, p_generation_id, 'refund', diff_amount, jsonb_build_object('reason', 'finalize_adjustment'));
  ELSIF diff_amount < 0 THEN
    -- If final amount is more, charge the difference
    UPDATE credit_accounts
    SET balance = balance + diff_amount, -- diff_amount is negative
        updated_at = NOW()
    WHERE owner_id = p_owner_id;

    INSERT INTO credit_ledger (owner_id, generation_id, type, amount, meta)
    VALUES (p_owner_id, p_generation_id, 'reserve', ABS(diff_amount), jsonb_build_object('reason', 'finalize_adjustment'));
  END IF;

  -- Record finalize
  INSERT INTO credit_ledger (owner_id, generation_id, type, amount, meta)
  VALUES (p_owner_id, p_generation_id, 'finalize', p_final_amount, p_meta);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_credit_refund(
  p_owner_id UUID,
  p_generation_id UUID,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  reserved_amount NUMERIC;
BEGIN
  -- Get reserved amount
  SELECT COALESCE(SUM(amount), 0) INTO reserved_amount
  FROM credit_ledger
  WHERE owner_id = p_owner_id
    AND generation_id = p_generation_id
    AND type = 'reserve';

  -- Check if already refunded (idempotent)
  IF EXISTS (
    SELECT 1 FROM credit_ledger
    WHERE owner_id = p_owner_id
      AND generation_id = p_generation_id
      AND type = 'refund'
      AND meta->>'reason' = 'generation_failed'
  ) THEN
    RETURN TRUE; -- Already refunded
  END IF;

  IF reserved_amount > 0 THEN
    -- Refund reserved credits
    UPDATE credit_accounts
    SET balance = balance + reserved_amount,
        updated_at = NOW()
    WHERE owner_id = p_owner_id;

    INSERT INTO credit_ledger (owner_id, generation_id, type, amount, meta)
    VALUES (p_owner_id, p_generation_id, 'refund', reserved_amount, jsonb_build_object('reason', 'generation_failed') || p_meta);
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- Migration: 20240101000001_rls_policies.sql
-- ============================================

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Boards policies
CREATE POLICY "Users can view their own boards"
  ON boards FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  USING (owner_id = auth.uid());

-- Board members policies
CREATE POLICY "Users can view board members of their boards"
  ON board_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_members.board_id
        AND (owner_id = auth.uid() OR id IN (
          SELECT board_id FROM board_members WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Board owners can manage members"
  ON board_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_members.board_id AND owner_id = auth.uid()
    )
  );

-- Presets policies (public read)
CREATE POLICY "Everyone can view presets"
  ON presets FOR SELECT
  USING (true);

-- Only admins can modify presets
CREATE POLICY "Admins can manage presets"
  ON presets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Models policies (public read)
CREATE POLICY "Everyone can view models"
  ON models FOR SELECT
  USING (true);

-- Only admins can modify models
CREATE POLICY "Admins can manage models"
  ON models FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Generations policies
CREATE POLICY "Users can view their own generations"
  ON generations FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create generations"
  ON generations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own generations"
  ON generations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own generations"
  ON generations FOR DELETE
  USING (owner_id = auth.uid());

-- Admins can view all generations
CREATE POLICY "Admins can view all generations"
  ON generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assets policies
CREATE POLICY "Users can view their own assets"
  ON assets FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create assets"
  ON assets FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own assets"
  ON assets FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own assets"
  ON assets FOR DELETE
  USING (owner_id = auth.uid());

-- Credit accounts policies
CREATE POLICY "Users can view their own credit account"
  ON credit_accounts FOR SELECT
  USING (owner_id = auth.uid());

-- Credit accounts updates are handled by RPC functions (SECURITY DEFINER)
-- No direct UPDATE policy needed

-- Credit ledger policies
CREATE POLICY "Users can view their own ledger entries"
  ON credit_ledger FOR SELECT
  USING (owner_id = auth.uid());

-- Credit ledger inserts are handled by RPC functions (SECURITY DEFINER)
-- No direct INSERT policy needed

-- Admin settings policies
CREATE POLICY "Admins can view admin settings"
  ON admin_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update admin settings"
  ON admin_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Provider tasks policies
CREATE POLICY "Users can view provider tasks for their generations"
  ON provider_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM generations
      WHERE id = provider_tasks.generation_id AND owner_id = auth.uid()
    )
  );

-- Provider tasks inserts/updates are handled by Edge Functions (service role)

-- Storage bucket RLS policies
-- Note: Storage policies are created via Supabase Dashboard or SQL
-- These policies ensure users can only upload to their own paths

-- Policy: Users can upload files to their own paths in uploads bucket
CREATE POLICY "Users can upload to their own paths"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view files in their own paths
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update files in their own paths
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete files in their own paths
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Similar policies for outputs bucket
CREATE POLICY "Users can upload to their own paths in outputs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'outputs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files in outputs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'outputs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================
-- Migration: 20240101000002_seed_data.sql
-- ============================================

-- Seed initial data: presets and models

-- Ensure presets table has correct structure
-- This fixes the table if it was created with wrong schema
DO $$
BEGIN
  -- Check if table exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'presets'
  ) THEN
    CREATE TABLE presets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL CHECK (type IN ('image', 'video', 'edit')),
      key TEXT UNIQUE NOT NULL,
      title_ru TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description_ru TEXT,
      description_en TEXT,
      defaults JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  ELSE
    -- Table exists, check and add missing columns
    -- Add 'type' column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'presets' 
      AND column_name = 'type'
    ) THEN
      ALTER TABLE presets ADD COLUMN type TEXT CHECK (type IN ('image', 'video', 'edit'));
      UPDATE presets SET type = 'image' WHERE type IS NULL;
      ALTER TABLE presets ALTER COLUMN type SET NOT NULL;
    END IF;
    
    -- Add 'key' column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'presets' 
      AND column_name = 'key'
    ) THEN
      ALTER TABLE presets ADD COLUMN key TEXT;
      -- Create unique constraint if possible
      CREATE UNIQUE INDEX IF NOT EXISTS presets_key_unique ON presets(key) WHERE key IS NOT NULL;
      ALTER TABLE presets ALTER COLUMN key SET NOT NULL;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'title_ru') THEN
      ALTER TABLE presets ADD COLUMN title_ru TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'title_en') THEN
      ALTER TABLE presets ADD COLUMN title_en TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'description_ru') THEN
      ALTER TABLE presets ADD COLUMN description_ru TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'description_en') THEN
      ALTER TABLE presets ADD COLUMN description_en TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'defaults') THEN
      ALTER TABLE presets ADD COLUMN defaults JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'presets' AND column_name = 'created_at') THEN
      ALTER TABLE presets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
    END IF;
  END IF;
END $$;

-- Insert presets
INSERT INTO presets (type, key, title_ru, title_en, description_ru, description_en, defaults) VALUES
('image', 'image-gen', 'Генерация изображений', 'Image Generation', 'Создание изображений из текста', 'Create images from text', '{"credits": 1, "aspect_ratios": ["1:1", "16:9", "9:16", "4:3"]}'::jsonb),
('video', 'video-gen', 'Генерация видео', 'Video Generation', 'Создание видео из текста или изображения', 'Create videos from text or image', '{"credits": 5, "aspect_ratios": ["16:9", "9:16"], "duration": 5}'::jsonb),
('edit', 'image-edit', 'Редактирование изображений', 'Image Editing', 'Редактирование существующих изображений', 'Edit existing images', '{"credits": 2, "operations": ["inpaint", "outpaint", "relight", "upscale"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert models (KIE.ai placeholders)
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
('kie', 'kie-flux-pro', 'image', 'KIE FLUX Pro', '{"formats": ["png", "jpg"], "max_resolution": "1024x1024"}'::jsonb, 1.0),
('kie', 'kie-video-1', 'video', 'KIE Video Model 1', '{"formats": ["mp4"], "max_duration": 10}'::jsonb, 5.0),
('kie', 'kie-edit-1', 'edit', 'KIE Edit Model 1', '{"operations": ["inpaint", "relight"]}'::jsonb, 2.0)
ON CONFLICT (key) DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (id, markup_percent) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- Migration: 20240101000003_kie_models.sql
-- ============================================

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


-- ============================================
-- Migration: 20240101000004_sync_schema.sql
-- ============================================

-- Sync schema migration: Fix discrepancies between migrations and actual DB
-- This migration ensures all required columns exist

-- 1. Add function_key column to generations if it doesn't exist
-- Based on error: "null value in column \"function_key\" violates not-null constraint"
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'function_key'
  ) THEN
    ALTER TABLE generations ADD COLUMN function_key TEXT;
  END IF;
  
  -- Set default value for existing NULL rows (use preset key if available)
  UPDATE generations g
  SET function_key = (
    SELECT p.key FROM presets p WHERE p.id = g.preset_id LIMIT 1
  )
  WHERE function_key IS NULL;
  
  -- Make it NOT NULL if it's currently nullable (but only if all rows have values)
  -- Check if column is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'function_key'
    AND is_nullable = 'YES'
  ) THEN
    -- Only set NOT NULL if no NULL values remain
    IF NOT EXISTS (SELECT 1 FROM generations WHERE function_key IS NULL) THEN
      ALTER TABLE generations ALTER COLUMN function_key SET NOT NULL;
    END IF;
  END IF;
END $$;

-- 2. Ensure balance column exists in credit_accounts
-- Based on error: "column \"balance\" does not exist"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_accounts' 
    AND column_name = 'balance'
  ) THEN
    ALTER TABLE credit_accounts ADD COLUMN balance NUMERIC DEFAULT 0 NOT NULL;
    -- Set default balance for existing accounts
    UPDATE credit_accounts SET balance = 100 WHERE balance IS NULL;
  END IF;
END $$;

-- 3. Ensure all required columns exist in generations
DO $$
BEGIN
  -- Add prompt if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'prompt'
  ) THEN
    ALTER TABLE generations ADD COLUMN prompt TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add modality if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'modality'
  ) THEN
    ALTER TABLE generations ADD COLUMN modality TEXT;
    -- Set default based on preset type
    UPDATE generations g
    SET modality = (
      SELECT p.type FROM presets p WHERE p.id = g.preset_id LIMIT 1
    )
    WHERE modality IS NULL;
    -- Add constraint if needed
    ALTER TABLE generations ADD CONSTRAINT generations_modality_check 
      CHECK (modality IN ('image', 'video', 'edit', 'audio'));
  END IF;

  -- Add input if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'input'
  ) THEN
    ALTER TABLE generations ADD COLUMN input JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add estimated_credits if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'estimated_credits'
  ) THEN
    ALTER TABLE generations ADD COLUMN estimated_credits NUMERIC;
  END IF;

  -- Add reserved_credits if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generations' 
    AND column_name = 'reserved_credits'
  ) THEN
    ALTER TABLE generations ADD COLUMN reserved_credits NUMERIC;
  END IF;
END $$;

-- 4. Ensure credit_ledger has id column (if missing from initial migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_ledger' 
    AND column_name = 'id'
  ) THEN
    ALTER TABLE credit_ledger ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
  END IF;
END $$;

-- 5. Create indexes if missing
CREATE INDEX IF NOT EXISTS idx_credit_accounts_owner ON credit_accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_provider_tasks_generation ON provider_tasks(generation_id);
CREATE INDEX IF NOT EXISTS idx_provider_tasks_task_id ON provider_tasks(provider, task_id);

-- 6. Ensure RPC functions exist and work correctly
-- Fix rpc_credit_reserve to handle missing balance gracefully
CREATE OR REPLACE FUNCTION rpc_credit_reserve(
  p_owner_id UUID,
  p_generation_id UUID,
  p_amount NUMERIC,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Check balance (with lock)
  SELECT balance INTO current_balance
  FROM credit_accounts
  WHERE owner_id = p_owner_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    -- Create account if doesn't exist
    INSERT INTO credit_accounts (owner_id, balance)
    VALUES (p_owner_id, 100) -- Default 100 credits for new accounts
    ON CONFLICT (owner_id) DO UPDATE SET balance = COALESCE(credit_accounts.balance, 100);
    current_balance := 100;
  END IF;

  -- Check if already reserved for this generation (idempotent)
  IF EXISTS (
    SELECT 1 FROM credit_ledger
    WHERE owner_id = p_owner_id
      AND generation_id = p_generation_id
      AND type = 'reserve'
  ) THEN
    RETURN TRUE; -- Already reserved
  END IF;

  -- Check sufficient balance
  IF current_balance < p_amount THEN
    RETURN FALSE; -- Insufficient balance
  END IF;

  -- Reserve credits
  UPDATE credit_accounts
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE owner_id = p_owner_id;

  INSERT INTO credit_ledger (owner_id, generation_id, type, amount, meta)
  VALUES (p_owner_id, p_generation_id, 'reserve', p_amount, p_meta);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- Migration: 20240101000005_fix_rls_recursion.sql
-- ============================================

-- Fix RLS infinite recursion for board_members
-- The issue: board_members policy checks boards, boards policy checks board_members
-- Solution: Use SECURITY DEFINER function to break the recursion

-- Create helper function to check board access (SECURITY DEFINER breaks recursion)
CREATE OR REPLACE FUNCTION public.user_has_board_access(board_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = board_uuid AND owner_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = board_uuid AND user_id = user_uuid
  );
$$;

-- Drop and recreate board_members policies to use the helper function
DROP POLICY IF EXISTS "Users can view board members of their boards" ON board_members;
CREATE POLICY "Users can view board members of their boards"
  ON board_members FOR SELECT
  USING (public.user_has_board_access(board_id, auth.uid()));

-- Also fix boards policy to avoid recursion
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );


-- ============================================
-- Migration: 20240101000005_kie_models_from_registry.sql
-- ============================================

-- Seed KIE.ai models from registry
-- Generated from: supabase/seed/kie_models_registry.json
-- Generated at: 2026-01-16T11:18:24.246Z

-- Map modality: upscale/remove-bg -> edit for DB compatibility
INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
('kie', 'seedream-v4-text-to-image', 'image', 'Seedream V4 Text-to-Image', '{"model_identifier":"seedream-v4-text-to-image","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/seedream/seedream-v4-text-to-image"}'::jsonb, 1.0),
('kie', 'seedream-v4-edit', 'edit', 'Seedream V4 Edit', '{"model_identifier":"seedream-v4-edit","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/seedream/seedream-v4-edit"}'::jsonb, 1.0),
('kie', 'seedream-4.5-text-to-image', 'image', 'Seedream 4.5 Text-to-Image', '{"model_identifier":"seedream-4.5-text-to-image","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/seedream/4.5-text-to-image"}'::jsonb, 1.0),
('kie', 'seedream-4.5-edit', 'edit', 'Seedream 4.5 Edit', '{"model_identifier":"seedream-4.5-edit","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/seedream/4.5-edit"}'::jsonb, 1.0),
('kie', 'z-image', 'image', 'Z-Image', '{"model_identifier":"z-image","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/z-image/z-image"}'::jsonb, 1.0),
('kie', 'google-imagen4', 'image', 'Google Imagen 4', '{"model_identifier":"google/imagen4","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/google/imagen4"}'::jsonb, 1.0),
('kie', 'google-imagen4-fast', 'image', 'Google Imagen 4 Fast', '{"model_identifier":"google/imagen4-fast","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/google/imagen4-fast"}'::jsonb, 1.0),
('kie', 'google-imagen4-ultra', 'image', 'Google Imagen 4 Ultra', '{"model_identifier":"google/imagen4-ultra","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/google/imagen4-ultra"}'::jsonb, 1.0),
('kie', 'google-nano-banana', 'image', 'Google Nano Banana', '{"model_identifier":"google/nano-banana","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/google/nano-banana"}'::jsonb, 1.0),
('kie', 'google-nano-banana-edit', 'edit', 'Google Nano Banana Edit', '{"model_identifier":"google/nano-banana-edit","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/google/nano-banana-edit"}'::jsonb, 1.0),
('kie', 'google-pro-image-to-image', 'edit', 'Google Pro Image-to-Image', '{"model_identifier":"google/pro-image-to-image","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/google/pro-image-to-image"}'::jsonb, 1.0),
('kie', 'flux2-pro-text-to-image', 'image', 'Flux2 Pro Text-to-Image', '{"model_identifier":"flux2/pro-text-to-image","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/flux2/pro-text-to-image"}'::jsonb, 1.0),
('kie', 'flux2-pro-image-to-image', 'edit', 'Flux2 Pro Image-to-Image', '{"model_identifier":"flux2/pro-image-to-image","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/flux2/pro-image-to-image"}'::jsonb, 1.0),
('kie', 'flux2-flex-text-to-image', 'image', 'Flux2 Flex Text-to-Image', '{"model_identifier":"flux2/flex-text-to-image","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/flux2/flex-text-to-image"}'::jsonb, 1.0),
('kie', 'flux2-flex-image-to-image', 'edit', 'Flux2 Flex Image-to-Image', '{"model_identifier":"flux2/flex-image-to-image","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/flux2/flex-image-to-image"}'::jsonb, 1.0),
('kie', 'grok-imagine-text-to-image', 'image', 'Grok Imagine Text-to-Image', '{"model_identifier":"grok-imagine/text-to-image","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/grok-imagine/text-to-image"}'::jsonb, 1.0),
('kie', 'grok-imagine-image-to-image', 'edit', 'Grok Imagine Image-to-Image', '{"model_identifier":"grok-imagine/image-to-image","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/grok-imagine/image-to-image"}'::jsonb, 1.0),
('kie', 'grok-imagine-upscale', 'edit', 'Grok Imagine Upscale', '{"model_identifier":"grok-imagine/upscale","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/grok-imagine/upscale"}'::jsonb, 1.0),
('kie', 'grok-imagine-text-to-video', 'video', 'Grok Imagine Text-to-Video', '{"model_identifier":"grok-imagine/text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/grok-imagine/text-to-video"}'::jsonb, 1.0),
('kie', 'grok-imagine-image-to-video', 'video', 'Grok Imagine Image-to-Video', '{"model_identifier":"grok-imagine/image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/grok-imagine/image-to-video"}'::jsonb, 1.0),
('kie', 'gpt-image-1.5-text-to-image', 'image', 'GPT Image 1.5 Text-to-Image', '{"model_identifier":"gpt-image/1.5-text-to-image","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/gpt-image/1.5-text-to-image"}'::jsonb, 1.0),
('kie', 'gpt-image-1.5-image-to-image', 'edit', 'GPT Image 1.5 Image-to-Image', '{"model_identifier":"gpt-image/1.5-image-to-image","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/gpt-image/1.5-image-to-image"}'::jsonb, 1.0),
('kie', 'topaz-image-upscale', 'edit', 'Topaz Image Upscale', '{"model_identifier":"topaz/image-upscale","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/topaz/image-upscale"}'::jsonb, 1.0),
('kie', 'topaz-video-upscale', 'edit', 'Topaz Video Upscale', '{"model_identifier":"topaz/video-upscale","family":"market","requires_input":true,"input_kinds":["video"],"docs_url":"https://docs.kie.ai/market/topaz/video-upscale"}'::jsonb, 1.0),
('kie', 'recraft-remove-background', 'edit', 'Recraft Remove Background', '{"model_identifier":"recraft/remove-background","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/recraft/remove-background"}'::jsonb, 1.0),
('kie', 'recraft-crisp-upscale', 'edit', 'Recraft Crisp Upscale', '{"model_identifier":"recraft/crisp-upscale","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/recraft/crisp-upscale"}'::jsonb, 1.0),
('kie', 'ideogram-character', 'image', 'Ideogram Character', '{"model_identifier":"ideogram/character","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/ideogram/character"}'::jsonb, 1.0),
('kie', 'ideogram-character-edit', 'edit', 'Ideogram Character Edit', '{"model_identifier":"ideogram/character-edit","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/ideogram/character-edit"}'::jsonb, 1.0),
('kie', 'ideogram-character-remix', 'edit', 'Ideogram Character Remix', '{"model_identifier":"ideogram/character-remix","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/ideogram/character-remix"}'::jsonb, 1.0),
('kie', 'ideogram-v3-reframe', 'edit', 'Ideogram V3 Reframe', '{"model_identifier":"ideogram/v3-reframe","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/ideogram/v3-reframe"}'::jsonb, 1.0),
('kie', 'kling-text-to-video', 'video', 'Kling Text-to-Video', '{"model_identifier":"kling/text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/kling/text-to-video"}'::jsonb, 1.0),
('kie', 'kling-image-to-video', 'video', 'Kling Image-to-Video', '{"model_identifier":"kling/image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/kling/image-to-video"}'::jsonb, 1.0),
('kie', 'kling-ai-avatar-v1-pro', 'video', 'Kling AI Avatar V1 Pro', '{"model_identifier":"kling/ai-avatar-v1-pro","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/kling/ai-avatar-v1-pro"}'::jsonb, 1.0),
('kie', 'kling-v1-avatar-standard', 'video', 'Kling V1 Avatar Standard', '{"model_identifier":"kling/v1-avatar-standard","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/kling/v1-avatar-standard"}'::jsonb, 1.0),
('kie', 'kling-v2-1-master-text-to-video', 'video', 'Kling V2.1 Master Text-to-Video', '{"model_identifier":"kling/v2-1-master-text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/kling/v2-1-master-text-to-video"}'::jsonb, 1.0),
('kie', 'kling-v2-1-master-image-to-video', 'video', 'Kling V2.1 Master Image-to-Video', '{"model_identifier":"kling/v2-1-master-image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/kling/v2-1-master-image-to-video"}'::jsonb, 1.0),
('kie', 'kling-v2-1-pro', 'video', 'Kling V2.1 Pro', '{"model_identifier":"kling/v2-1-pro","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/kling/v2-1-pro"}'::jsonb, 1.0),
('kie', 'kling-v2-1-standard', 'video', 'Kling V2.1 Standard', '{"model_identifier":"kling/v2-1-standard","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/kling/v2-1-standard"}'::jsonb, 1.0),
('kie', 'kling-motion-control', 'video', 'Kling Motion Control', '{"model_identifier":"kling/motion-control","family":"market","requires_input":true,"input_kinds":["image","start_frame"],"docs_url":"https://docs.kie.ai/market/kling/motion-control"}'::jsonb, 1.0),
('kie', 'bytedance-seedance-1.5-pro', 'video', 'ByteDance Seedance 1.5 Pro', '{"model_identifier":"bytedance/seedance-1.5-pro","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/bytedance/seedance-1.5-pro"}'::jsonb, 1.0),
('kie', 'bytedance-v1-pro-fast-image-to-video', 'video', 'ByteDance V1 Pro Fast Image-to-Video', '{"model_identifier":"bytedance/v1-pro-fast-image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/bytedance/v1-pro-fast-image-to-video"}'::jsonb, 1.0),
('kie', 'bytedance-v1-pro-image-to-video', 'video', 'ByteDance V1 Pro Image-to-Video', '{"model_identifier":"bytedance/v1-pro-image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/bytedance/v1-pro-image-to-video"}'::jsonb, 1.0),
('kie', 'bytedance-v1-pro-text-to-video', 'video', 'ByteDance V1 Pro Text-to-Video', '{"model_identifier":"bytedance/v1-pro-text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/bytedance/v1-pro-text-to-video"}'::jsonb, 1.0),
('kie', 'bytedance-v1-lite-image-to-video', 'video', 'ByteDance V1 Lite Image-to-Video', '{"model_identifier":"bytedance/v1-lite-image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/bytedance/v1-lite-image-to-video"}'::jsonb, 1.0),
('kie', 'bytedance-v1-lite-text-to-video', 'video', 'ByteDance V1 Lite Text-to-Video', '{"model_identifier":"bytedance/v1-lite-text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/bytedance/v1-lite-text-to-video"}'::jsonb, 1.0),
('kie', 'hailuo-2-3-image-to-video-pro', 'video', 'Hailuo 2-3 Image-to-Video Pro', '{"model_identifier":"hailuo/2-3-image-to-video-pro","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/hailuo/2-3-image-to-video-pro"}'::jsonb, 1.0),
('kie', 'hailuo-2-3-image-to-video-standard', 'video', 'Hailuo 2-3 Image-to-Video Standard', '{"model_identifier":"hailuo/2-3-image-to-video-standard","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/hailuo/2-3-image-to-video-standard"}'::jsonb, 1.0),
('kie', 'hailuo-02-text-to-video-pro', 'video', 'Hailuo 02 Text-to-Video Pro', '{"model_identifier":"hailuo/02-text-to-video-pro","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/hailuo/02-text-to-video-pro"}'::jsonb, 1.0),
('kie', 'hailuo-02-text-to-video-standard', 'video', 'Hailuo 02 Text-to-Video Standard', '{"model_identifier":"hailuo/02-text-to-video-standard","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/hailuo/02-text-to-video-standard"}'::jsonb, 1.0),
('kie', 'hailuo-02-image-to-video-pro', 'video', 'Hailuo 02 Image-to-Video Pro', '{"model_identifier":"hailuo/02-image-to-video-pro","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/hailuo/02-image-to-video-pro"}'::jsonb, 1.0),
('kie', 'hailuo-02-image-to-video-standard', 'video', 'Hailuo 02 Image-to-Video Standard', '{"model_identifier":"hailuo/02-image-to-video-standard","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/hailuo/02-image-to-video-standard"}'::jsonb, 1.0),
('kie', 'sora2-sora-2-text-to-video', 'video', 'Sora2 Text-to-Video', '{"model_identifier":"sora2/sora-2-text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/sora2/sora-2-text-to-video"}'::jsonb, 1.0),
('kie', 'sora2-sora-2-image-to-video', 'video', 'Sora2 Image-to-Video', '{"model_identifier":"sora2/sora-2-image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/sora2/sora-2-image-to-video"}'::jsonb, 1.0),
('kie', 'sora2-sora-2-pro-text-to-video', 'video', 'Sora2 Pro Text-to-Video', '{"model_identifier":"sora2/sora-2-pro-text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/sora2/sora-2-pro-text-to-video"}'::jsonb, 1.0),
('kie', 'sora2-sora-2-pro-image-to-video', 'video', 'Sora2 Pro Image-to-Video', '{"model_identifier":"sora2/sora-2-pro-image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/sora2/sora-2-pro-image-to-video"}'::jsonb, 1.0),
('kie', 'sora2-sora-watermark-remover', 'video', 'Sora2 Watermark Remover', '{"model_identifier":"sora2/sora-watermark-remover","family":"market","requires_input":true,"input_kinds":["video"],"docs_url":"https://docs.kie.ai/market/sora2/sora-watermark-remover"}'::jsonb, 1.0),
('kie', 'sora2-sora-2-characters', 'video', 'Sora2 Characters', '{"model_identifier":"sora2/sora-2-characters","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/sora2/sora-2-characters"}'::jsonb, 1.0),
('kie', 'sora-2-pro-storyboard', 'video', 'Sora2 Pro Storyboard', '{"model_identifier":"sora-2-pro-storyboard","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/sora-2-pro-storyboard"}'::jsonb, 1.0),
('kie', 'wan-2-6-text-to-video', 'video', 'Wan 2-6 Text-to-Video', '{"model_identifier":"wan/2-6-text-to-video","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/wan/2-6-text-to-video"}'::jsonb, 1.0),
('kie', 'wan-2-6-image-to-video', 'video', 'Wan 2-6 Image-to-Video', '{"model_identifier":"wan/2-6-image-to-video","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/wan/2-6-image-to-video"}'::jsonb, 1.0),
('kie', 'wan-2-6-video-to-video', 'video', 'Wan 2-6 Video-to-Video', '{"model_identifier":"wan/2-6-video-to-video","family":"market","requires_input":true,"input_kinds":["video"],"docs_url":"https://docs.kie.ai/market/wan/2-6-video-to-video"}'::jsonb, 1.0),
('kie', 'wan-2-2-a14b-text-to-video-turbo', 'video', 'Wan 2-2 A14B Text-to-Video Turbo', '{"model_identifier":"wan/2-2-a14b-text-to-video-turbo","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/wan/2-2-a14b-text-to-video-turbo"}'::jsonb, 1.0),
('kie', 'wan-2-2-a14b-image-to-video-turbo', 'video', 'Wan 2-2 A14B Image-to-Video Turbo', '{"model_identifier":"wan/2-2-a14b-image-to-video-turbo","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/wan/2-2-a14b-image-to-video-turbo"}'::jsonb, 1.0),
('kie', 'wan-2-2-animate-move', 'video', 'Wan 2-2 Animate Move', '{"model_identifier":"wan/2-2-animate-move","family":"market","requires_input":true,"input_kinds":["image","start_frame"],"docs_url":"https://docs.kie.ai/market/wan/2-2-animate-move"}'::jsonb, 1.0),
('kie', 'wan-2-2-animate-replace', 'video', 'Wan 2-2 Animate Replace', '{"model_identifier":"wan/2-2-animate-replace","family":"market","requires_input":true,"input_kinds":["image"],"docs_url":"https://docs.kie.ai/market/wan/2-2-animate-replace"}'::jsonb, 1.0),
('kie', 'wan-2-2-a14b-speech-to-video-turbo', 'video', 'Wan 2-2 A14B Speech-to-Video Turbo', '{"model_identifier":"wan/2-2-a14b-speech-to-video-turbo","family":"market","requires_input":true,"input_kinds":["audio"],"docs_url":"https://docs.kie.ai/market/wan/2-2-a14b-speech-to-video-turbo"}'::jsonb, 1.0),
('kie', 'elevenlabs-text-to-speech-multilingual-v2', 'audio', 'ElevenLabs Text-to-Speech Multilingual V2', '{"model_identifier":"elevenlabs/text-to-speech-multilingual-v2","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2"}'::jsonb, 1.0),
('kie', 'elevenlabs-speech-to-text', 'audio', 'ElevenLabs Speech-to-Text', '{"model_identifier":"elevenlabs/speech-to-text","family":"market","requires_input":true,"input_kinds":["audio"],"docs_url":"https://docs.kie.ai/market/elevenlabs/speech-to-text"}'::jsonb, 1.0),
('kie', 'elevenlabs-sound-effect-v2', 'audio', 'ElevenLabs Sound Effect V2', '{"model_identifier":"elevenlabs/sound-effect-v2","family":"market","requires_input":false,"input_kinds":[],"docs_url":"https://docs.kie.ai/market/elevenlabs/sound-effect-v2"}'::jsonb, 1.0),
('kie', 'elevenlabs-audio-isolation', 'audio', 'ElevenLabs Audio Isolation', '{"model_identifier":"elevenlabs/audio-isolation","family":"market","requires_input":true,"input_kinds":["audio"],"docs_url":"https://docs.kie.ai/market/elevenlabs/audio-isolation"}'::jsonb, 1.0),
('kie', 'infinitalk-from-audio', 'audio', 'Infinitalk From Audio', '{"model_identifier":"infinitalk/from-audio","family":"market","requires_input":true,"input_kinds":["audio"],"docs_url":"https://docs.kie.ai/market/infinitalk/from-audio"}'::jsonb, 1.0)
ON CONFLICT (key) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  title = EXCLUDED.title,
  modality = EXCLUDED.modality,
  price_multiplier = EXCLUDED.price_multiplier;


-- ============================================
-- Migration: 20240101000006_fix_rls_boards_complete.sql
-- ============================================

-- Complete fix for RLS recursion in boards/board_members
-- This migration drops all existing policies and recreates them correctly

-- Step 1: Drop ALL existing policies for boards and board_members
DROP POLICY IF EXISTS "Users can view their own boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
DROP POLICY IF EXISTS "Users can create boards" ON boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON boards;

DROP POLICY IF EXISTS "Users can view board members of their boards" ON board_members;
DROP POLICY IF EXISTS "Board owners can manage members" ON board_members;

-- Step 2: Create helper function (SECURITY DEFINER breaks recursion)
CREATE OR REPLACE FUNCTION public.user_has_board_access(board_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards
    WHERE id = board_uuid AND owner_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = board_uuid AND user_id = user_uuid
  );
$$;

-- Step 3: Recreate boards policies (without recursion)
CREATE POLICY "Users can view their own boards"
  ON boards FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view boards they are members of"
  ON boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  USING (owner_id = auth.uid());

-- Step 4: Recreate board_members policies (using helper function to avoid recursion)
CREATE POLICY "Users can view board members of their boards"
  ON board_members FOR SELECT
  USING (public.user_has_board_access(board_id, auth.uid()));

CREATE POLICY "Board owners can manage members"
  ON board_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE id = board_members.board_id AND owner_id = auth.uid()
    )
  );


-- ============================================
-- Migration: 20240101000007_update_kie_models_capabilities.sql
-- ============================================

-- Update existing KIE models with model_identifier and family in capabilities
-- This migration updates models from 20240101000003_kie_models.sql to include
-- proper model_identifier and family fields needed for the new endpoint system

-- Update models with model_identifier and family
-- This uses ON CONFLICT DO UPDATE to merge new capabilities with existing ones

INSERT INTO models (provider, key, modality, title, capabilities, price_multiplier) VALUES
-- Seedream models
('kie', 'seedream-v4-text-to-image', 'image', 'Seedream V4 Text-to-Image',
 '{"model_identifier": "seedream-v4-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/seedream/seedream-v4-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'seedream-v4-edit', 'edit', 'Seedream V4 Edit',
 '{"model_identifier": "seedream-v4-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/seedream/seedream-v4-edit", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'seedream-4.5-text-to-image', 'image', 'Seedream 4.5 Text-to-Image',
 '{"model_identifier": "seedream-4.5-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/seedream/4.5-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'seedream-4.5-edit', 'edit', 'Seedream 4.5 Edit',
 '{"model_identifier": "seedream-4.5-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/seedream/4.5-edit", "supports_image_input": true}'::jsonb, 1.0),

-- Z-image
('kie', 'z-image', 'image', 'Z-Image',
 '{"model_identifier": "z-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/z-image/z-image", "supports_image_input": false}'::jsonb, 1.0),

-- Google Imagen models
('kie', 'google/imagen4', 'image', 'Google Imagen 4',
 '{"model_identifier": "google/imagen4", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/imagen4", "supports_image_input": false}'::jsonb, 1.2),
('kie', 'google/imagen4-fast', 'image', 'Google Imagen 4 Fast',
 '{"model_identifier": "google/imagen4-fast", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/imagen4-fast", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'google/imagen4-ultra', 'image', 'Google Imagen 4 Ultra',
 '{"model_identifier": "google/imagen4-ultra", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/imagen4-ultra", "supports_image_input": false}'::jsonb, 1.5),
('kie', 'google/nano-banana', 'image', 'Google Nano Banana',
 '{"model_identifier": "google/nano-banana", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/google/nano-banana", "supports_image_input": false}'::jsonb, 0.8),
('kie', 'google/nano-banana-edit', 'edit', 'Google Nano Banana Edit',
 '{"model_identifier": "google/nano-banana-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/google/nano-banana-edit", "supports_image_input": true}'::jsonb, 0.8),
('kie', 'google/pro-image-to-image', 'edit', 'Google Pro Image-to-Image',
 '{"model_identifier": "google/pro-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/google/pro-image-to-image", "supports_image_input": true}'::jsonb, 1.2),

-- Flux2 models
('kie', 'flux2/pro-text-to-image', 'image', 'Flux2 Pro Text-to-Image',
 '{"model_identifier": "flux2/pro-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/flux2/pro-text-to-image", "supports_image_input": false}'::jsonb, 1.3),
('kie', 'flux2/pro-image-to-image', 'edit', 'Flux2 Pro Image-to-Image',
 '{"model_identifier": "flux2/pro-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/flux2/pro-image-to-image", "supports_image_input": true}'::jsonb, 1.3),
('kie', 'flux2/flex-text-to-image', 'image', 'Flux2 Flex Text-to-Image',
 '{"model_identifier": "flux2/flex-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/flux2/flex-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'flux2/flex-image-to-image', 'edit', 'Flux2 Flex Image-to-Image',
 '{"model_identifier": "flux2/flex-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/flux2/flex-image-to-image", "supports_image_input": true}'::jsonb, 1.0),

-- Grok Imagine models
('kie', 'grok-imagine/text-to-image', 'image', 'Grok Imagine Text-to-Image',
 '{"model_identifier": "grok-imagine/text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/grok-imagine/text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'grok-imagine/image-to-image', 'edit', 'Grok Imagine Image-to-Image',
 '{"model_identifier": "grok-imagine/image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/grok-imagine/image-to-image", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'grok-imagine/upscale', 'edit', 'Grok Imagine Upscale',
 '{"model_identifier": "grok-imagine/upscale", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/grok-imagine/upscale", "supports_image_input": true}'::jsonb, 0.8),
('kie', 'grok-imagine/text-to-video', 'video', 'Grok Imagine Text-to-Video',
 '{"model_identifier": "grok-imagine/text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/grok-imagine/text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'grok-imagine/image-to-video', 'video', 'Grok Imagine Image-to-Video',
 '{"model_identifier": "grok-imagine/image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/grok-imagine/image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),

-- GPT Image models
('kie', 'gpt-image/1.5-text-to-image', 'image', 'GPT Image 1.5 Text-to-Image',
 '{"model_identifier": "gpt-image/1.5-text-to-image", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/gpt-image/1.5-text-to-image", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'gpt-image/1.5-image-to-image', 'edit', 'GPT Image 1.5 Image-to-Image',
 '{"model_identifier": "gpt-image/1.5-image-to-image", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/gpt-image/1.5-image-to-image", "supports_image_input": true}'::jsonb, 1.0),

-- Topaz
('kie', 'topaz/image-upscale', 'edit', 'Topaz Image Upscale',
 '{"model_identifier": "topaz/image-upscale", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/topaz/image-upscale", "supports_image_input": true}'::jsonb, 0.8),

-- Recraft models
('kie', 'recraft/remove-background', 'edit', 'Recraft Remove Background',
 '{"model_identifier": "recraft/remove-background", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/recraft/remove-background", "supports_image_input": true}'::jsonb, 0.5),
('kie', 'recraft/crisp-upscale', 'edit', 'Recraft Crisp Upscale',
 '{"model_identifier": "recraft/crisp-upscale", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/recraft/crisp-upscale", "supports_image_input": true}'::jsonb, 0.8),

-- Ideogram models
('kie', 'ideogram/character', 'image', 'Ideogram Character',
 '{"model_identifier": "ideogram/character", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/ideogram/character", "supports_image_input": false}'::jsonb, 1.0),
('kie', 'ideogram/character-edit', 'edit', 'Ideogram Character Edit',
 '{"model_identifier": "ideogram/character-edit", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/ideogram/character-edit", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'ideogram/character-remix', 'edit', 'Ideogram Character Remix',
 '{"model_identifier": "ideogram/character-remix", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/ideogram/character-remix", "supports_image_input": true}'::jsonb, 1.0),
('kie', 'ideogram/v3-reframe', 'edit', 'Ideogram V3 Reframe',
 '{"model_identifier": "ideogram/v3-reframe", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/ideogram/v3-reframe", "supports_image_input": true}'::jsonb, 1.0),

-- Kling models
('kie', 'kling/text-to-video', 'video', 'Kling Text-to-Video',
 '{"model_identifier": "kling/text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/kling/text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/image-to-video', 'video', 'Kling Image-to-Video',
 '{"model_identifier": "kling/image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/ai-avatar-v1-pro', 'video', 'Kling AI Avatar V1 Pro',
 '{"model_identifier": "kling/ai-avatar-v1-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/ai-avatar-v1-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'kling/v1-avatar-standard', 'video', 'Kling V1 Avatar Standard',
 '{"model_identifier": "kling/v1-avatar-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v1-avatar-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-master-text-to-video', 'video', 'Kling V2.1 Master Text-to-Video',
 '{"model_identifier": "kling/v2-1-master-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/kling/v2-1-master-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-master-image-to-video', 'video', 'Kling V2.1 Master Image-to-Video',
 '{"model_identifier": "kling/v2-1-master-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v2-1-master-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-pro', 'video', 'Kling V2.1 Pro',
 '{"model_identifier": "kling/v2-1-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v2-1-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'kling/v2-1-standard', 'video', 'Kling V2.1 Standard',
 '{"model_identifier": "kling/v2-1-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/kling/v2-1-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'kling/motion-control', 'video', 'Kling Motion Control',
 '{"model_identifier": "kling/motion-control", "family": "market", "requires_input": true, "input_kinds": ["image", "start_frame"], "docs_url": "https://docs.kie.ai/market/kling/motion-control", "supports_image_input": true, "supports_video_input": false, "supports_start_frame": true}'::jsonb, 2.5),

-- ByteDance models
('kie', 'bytedance/seedance-1.5-pro', 'video', 'ByteDance Seedance 1.5 Pro',
 '{"model_identifier": "bytedance/seedance-1.5-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/seedance-1.5-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-pro-fast-image-to-video', 'video', 'ByteDance V1 Pro Fast Image-to-Video',
 '{"model_identifier": "bytedance/v1-pro-fast-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/v1-pro-fast-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'bytedance/v1-pro-image-to-video', 'video', 'ByteDance V1 Pro Image-to-Video',
 '{"model_identifier": "bytedance/v1-pro-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/v1-pro-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-pro-text-to-video', 'video', 'ByteDance V1 Pro Text-to-Video',
 '{"model_identifier": "bytedance/v1-pro-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/bytedance/v1-pro-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'bytedance/v1-lite-image-to-video', 'video', 'ByteDance V1 Lite Image-to-Video',
 '{"model_identifier": "bytedance/v1-lite-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/bytedance/v1-lite-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'bytedance/v1-lite-text-to-video', 'video', 'ByteDance V1 Lite Text-to-Video',
 '{"model_identifier": "bytedance/v1-lite-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/bytedance/v1-lite-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),

-- Hailuo models
('kie', 'hailuo/02-text-to-video-pro', 'video', 'Hailuo 02 Text-to-Video Pro',
 '{"model_identifier": "hailuo/02-text-to-video-pro", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/hailuo/02-text-to-video-pro", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/02-text-to-video-standard', 'video', 'Hailuo 02 Text-to-Video Standard',
 '{"model_identifier": "hailuo/02-text-to-video-standard", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/hailuo/02-text-to-video-standard", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'hailuo/02-image-to-video-pro', 'video', 'Hailuo 02 Image-to-Video Pro',
 '{"model_identifier": "hailuo/02-image-to-video-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/02-image-to-video-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/02-image-to-video-standard', 'video', 'Hailuo 02 Image-to-Video Standard',
 '{"model_identifier": "hailuo/02-image-to-video-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/02-image-to-video-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'hailuo/2-3-image-to-video-pro', 'video', 'Hailuo 2-3 Image-to-Video Pro',
 '{"model_identifier": "hailuo/2-3-image-to-video-pro", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/2-3-image-to-video-pro", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'hailuo/2-3-image-to-video-standard', 'video', 'Hailuo 2-3 Image-to-Video Standard',
 '{"model_identifier": "hailuo/2-3-image-to-video-standard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/hailuo/2-3-image-to-video-standard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),

-- Sora2 models
('kie', 'sora2/sora-2-text-to-video', 'video', 'Sora2 Text-to-Video',
 '{"model_identifier": "sora2/sora-2-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora2/sora-2-image-to-video', 'video', 'Sora2 Image-to-Video',
 '{"model_identifier": "sora2/sora-2-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora2/sora-2-pro-text-to-video', 'video', 'Sora2 Pro Text-to-Video',
 '{"model_identifier": "sora2/sora-2-pro-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-pro-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 3.5),
('kie', 'sora2/sora-2-pro-image-to-video', 'video', 'Sora2 Pro Image-to-Video',
 '{"model_identifier": "sora2/sora-2-pro-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-pro-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.5),
('kie', 'sora2/sora-watermark-remover', 'video', 'Sora2 Watermark Remover',
 '{"model_identifier": "sora2/sora-watermark-remover", "family": "market", "requires_input": true, "input_kinds": ["video"], "docs_url": "https://docs.kie.ai/market/sora2/sora-watermark-remover", "supports_video_input": true}'::jsonb, 1.5),
('kie', 'sora2/sora-2-characters', 'video', 'Sora2 Characters',
 '{"model_identifier": "sora2/sora-2-characters", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora2/sora-2-characters", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.0),
('kie', 'sora-2-pro-storyboard', 'video', 'Sora2 Pro Storyboard',
 '{"model_identifier": "sora-2-pro-storyboard", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/sora-2-pro-storyboard", "supports_image_input": true, "supports_video_input": false}'::jsonb, 3.5),

-- Wan models
('kie', 'wan/2-6-text-to-video', 'video', 'Wan 2-6 Text-to-Video',
 '{"model_identifier": "wan/2-6-text-to-video", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/wan/2-6-text-to-video", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-6-image-to-video', 'video', 'Wan 2-6 Image-to-Video',
 '{"model_identifier": "wan/2-6-image-to-video", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/wan/2-6-image-to-video", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-6-video-to-video', 'video', 'Wan 2-6 Video-to-Video',
 '{"model_identifier": "wan/2-6-video-to-video", "family": "market", "requires_input": true, "input_kinds": ["video"], "docs_url": "https://docs.kie.ai/market/wan/2-6-video-to-video", "supports_video_input": true}'::jsonb, 2.5),
('kie', 'wan/2-2-a14b-text-to-video-turbo', 'video', 'Wan 2-2 A14B Text-to-Video Turbo',
 '{"model_identifier": "wan/2-2-a14b-text-to-video-turbo", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/wan/2-2-a14b-text-to-video-turbo", "supports_image_input": false, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-2-a14b-image-to-video-turbo', 'video', 'Wan 2-2 A14B Image-to-Video Turbo',
 '{"model_identifier": "wan/2-2-a14b-image-to-video-turbo", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/wan/2-2-a14b-image-to-video-turbo", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.0),
('kie', 'wan/2-2-animate-move', 'video', 'Wan 2-2 Animate Move',
 '{"model_identifier": "wan/2-2-animate-move", "family": "market", "requires_input": true, "input_kinds": ["image", "start_frame"], "docs_url": "https://docs.kie.ai/market/wan/2-2-animate-move", "supports_image_input": true, "supports_video_input": false, "supports_start_frame": true}'::jsonb, 2.5),
('kie', 'wan/2-2-animate-replace', 'video', 'Wan 2-2 Animate Replace',
 '{"model_identifier": "wan/2-2-animate-replace", "family": "market", "requires_input": true, "input_kinds": ["image"], "docs_url": "https://docs.kie.ai/market/wan/2-2-animate-replace", "supports_image_input": true, "supports_video_input": false}'::jsonb, 2.5),
('kie', 'wan/2-2-a14b-speech-to-video-turbo', 'video', 'Wan 2-2 A14B Speech-to-Video Turbo',
 '{"model_identifier": "wan/2-2-a14b-speech-to-video-turbo", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/wan/2-2-a14b-speech-to-video-turbo", "supports_audio_input": true}'::jsonb, 2.5),

-- Audio models
('kie', 'elevenlabs/text-to-speech-multilingual-v2', 'audio', 'ElevenLabs Text-to-Speech Multilingual V2',
 '{"model_identifier": "elevenlabs/text-to-speech-multilingual-v2", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2", "supports_audio_input": false}'::jsonb, 1.0),
('kie', 'elevenlabs/speech-to-text', 'audio', 'ElevenLabs Speech-to-Text',
 '{"model_identifier": "elevenlabs/speech-to-text", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/elevenlabs/speech-to-text", "supports_audio_input": true}'::jsonb, 0.8),
('kie', 'elevenlabs/sound-effect-v2', 'audio', 'ElevenLabs Sound Effect V2',
 '{"model_identifier": "elevenlabs/sound-effect-v2", "family": "market", "requires_input": false, "input_kinds": [], "docs_url": "https://docs.kie.ai/market/elevenlabs/sound-effect-v2", "supports_audio_input": false}'::jsonb, 0.8),
('kie', 'elevenlabs/audio-isolation', 'audio', 'ElevenLabs Audio Isolation',
 '{"model_identifier": "elevenlabs/audio-isolation", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/elevenlabs/audio-isolation", "supports_audio_input": true}'::jsonb, 1.0),
('kie', 'infinitalk/from-audio', 'audio', 'Infinitalk From Audio',
 '{"model_identifier": "infinitalk/from-audio", "family": "market", "requires_input": true, "input_kinds": ["audio"], "docs_url": "https://docs.kie.ai/market/infinitalk/from-audio", "supports_audio_input": true}'::jsonb, 1.0)

ON CONFLICT (key) DO UPDATE SET
  capabilities = EXCLUDED.capabilities,
  title = EXCLUDED.title,
  modality = EXCLUDED.modality,
  price_multiplier = EXCLUDED.price_multiplier;


-- ============================================
-- Migration: 20240101000008_remove_placeholder_models.sql
-- ============================================

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


-- ============================================
-- Migration: 20240101000009_create_assets_table.sql
-- ============================================

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


-- ============================================
-- Migration: 20240101000010_safe_create_assets_if_missing.sql
-- ============================================

-- Safe migration: Create assets table if it doesn't exist
-- This migration is idempotent and safe to run multiple times
-- It will NOT drop or modify existing data

-- Create assets table (only if it doesn't exist)
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


-- ============================================
-- Migration: 20240101000011_add_missing_assets_columns.sql
-- ============================================

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


-- ============================================
-- Migration: 20240205000000_VERIFY_MIGRATION.sql
-- ============================================

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


-- ============================================
-- Migration: 20240205000000_fix_key_column_and_video_models.sql
-- ============================================

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


-- ============================================
-- Migration: 20240205000001_fix_postgrest_foreign_keys.sql
-- ============================================

-- Fix PostgREST foreign key relationships
-- This migration ensures foreign key constraints are properly named for PostgREST

-- Check and rename foreign key constraints if needed
-- PostgREST requires foreign key constraints to be discoverable

DO $$
DECLARE
  fk_record RECORD;
  new_name TEXT;
BEGIN
  -- Find foreign key constraints for generations table
  FOR fk_record IN
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'generations'
      AND kcu.column_name IN ('preset_id', 'model_id')
  LOOP
    -- Generate expected constraint name
    new_name := fk_record.table_name || '_' || fk_record.column_name || '_fkey';
    
    -- If constraint name doesn't match expected pattern, rename it
    IF fk_record.constraint_name != new_name THEN
      RAISE NOTICE 'Found FK constraint: % -> % (expected: %)', 
        fk_record.constraint_name, 
        fk_record.foreign_table_name,
        new_name;
      
      -- Note: PostgreSQL doesn't support renaming constraints directly
      -- We would need to drop and recreate, but that's risky
      -- Instead, we'll just log the information
    ELSE
      RAISE NOTICE 'FK constraint name is correct: %', fk_record.constraint_name;
    END IF;
  END LOOP;
END $$;

-- Ensure foreign key constraints exist and are properly configured
-- This is mainly for verification - constraints should already exist from initial schema

-- Verify foreign keys exist
DO $$
DECLARE
  preset_fk_exists BOOLEAN;
  model_fk_exists BOOLEAN;
BEGIN
  -- Check preset_id foreign key
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'generations'
      AND kcu.column_name = 'preset_id'
  ) INTO preset_fk_exists;
  
  -- Check model_id foreign key
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'generations'
      AND kcu.column_name = 'model_id'
  ) INTO model_fk_exists;
  
  RAISE NOTICE 'preset_id FK exists: %', preset_fk_exists;
  RAISE NOTICE 'model_id FK exists: %', model_fk_exists;
  
  IF NOT preset_fk_exists THEN
    RAISE WARNING 'preset_id foreign key constraint is missing!';
  END IF;
  
  IF NOT model_fk_exists THEN
    RAISE WARNING 'model_id foreign key constraint is missing!';
  END IF;
END $$;


-- ============================================
-- Migration: 20240205000002_verify_video_models.sql
-- ============================================

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


-- ============================================
-- Migration: 20240205000003_complete_models_fix.sql
-- ============================================

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


-- ============================================
-- Migration: 20260117000000_reserve_credits.sql
-- ============================================

-- Add available_balance and reserved_balance columns for atomic reservations
ALTER TABLE credit_accounts
  ADD COLUMN IF NOT EXISTS available_balance NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS reserved_balance NUMERIC DEFAULT 0 NOT NULL;

-- Backfill available_balance from balance when it appears uninitialized
UPDATE credit_accounts
SET available_balance = balance
WHERE available_balance = 0
  AND reserved_balance = 0
  AND balance > 0;

-- Atomic credit reservation function
CREATE OR REPLACE FUNCTION reserve_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_available NUMERIC;
BEGIN
  -- Enforce auth context (only authenticated users for their own ID)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- Lock the row to ensure atomic update
  SELECT available_balance
  INTO current_available
  FROM credit_accounts
  WHERE owner_id = p_user_id
  FOR UPDATE;

  -- Create account if missing
  IF NOT FOUND THEN
    INSERT INTO credit_accounts (owner_id, balance, available_balance, reserved_balance)
    VALUES (p_user_id, 0, 0, 0)
    RETURNING available_balance INTO current_available;
  END IF;

  -- Check sufficient balance
  IF current_available < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  -- Reserve credits atomically
  UPDATE credit_accounts
  SET available_balance = available_balance - p_amount,
      reserved_balance = reserved_balance + p_amount,
      balance = balance - p_amount,
      updated_at = NOW()
  WHERE owner_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Allow only authenticated users to execute
REVOKE ALL ON FUNCTION reserve_credits(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_credits(UUID, INTEGER) TO authenticated;


-- ============================================
-- Migration: 20260117000001_credit_finalize_refund.sql
-- ============================================

-- Add finalize_credits and refund_credits for atomic ledger updates

CREATE OR REPLACE FUNCTION finalize_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_reserved NUMERIC;
BEGIN
  -- Enforce auth context (only authenticated users for their own ID)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- Lock the row to ensure atomic update
  SELECT reserved_balance
  INTO current_reserved
  FROM credit_accounts
  WHERE owner_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_ACCOUNT';
  END IF;

  IF current_reserved < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_RESERVED';
  END IF;

  -- Finalize: reduce reserved balance only
  UPDATE credit_accounts
  SET reserved_balance = reserved_balance - p_amount,
      updated_at = NOW()
  WHERE owner_id = p_user_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_reserved NUMERIC;
BEGIN
  -- Enforce auth context (only authenticated users for their own ID)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;
  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- Lock the row to ensure atomic update
  SELECT reserved_balance
  INTO current_reserved
  FROM credit_accounts
  WHERE owner_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_ACCOUNT';
  END IF;

  IF current_reserved < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_RESERVED';
  END IF;

  -- Refund: move from reserved back to available (and balance)
  UPDATE credit_accounts
  SET reserved_balance = reserved_balance - p_amount,
      available_balance = available_balance + p_amount,
      balance = balance + p_amount,
      updated_at = NOW()
  WHERE owner_id = p_user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION finalize_credits(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finalize_credits(UUID, INTEGER) TO authenticated;

REVOKE ALL ON FUNCTION refund_credits(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refund_credits(UUID, INTEGER) TO authenticated;


-- ============================================
-- Migration: 20260203000000_add_boards_is_pinned.sql
-- ============================================

-- Add is_pinned column to boards table
-- This allows users to pin important boards for quick access

ALTER TABLE boards
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for faster filtering by pinned status
CREATE INDEX IF NOT EXISTS idx_boards_owner_pinned
ON boards(owner_id, is_pinned)
WHERE is_pinned = TRUE;

-- Comment for documentation
COMMENT ON COLUMN boards.is_pinned IS 'Whether the board is pinned for quick access';


-- ============================================
-- Migration: 20260204000000_fix_generations_status_constraint.sql
-- ============================================

-- Fix generations status constraint to include 'processing'
-- This migration ensures the constraint allows all required status values

-- First drop the existing constraint
ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_status_check;

-- Create the new constraint with all required values
ALTER TABLE generations ADD CONSTRAINT generations_status_check 
  CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled'));

-- Also fix provider_tasks status constraint if needed
ALTER TABLE provider_tasks DROP CONSTRAINT IF EXISTS provider_tasks_status_check;
ALTER TABLE provider_tasks ADD CONSTRAINT provider_tasks_status_check
  CHECK (status IN ('pending', 'queued', 'processing', 'succeeded', 'failed'));


-- ============================================
-- Migration: 20260204000001_add_flux2_models.sql
-- ============================================

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


-- ============================================
-- Migration: 20260204000002_add_audio_preset.sql
-- ============================================

-- Add audio preset for audio generation models
INSERT INTO presets (key, type, title_en, title_ru, description_en, description_ru)
VALUES (
  'audio-gen',
  'audio',
  'Audio Generation',
  'Генерация аудио',
  'Generate sound effects and audio',
  'Генерация звуковых эффектов и аудио'
)
ON CONFLICT (key) DO UPDATE SET
  type = EXCLUDED.type,
  title_en = EXCLUDED.title_en,
  title_ru = EXCLUDED.title_ru;


