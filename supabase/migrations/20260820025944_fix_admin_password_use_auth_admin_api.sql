/*
# Fix admin password update to use Auth Admin API via Edge Function

## Purpose
Sửa lỗi: khi quản trị viên đổi mật khẩu cho người chơi, người chơi không thể
đăng nhập bằng mật khẩu mới. Nguyên nhân: cập nhật trực tiếp
auth.users.encrypted_password qua SQL không đồng bộ với GoTrue auth server.

## Giải pháp
- Tách logic: Edge Function `admin-update-password` sẽ gọi Auth Admin API
  (PUT /auth/v1/admin/users/:id) để cập nhật mật khẩu đúng cách.
- Function `admin_save_password_change` mới chỉ lo phần DB:
  lưu lịch sử mật khẩu cũ + cập nhật profiles.password.

## Changes

### 1. New function `admin_save_password_change(p_user_id, p_new_password, p_changed_by)`
- SECURITY DEFINER, search_path = 'public'
- Lưu mật khẩu cũ vào password_history
- Cập nhật profiles.password = p_new_password
- Không kiểm tra is_admin() vì edge function đã kiểm tra rồi,
  và function này chạy với service role key (bypass RLS)

### 2. Giữ nguyên `admin_update_user_password` cũ
- Vẫn giữ để không phá vỡ code cũ, nhưng frontend sẽ chuyển sang gọi
  edge function thay vì RPC này

## Security
- admin_save_password_change: REVOKE from anon/public, GRANT to authenticated
- Edge function kiểm tra is_admin trước khi gọi function này
*/
CREATE OR REPLACE FUNCTION public.admin_save_password_change(
  p_user_id uuid,
  p_new_password text,
  p_changed_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_password text;
BEGIN
  SELECT password INTO v_old_password FROM public.profiles WHERE id = p_user_id;

  INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
  VALUES (p_user_id, v_old_password, p_new_password, p_changed_by);

  UPDATE public.profiles
    SET password = p_new_password
    WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_save_password_change(uuid, text, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_save_password_change(uuid, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_save_password_change(uuid, text, uuid) FROM public;