/*
# Bulk password reset for all approved accounts

## Mục đích
- Cho phép quản trị viên đổi mật khẩu cho TẤT CẢ tài khoản đã phê duyệt cùng lúc
- Hai chế độ: (1) cùng một mật khẩu cho tất cả, (2) mật khẩu ngẫu nhiên riêng cho từng tài khoản
- Trả về danh sách { user_id, oc_name, new_password } để quản trị viên xem và phân phối
- Mật khẩu mới có hiệu lực ngay lập tức (auth.users.encrypted_password được cập nhật)
- Lưu lịch sử vào password_history cho mỗi tài khoản

## Bảo mật
- SECURITY DEFINER, chỉ admin (is_admin()) mới được gọi
- search_path gồm 'public', 'extensions' để tìm thấy crypt()/gen_salt()
*/

CREATE OR REPLACE FUNCTION public.admin_bulk_update_passwords(
  p_mode text DEFAULT 'random',
  p_common_password text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  oc_name text,
  new_password text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  rec RECORD;
  v_pwd text;
  v_old_pwd text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi mật khẩu.';
  END IF;

  IF p_mode = 'common' THEN
    IF p_common_password IS NULL OR length(p_common_password) < 6 THEN
      RAISE EXCEPTION 'Mật khẩu chung phải có ít nhất 6 ký tự.';
    END IF;
  ELSIF p_mode = 'random' THEN
    -- OK, generate per-account
  ELSE
    RAISE EXCEPTION 'Chế độ không hợp lệ. Dùng "common" hoặc "random".';
  END IF;

  FOR rec IN
    SELECT p.id, p.oc_name, p.password
    FROM public.profiles p
    WHERE p.is_approved = true
    ORDER BY p.oc_name
  LOOP
    IF p_mode = 'common' THEN
      v_pwd := p_common_password;
    ELSE
      v_pwd := 'THT' || lpad(floor(random() * 1000000)::text, 6, '0');
    END IF;

    v_old_pwd := rec.password;

    -- Update auth.users
    UPDATE auth.users
      SET encrypted_password = crypt(v_pwd, gen_salt('bf')),
          updated_at = now()
      WHERE id = rec.id;

    -- Update profiles.password
    UPDATE public.profiles
      SET password = v_pwd
      WHERE id = rec.id;

    -- Save to password history
    INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
    VALUES (rec.id, v_old_pwd, v_pwd, v_admin_id);

    user_id := rec.id;
    oc_name := rec.oc_name;
    new_password := v_pwd;
    RETURN NEXT;
  END LOOP;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_bulk_update_passwords(text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_update_passwords(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_update_passwords(text, text) FROM public;
