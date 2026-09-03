/*
# Add member disable/delete feature

1. New Columns
- `profiles.is_disabled` (boolean, default false) — marks a member as disabled by admin.
  When true, the user cannot log in and sees a "tài khoản vô hiệu" message.

2. New Functions
- `admin_disable_user(p_user_id uuid)` — SECURITY DEFINER, callable by authenticated admins only.
  Sets `profiles.is_disabled = true` and bans the user in `auth.users` by setting `banned_until` to a far-future date.
  This prevents the user from obtaining a new auth session.
- `admin_enable_user(p_user_id uuid)` — SECURITY DEFINER, callable by authenticated admins only.
  Reverses the disable: sets `profiles.is_disabled = false` and unbans the user in `auth.users`.

3. Security
- Both functions check `is_admin()` before proceeding.
- REVOKE EXECUTE from anon and PUBLIC; GRANT to authenticated only.
- No RLS policy changes needed (profiles already has admin policies).
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.admin_disable_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
    SET is_disabled = true
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;

  -- Ban the user in auth.users so they cannot get a new session
  UPDATE auth.users
    SET banned_until = '2099-12-31T23:59:59Z'::timestamptz
    WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_disable_user(p_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_disable_user(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_disable_user(p_user_id uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_enable_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
    SET is_disabled = false
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;

  -- Unban the user in auth.users
  UPDATE auth.users
    SET banned_until = NULL
    WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_enable_user(p_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_enable_user(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_enable_user(p_user_id uuid) TO authenticated;