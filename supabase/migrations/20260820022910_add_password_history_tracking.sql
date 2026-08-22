/*
# Password history tracking

## Purpose
Khi quản trị viên đổi mật khẩu cho người chơi, mật khẩu cũ sẽ bị vô hiệu hóa
(người chơi dùng mật khẩu mới để đăng nhập) nhưng vẫn được lưu lại trong
lịch sử để quản trị viên có thể tra cứu.

## Changes

### 1. New table `password_history`
- `id` uuid PK
- `user_id` uuid FK -> profiles(id) ON DELETE CASCADE
- `old_password` text — mật khẩu cũ (plaintext, để admin tra cứu)
- `new_password` text — mật khẩu mới (plaintext)
- `changed_by` uuid — ID quản trị viên thực hiện
- `created_at` timestamptz DEFAULT now()

### 2. Update function `admin_update_user_password`
- Trước khi ghi mật khẩu mới, lưu mật khẩu cũ vào `password_history`
- Nếu mật khẩu cũ là NULL (tài khoản chưa có mật khẩu), vẫn ghi bản ghi
  với old_password = NULL

### 3. Security
- RLS enabled on `password_history`
- Chỉ admin (is_admin()) mới được SELECT/INSERT
- Function SECURITY DEFINER nên có quyền ghi

## Notes
- Bảng lịch sử mật khẩu chỉ quản trị viên mới xem được
- Mật khẩu cũ trong history không thể dùng để đăng nhập (auth.users đã cập nhật)
*/

CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_password text,
  new_password text NOT NULL,
  changed_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_password_history" ON public.password_history;
CREATE POLICY "admin_select_password_history"
ON public.password_history FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_password_history" ON public.password_history;
CREATE POLICY "admin_insert_password_history"
ON public.password_history FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Update the function to save old password to history before overwriting
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Update auth.users encrypted password
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

GRANT SELECT, INSERT ON public.password_history TO authenticated;