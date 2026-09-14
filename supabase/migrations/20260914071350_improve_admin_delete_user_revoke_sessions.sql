/*
# Improve admin_delete_user: revoke all active sessions

When deleting a user, also revoke all their refresh tokens so any existing
session is immediately invalidated. This ensures the user cannot continue
using the app even if they have a valid JWT.
*/

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Revoke all refresh tokens so existing sessions are invalidated immediately
  DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id;

  -- Ban the user in auth.users so they cannot get a new session
  UPDATE auth.users
    SET banned_until = '2099-12-31T23:59:59Z'::timestamptz
    WHERE id = p_user_id;

  -- Delete the profile row
  DELETE FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) TO authenticated;
