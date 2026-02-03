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
