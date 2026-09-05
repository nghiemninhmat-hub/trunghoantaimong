/*
# Allow admin to toggle title display for any user

## Problem
Admins can grant/revoke titles but cannot control whether a title is displayed
on a user's profile. All granted titles default to is_displayed=false, so no
titles appear on profile cards until the user themselves toggles it on.

## Changes
- Creates admin_toggle_title_display function allowing admins to set
  is_displayed on any user's title, with the same 3-title display limit.
*/

CREATE OR REPLACE FUNCTION public.admin_toggle_title_display(
  p_user_title_id uuid,
  p_display boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_current_displayed_count int;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;

  SELECT user_id INTO v_user_id FROM public.user_titles WHERE id = p_user_title_id;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Danh hiệu không tồn tại');
  END IF;

  IF p_display THEN
    SELECT count(*) INTO v_current_displayed_count
    FROM public.user_titles
    WHERE user_id = v_user_id AND is_displayed = true;
    IF v_current_displayed_count >= 3 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Chỉ được hiển thị tối đa 3 danh hiệu cùng lúc');
    END IF;
  END IF;

  UPDATE public.user_titles
  SET is_displayed = p_display
  WHERE id = p_user_title_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_toggle_title_display(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_title_display(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_toggle_title_display(uuid, boolean) TO authenticated;
