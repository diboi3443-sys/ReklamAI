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
