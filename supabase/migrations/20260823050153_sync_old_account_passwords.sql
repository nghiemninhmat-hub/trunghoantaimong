/*
# Sync profiles.password với mật khẩu thực tế của 32 tài khoản cũ

## Mục đích
32 tài khoản cũ đã bị ghi đè mật khẩu thành "tht123456" ở migration trước.
profiles.password đã được đặt về NULL, nhưng mật khẩu đăng nhập thực tế
vẫn là "tht123456". Cần đồng bộ lại để quản trị viên thấy đúng mật khẩu hiện tại.

## Thay đổi
- Cập nhật profiles.password = 'tht123456' cho các tài khoản có password IS NULL
  để đồng bộ với auth.users.encrypted_password đã được set thành "tht123456"
*/

UPDATE public.profiles
SET password = 'tht123456'
WHERE password IS NULL;
