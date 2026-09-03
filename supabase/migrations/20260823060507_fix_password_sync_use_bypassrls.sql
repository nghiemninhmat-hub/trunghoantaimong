/*
# Fix password sync — use rolbypassrls instead of rolsuper

## Vấn đề
- postgres role không có rolsuper=true trên Supabase, nên kiểm tra rolsuper không hoạt động
- postgres và service_role đều có rolbypassrls=true — đây là cách đúng để phân biệt
  quản trị web (gọi trực tiếp trong DB) với ban quản lý web (gọi qua web app)

## Giải pháp
- Dùng rolbypassrls thay vì rolsuper để cho phép quản trị web gọi trực tiếp
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
  VALUES (p_user_id, v_old_password, p_new_password, coalesce(v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid));

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM public;


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
  v_can_bypass boolean;
BEGIN
  SELECT rolbypassrls INTO v_can_bypass FROM pg_roles WHERE rolname = session_user;

  IF coalesce(v_can_bypass, false) = false THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
    END IF;
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi mật khẩu.';
    END IF;
  END IF;

  SELECT password INTO v_old_password FROM public.profiles WHERE id = p_user_id;

  INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
  VALUES (p_user_id, v_old_password, p_new_password, coalesce(p_changed_by, '00000000-0000-0000-0000-000000000000'::uuid));

  UPDATE public.profiles
    SET password = p_new_password
    WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_save_password_change(uuid, text, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_save_password_change(uuid, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_save_password_change(uuid, text, uuid) FROM public;
