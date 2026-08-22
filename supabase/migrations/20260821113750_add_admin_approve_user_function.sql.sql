/*
# Admin approve user function

1. Overview
- The `approveUser` action in the admin dashboard does a direct `.update()` on `profiles` to set `is_approved = true`, `approved_by`, and `approved_at`.
- However, the `authenticated` role's column-level UPDATE grant on `profiles` only covers `avatar_url`, `bio`, `anonymous_name`, `anonymous_name_changes`.
- The `is_approved`, `approved_by`, and `approved_at` columns are NOT updatable by `authenticated`, so the update silently fails (RLS allows it via `profiles_admin_update_all`, but the column privilege blocks it).
- This migration adds a SECURITY DEFINER function `admin_approve_user(p_user_id uuid, p_admin_id uuid)` that performs the approval, bypassing column-level restrictions safely.
- Mirrors the existing `admin_update_status` pattern.

2. New function `admin_approve_user(p_user_id uuid, p_admin_id uuid)`
- SECURITY DEFINER, callable by authenticated only (checks is_admin()).
- Sets is_approved = true, approved_by = p_admin_id, approved_at = now().
- Raises exception if target user does not exist.

3. Security
- REVOKE EXECUTE from anon and PUBLIC; GRANT to authenticated only.
- No RLS or policy changes needed.
*/

CREATE OR REPLACE FUNCTION public.admin_approve_user(p_user_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
    SET is_approved = true,
        approved_by = p_admin_id,
        approved_at = now()
    WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Người chơi không tồn tại';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_approve_user(p_user_id uuid, p_admin_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_approve_user(p_user_id uuid, p_admin_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_user(p_user_id uuid, p_admin_id uuid) TO authenticated;
