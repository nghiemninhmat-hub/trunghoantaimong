/*
# Revert backfill — đặt profiles.password về NULL cho 32 tài khoản cũ

## Mục đích
Migration trước đã tự đặt mật khẩu mặc định "tht123456" cho 32 tài khoản cũ.
Theo yêu cầu quản trị viên, không nên tự đặt mật khẩu mặc định.

## Thay đổi
- Đặt profiles.password = NULL cho các tài khoản được backfill ở migration trước
- Những tài khoản này sẽ hiển thị "(chưa có MK)" trên trang quản trị
- Quản trị viên sẽ tự đổi mật khẩu cho từng tài khoản thông qua dashboard

## Lưu ý quan trọng
- auth.users.encrypted_password đã bị ghi đè thành "tht123456" ở migration trước
  và KHÔNG THỂ khôi phục mật khẩu gốc. Quản trị viên cần đổi mật khẩu cho các
  tài khoản này để người chơi dùng mật khẩu mới.
- profiles.password = NULL chỉ đánh dấu "chưa có mật khẩu đã lưu" để quản trị
  viên biết cần đặt mật khẩu mới.
*/

-- Đặt profiles.password về NULL cho các tài khoản được backfill
-- (những tài khoản có password = 'tht123456' từ migration backfill)
UPDATE public.profiles
SET password = NULL
WHERE password = 'tht123456';
