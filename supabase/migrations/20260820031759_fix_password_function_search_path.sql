/*
# Fix password update function - crypt/gen_salt schema resolution

## Purpose
Sửa lỗi đổi mật khẩu: function `admin_update_user_password` sử dụng
`crypt()` và `gen_salt()` từ extension `pgcrypto`, nhưng extension này
được cài trong schema `extensions`, không phải `public`. Do function
có `SET search_path TO 'public'`, PostgreSQL không tìm thấy `crypt()`
và `gen_salt()`, gây lỗi khi đổi mật khẩu.

## Fix
- Đổi `SET search_path` từ `'public'` thành `'public', 'extensions'`
  để PostgreSQL tìm được `crypt()` và `gen_salt()` trong schema `extensions`.
- Function này cập nhật trực tiếp `auth.users.encrypted_password` bằng
  bcrypt hash, GoTrue auth server đọc column này khi xác thực đăng nhập.
- Giữ nguyên logic lưu lịch sử mật khẩu cũ vào `password_history`.
*/
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_old_password text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi mật khẩu.';
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải có ít nhất 6 ký tự.';
  END IF;

  -- Get current password before overwriting
  SELECT password INTO v_old_password FROM public.profiles WHERE id = p_user_id;

  -- Save old password to history
  INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
  VALUES (p_user_id, v_old_password, p_new_password, v_admin_id);

  -- Update auth.users encrypted password with bcrypt
  UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tài khoản.';
  END IF;

  -- Update profiles.password (plaintext for admin visibility)
  UPDATE public.profiles
    SET password = p_new_password
    WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM public;