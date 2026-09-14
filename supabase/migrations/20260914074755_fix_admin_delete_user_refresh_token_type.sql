/*
# Fix account deletion refresh-token type comparison

1. Change
- Update `public.admin_delete_user(uuid)` so the UUID parameter is converted to text when matching `auth.refresh_tokens.user_id`.

2. Purpose
- Supabase stores refresh-token user identifiers as character data in this internal table.
- The previous function compared that value directly with a UUID, causing the deletion dialog to show `operator does not exist: character varying = uuid`.

3. Security
- Preserve the existing admin-only authorization check.
- Preserve session revocation, permanent login blocking, reviewer-reference cleanup, profile deletion, and authenticated-only execution permissions.

4. Important notes
- No user-facing table structure is changed.
- The account deletion remains permanent and cannot be undone.
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

  DELETE FROM auth.refresh_tokens
  WHERE user_id = p_user_id::text;

  UPDATE auth.users
  SET banned_until = '2099-12-31T23:59:59Z'::timestamptz
  WHERE id = p_user_id;

  UPDATE public.hiep_luu_registrations
  SET reviewer_id = NULL
  WHERE reviewer_id = p_user_id;

  DELETE FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(p_user_id uuid) TO authenticated;
