/*
# Fix bach_hoa_vote function — wrong column names in transactions INSERT

## Summary
The `bach_hoa_vote` function was inserting into the `transactions` table using
column names `type` and `description` which do not exist. The actual columns are
`currency_type` (with a CHECK constraint requiring one of HUA_TIEN/CONG_DUC/AM_DUC/COUPON)
and `reason`. This caused every vote to fail with a column-not-found error, rolling
back the entire transaction (including the hua_tien deduction and vote insert).

## Fix
- `type` → `currency_type` with value `'HUA_TIEN'`
- `description` → `reason`
*/

CREATE OR REPLACE FUNCTION public.bach_hoa_vote(p_entry_id uuid)
RETURNS TABLE(new_vote_count integer, new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_count integer;
  v_balance integer;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để bình chọn';
  END IF;

  -- Atomically deduct 10 hua_tien; abort if insufficient balance
  UPDATE public.profiles
  SET hua_tien = hua_tien - 10
  WHERE id = v_user_id AND hua_tien >= 10
  RETURNING hua_tien INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không đủ 10 hoa tiền để bình chọn';
  END IF;

  -- Insert the vote
  INSERT INTO public.bach_hoa_votes (entry_id, user_id)
  VALUES (p_entry_id, v_user_id);

  -- Increment vote count
  UPDATE public.bach_hoa_entries
  SET vote_count = vote_count + 1, updated_at = now()
  WHERE id = p_entry_id
  RETURNING vote_count INTO v_new_count;

  -- Log transaction
  INSERT INTO public.transactions (user_id, currency_type, amount, reason)
  VALUES (v_user_id, 'HUA_TIEN', -10, 'Bình chọn Bách Hoa Triều Phụng');

  RETURN QUERY SELECT v_new_count, v_balance;
END;
$function$;

-- Ensure execute permissions are granted
GRANT EXECUTE ON FUNCTION public.bach_hoa_vote(uuid) TO authenticated, anon;
