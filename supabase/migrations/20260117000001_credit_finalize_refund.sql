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
