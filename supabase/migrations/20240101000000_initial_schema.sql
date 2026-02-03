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
