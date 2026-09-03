/*
# Đặt profiles.password về NULL cho 32 tài khoản cũ

## Mục đích
- Quản trị viên thấy rõ tài khoản nào chưa được đổi mật khẩu (hiển thị "(chưa có MK)")
- Người chơi vẫn đăng nhập được bằng "tht123456" (auth.users đã bị ghi đè, không thể khôi phục)
- Quản trị viên sẽ tự đổi mật khẩu cho từng tài khoản khi cần

## Lưu ý
- auth.users.encrypted_password đã bị ghi đè thành hash "tht123456" ở migration backfill
  và KHÔNG THỂ khôi phục mật khẩu gốc (bcrypt là mã hóa một chiều)
- profiles.password = NULL chỉ đánh dấu "chưa được quản trị viên đổi mật khẩu"
*/

UPDATE public.profiles
SET password = NULL
WHERE password = 'tht123456';
