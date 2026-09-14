/*
# Fix admin_delete_user: handle NO ACTION foreign keys

The hiep_luu_registrations.reviewer_id FK uses NO ACTION, which blocks
deleting a profile that has reviewed registrations. Set reviewer_id to
NULL before deleting the profile so the deletion succeeds.
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

  -- Null out NO ACTION foreign keys before deleting the profile
  UPDATE public.hiep_luu_registrations SET reviewer_id = NULL WHERE reviewer_id = p_user_id;

  -- Delete the profile row (CASCADE handles the rest)
  DELETE FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) TO authenticated;
