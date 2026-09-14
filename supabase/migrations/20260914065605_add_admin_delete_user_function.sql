/*
# Add admin delete user function

1. New Function
- `admin_delete_user(p_user_id uuid)` — SECURITY DEFINER, callable by authenticated admins only.
  Permanently deletes a user account:
  - Bans the user in auth.users (banned_until = far-future) so they cannot log in
  - Deletes the profile row from public.profiles
  This is irreversible — the user disappears from the member list and cannot authenticate.

2. Security
  - Checks is_admin() before proceeding.
  - REVOKE EXECUTE from anon and PUBLIC; GRANT to authenticated only.
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

  -- Ban the user in auth.users so they cannot get a new session
  UPDATE auth.users
    SET banned_until = '2099-12-31T23:59:59Z'::timestptz
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
