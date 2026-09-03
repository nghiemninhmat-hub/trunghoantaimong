/*
# Fix admin_update_user_password to also save password history

## Mục đích
- Hàm admin_update_user_password hiện tại chỉ cập nhật auth.users và profiles.password
  nhưng không lưu vào password_history
- Thêm logic lưu lịch sử mật khẩu cũ vào password_history để đồng bộ với edge function
- Hàm này sẽ được gọi trực tiếp từ frontend qua RPC với session token quản trị viên
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

  SELECT password INTO v_old_password FROM public.profiles WHERE id = p_user_id;

  UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy tài khoản.';
  END IF;

  UPDATE public.profiles
    SET password = p_new_password
    WHERE id = p_user_id;

  INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
  VALUES (p_user_id, v_old_password, p_new_password, v_admin_id);

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM public;
