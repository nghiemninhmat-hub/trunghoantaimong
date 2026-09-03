/*
# Fix cuối cùng: quản trị web đổi mật khẩu phải có tác dụng ngay

## Bỏ pg_net (async, không ổn định)
## Cập nhật trực tiếp auth.users.encrypted_password bằng crypt() với cost 10 (khớp GoTrue)
## Thu hồi sessions + refresh tokens
## Đồng bộ profiles.password + password_history
*/

CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_old_password text;
  v_can_bypass boolean;
BEGIN
  SELECT rolbypassrls INTO v_can_bypass FROM pg_roles WHERE rolname = session_user;

  IF coalesce(v_can_bypass, false) = false AND v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF coalesce(v_can_bypass, false) = false AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi mật khẩu.';
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải có ít nhất 6 ký tự.';
  END IF;

  SELECT password INTO v_old_password FROM public.profiles WHERE id = p_user_id;

  -- 1. Update auth.users.encrypted_password with bcrypt cost 10 (matches GoTrue default)
  UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
        updated_at = now()
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tài khoản.';
  END IF;

  -- 2. Revoke all refresh tokens (forces re-login with new password)
  UPDATE auth.refresh_tokens
    SET revoked = true, updated_at = now()
    WHERE user_id = p_user_id::text AND revoked = false;

  -- 3. Delete all sessions (invalidates active sessions immediately)
  DELETE FROM auth.sessions WHERE user_id = p_user_id;

  -- 4. Sync profiles.password (what admin sees in dashboard)
  UPDATE public.profiles
    SET password = p_new_password
    WHERE id = p_user_id;

  -- 5. Save to password history
  INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
  VALUES (p_user_id, v_old_password, p_new_password, coalesce(v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid));

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM public;
