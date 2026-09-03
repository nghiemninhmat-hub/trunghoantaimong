/*
# Admin Revoke Wheel Spins

1. Overview
- Adds a new SECURITY DEFINER function `admin_revoke_spins(p_user_id, p_amount)` that lets admins subtract wheel spins from a player.
- Mirrors the existing `admin_grant_spins` but subtracts instead of adds.
- Does NOT create notifications or transaction records — the operation is admin-only and silent to the player.
- Prevents wheel_spins from going negative (clamps at 0).

2. New function `admin_revoke_spins(p_user_id uuid, p_amount int)`
- SECURITY DEFINER, callable by admins only (checks public.is_admin()).
- Validates p_amount is 1..1000.
- Subtracts p_amount from the target user's wheel_spins, clamping at 0 (uses GREATEST to avoid negative).
- Raises exception if the target user does not exist.

3. Security
- REVOKE EXECUTE from anon and PUBLIC; GRANT to authenticated only.
- No RLS or policy changes needed (function is SECURITY DEFINER with admin check).
*/

CREATE OR REPLACE FUNCTION public.admin_revoke_spins(p_user_id uuid, p_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 1000 THEN
    RAISE EXCEPTION 'Số lượt không hợp lệ (1-1000)';
  END IF;
  UPDATE public.profiles
    SET wheel_spins = GREATEST(0, wheel_spins - p_amount)
    WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_revoke_spins(p_user_id uuid, p_amount int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_spins(p_user_id uuid, p_amount int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revoke_spins(p_user_id uuid, p_amount int) TO authenticated;
