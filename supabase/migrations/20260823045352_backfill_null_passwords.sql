/*
# Backfill mật khẩu cho tài khoản cũ chưa có password

## Mục đích
32 tài khoản được tạo trước khi có cột `profiles.password` nên cột này
đang NULL. Quản trị viên không thể xem mật khẩu của các tài khoản này.

## Giải pháp
- Đặt mật khẩu mặc định "tht123456" cho tất cả tài khoản có password IS NULL
- Cập nhật cả `auth.users.encrypted_password` (để đăng nhập hoạt động)
  và `profiles.password` (để quản trị viên xem được)
- Mật khẩu mặc định này sẽ được quản trị viên đổi sau khi áp dụng

## Lưu ý
- Mật khẩu mặc định "tht123456" (8 ký tự, đủ yêu cầu tối thiểu 6 ký tự)
- Chỉ cập nhật tài khoản có password IS NULL, không ảnh hưởng tài khoản đã có mật khẩu
- Người chơi sẽ dùng mật khẩu mới này để đăng nhập
*/

-- Cập nhật auth.users.encrypted_password cho các tài khoản chưa có password
UPDATE auth.users
SET encrypted_password = crypt('tht123456', gen_salt('bf')),
    updated_at = now()
WHERE id IN (
  SELECT id FROM public.profiles WHERE password IS NULL
);

-- Cập nhật profiles.password cho các tài khoản chưa có password
UPDATE public.profiles
SET password = 'tht123456'
WHERE password IS NULL;
