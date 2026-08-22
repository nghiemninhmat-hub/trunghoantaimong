/*
# Admin Status Update with Notification

1. New Function
- `admin_update_status(p_user_id, p_field, p_value)` → jsonb
  - SECURITY DEFINER, callable only by authenticated users who pass `is_admin()`
  - Updates one of: status_physical, status_spiritual, status_mental on profiles
  - Inserts a notification for the affected player so they see it in their bell
  - Returns { success: true, field, value }

2. Security
- Function checks `public.is_admin()` before performing any update
- Search path locked to `public` for safety
- EXECUTE revoked from anon and authenticated; only the function itself runs with elevated privileges
- Notification insert happens inside the same function (no separate trigger needed)
*/

CREATE OR REPLACE FUNCTION public.admin_update_status(
  p_user_id uuid,
  p_field text,
  p_value text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed_fields text[] := ARRAY['status_physical', 'status_spiritual', 'status_mental'];
  v_field_label text;
  v_old_value text;
  v_oc_name text;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;

  IF NOT (p_field = ANY(v_allowed_fields)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trường trạng thái không hợp lệ');
  END IF;

  EXECUTE format('SELECT %I FROM profiles WHERE id = $1', p_field)
    INTO v_old_value
    USING p_user_id;

  SELECT oc_name INTO v_oc_name FROM profiles WHERE id = p_user_id;

  v_field_label := CASE p_field
    WHEN 'status_physical' THEN 'Thể Chất'
    WHEN 'status_spiritual' THEN 'Tâm Linh'
    WHEN 'status_mental' THEN 'Tinh Thần'
  END;

  EXECUTE format('UPDATE profiles SET %I = $1 WHERE id = $2', p_field)
    USING p_value, p_user_id;

  INSERT INTO notifications (recipient_id, type, title, body, link)
  VALUES (
    p_user_id,
    'status_update',
    'Cập Nhật Trạng Thái',
    'Quản trị viên đã cập nhật trạng thái ' || v_field_label || ' của bạn → ' || p_value,
    '/profile'
  );

  RETURN jsonb_build_object('success', true, 'field', p_field, 'value', p_value);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_status(uuid, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_status(uuid, text, text) TO authenticated;
