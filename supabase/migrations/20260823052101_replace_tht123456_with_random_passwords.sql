/*
# Thay thế "tht123456" bằng mật khẩu ngẫu nhiên riêng cho từng tài khoản

## Mục đích
- Xóa hoàn toàn khả năng đăng nhập bằng "tht123456"
- Mỗi tài khoản nhận một mật khẩu ngẫu nhiên duy nhất (định dạng: THT + 6 số)
- Mật khẩu mới được lưu trong profiles.password để quản trị viên xem và phân phối
- "tht123456" không còn hoạt động sau khi migration này chạy

## Lưu ý
- Mật khẩu gốc đã mất vĩnh viễn (bcrypt one-way, hash bị ghi đè)
- Mật khẩu mới ngẫu nhiên này là duy nhất cho mỗi tài khoản
- Quản trị viên xem mật khẩu trên trang BAN QUẢN LÝ và thông báo cho người chơi
- Người chơi đổi mật khẩu sau khi đăng nhập nếu muốn
*/

DO $$
DECLARE
  rec RECORD;
  new_pwd TEXT;
BEGIN
  FOR rec IN
    SELECT u.id, p.id AS profile_id
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id::uuid
    WHERE p.password IS NULL
      AND u.encrypted_password = crypt('tht123456', u.encrypted_password)
  LOOP
    -- Generate unique password: THT + 6 random digits
    new_pwd := 'THT' || lpad(floor(random() * 1000000)::text, 6, '0');

    -- Update auth.users encrypted password
    UPDATE auth.users
      SET encrypted_password = crypt(new_pwd, gen_salt('bf')),
          updated_at = now()
      WHERE id = rec.id;

    -- Update profiles.password (plaintext for admin visibility)
    UPDATE public.profiles
      SET password = new_pwd
      WHERE id = rec.profile_id;

    -- Save to password history
    INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
    VALUES (rec.profile_id, NULL, new_pwd, NULL);
  END LOOP;
END $$;
