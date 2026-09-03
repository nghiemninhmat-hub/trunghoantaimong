/*
# Fix admin wheel-spin synchronization

1. Purpose
- Make granting and revoking wheel spins update the spendable balance consistently.
- Keep `wheel_total_spins` reserved for actual spins performed by the player, so admin grants do not trigger the guaranteed-special threshold.
- Preserve the existing function return type so current web clients remain compatible.

2. Modified functions
- `public.admin_grant_spins(p_user_id, p_amount)` now updates the balance atomically and handles NULL balances safely.
- `public.admin_revoke_spins(p_user_id, p_amount)` now updates the balance atomically, handles NULL balances safely, and clamps at zero.

3. Security
- Both functions remain `SECURITY DEFINER`.
- Only authenticated callers may execute them.
- Each function still requires `public.is_admin()`.

4. Important notes
- Existing player spin totals are not changed.
- `wheel_total_spins` changes only when the player actually spins.
- The admin panel refreshes the player list after the function completes.
*/

CREATE OR REPLACE FUNCTION public.admin_grant_spins(p_user_id uuid, p_amount int)
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
  SET wheel_spins = COALESCE(wheel_spins, 0) + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

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
  SET wheel_spins = GREATEST(0, COALESCE(wheel_spins, 0) - p_amount)
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_grant_spins(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_spins(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_grant_spins(uuid, int) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_revoke_spins(uuid, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_spins(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revoke_spins(uuid, int) TO authenticated;
