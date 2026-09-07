/*
# Bổ sung dữ liệu hiệu ứng cho 10 kỹ năng thiếu trong skill_templates

1. Mô tả thay đổi
- Cập nhật mental_effect, health_effect, spiritual_effect và các trường liên quan
  cho 10 kỹ năng có dữ liệu trống trong cả file Excel nguồn và database.
- Dữ liệu được suy luận từ mô tả kỹ năng (mo_ta) và logic hệ thống Trùng Hoan Tái.

2. Chi tiết từng kỹ năng:

  a) Chương Kỷ Huy | Đồng Sinh (Y sư - hồi phục sinh lực, cầm máu)
     - tinh_than: Khỏe mạnh (kỹ năng chữa trị, không gây hại tâm lý)
     - the_chat: Kiệt sức (hao tổn sinh lực để chữa trị) - duration: 3
     - tam_linh: Thanh khiết (kỹ năng chính đạo)

  b) Chương Kỷ Huy | Định Sinh (Y sư - định trạng thái sinh mệnh, bảo hộ)
     - tinh_than: Căng thẳng (duy trì tập trung cao độ) - duration: 3
     - the_chat: Khỏe mạnh (bảo hộ nên không gây hại thể chất)
     - tam_linh: Thanh khiết

  c) Chương Kỷ Huy | Phán Âm (Y sư - quan sát khí huyết, xác định điểm yếu)
     - tinh_than: Ảo giác (đã có) - duration: 1
     - the_chat: Đau đầu (hao tổn khi quan sát nội thể) - duration: 2
     - tam_linh: Thanh khiết

  d) Chương Kỷ Huy | Hoán Mệnh (Y sư - hoán chuyển thương tổn)
     - tinh_than: Căng thẳng (rủi ro đồng xu không kiểm soát) - duration: 3
     - the_chat: Ù tai, Khó thở, Đau đầu (đã có) - duration: 3
     - tam_linh: Thanh khiết

  e) Kỷ Huyền Sâm | Trừ tà (Đạo sĩ - đạo phù trấn tà)
     - tinh_than: Căng thẳng - duration: 3
     - the_chat: Kiệt sức - duration: 4
     - tam_linh: Âm khí xâm nhập - duration: 3

  f) Kỷ Huyền Sâm | Phong ấn (Đạo sĩ - Phong Ấn Tam Tài, cần 3 người)
     - tinh_than: Mất phương hướng - duration: 3
     - the_chat: Suy nhược - duration: 3
     - tam_linh: Âm khí xâm nhập - duration: 3

  g) Kỷ Huyền Sâm | Pháp Kiếm (Đạo sĩ - chu sa trên kiếm, tác động âm thể)
     - tinh_than: Căng thẳng - duration: 3
     - the_chat: Đau nhức - duration: 3
     - tam_linh: Âm khí xâm nhập - duration: 3

  h) Trầm Sương | Trận pháp (Thủ đền - Bát Quái trận pháp)
     - tinh_than: Mất phương hướng - duration: 4
     - the_chat: Suy nhược - duration: 4
     - tam_linh: Âm khí xâm nhập - duration: 4

  i) Trầm Sương | Thanh tẩy, siêu độ (Thủ đền - hạo nhiên chính khí)
     - tinh_than: Căng thẳng - duration: 3
     - the_chat: Kiệt sức - duration: 3
     - tam_linh: Thanh khiết (chính khí thanh tẩy)

  j) Trầm Sương | Phục hồi, trị thương (Thủ đền - truyền HP, linh lực)
     - tinh_than: Mệt mỏi - duration: 3
     - the_chat: Kiệt sức - duration: 3
     - tam_linh: Thanh khiết

3. Bảo mật
- Không thay đổi RLS policies hay cấu trúc bảng.
- Chỉ cập nhật dữ liệu (UPDATE) trên các hàng đã tồn tại.
*/

-- Chương Kỷ Huy | Đồng Sinh
UPDATE skill_templates
SET mental_effect = 'Khỏe mạnh', mental_duration = 0,
    health_effect = 'Kiệt sức', health_duration = 3,
    spiritual_effect = 'Thanh khiết', spiritual_duration = 0
WHERE oc_name = 'Chương Kỷ Huy' AND name = 'Đồng Sinh';

-- Chương Kỷ Huy | Định Sinh
UPDATE skill_templates
SET mental_effect = 'Căng thẳng', mental_duration = 3,
    health_effect = 'Khỏe mạnh', health_duration = 0,
    spiritual_effect = 'Thanh khiết', spiritual_duration = 0,
    duration = '3.0'
WHERE oc_name = 'Chương Kỷ Huy' AND name = 'Định Sinh';

-- Chương Kỷ Huy | Phán Âm (đã có mental_effect='Ảo giác', mental_duration=1)
UPDATE skill_templates
SET health_effect = 'Đau đầu', health_duration = 2,
    spiritual_effect = 'Thanh khiết', spiritual_duration = 0
WHERE oc_name = 'Chương Kỷ Huy' AND name = 'Phán Âm';

-- Chương Kỷ Huy | Hoán Mệnh (đã có health_effect='Ù tai, Khó thở, Đau đầu', health_duration=3)
UPDATE skill_templates
SET mental_effect = 'Căng thẳng', mental_duration = 3,
    spiritual_effect = 'Thanh khiết', spiritual_duration = 0,
    tradeoff = 'Kỷ Huy phải chịu phản phệ tương ứng với lượng thương thế được hoán chuyển. Nếu cứu một người đang ở trạng thái cực kỳ nguy hiểm, bản thân hắn có thể bị thương nặng hoặc mất khả năng tiếp tục chiến đấu trong thời gian ngắn.'
WHERE oc_name = 'Chương Kỷ Huy' AND name = 'Hoán Mệnh';

-- Kỷ Huyền Sâm | Trừ tà (đã có duration='4.0')
UPDATE skill_templates
SET mental_effect = 'Căng thẳng', mental_duration = 3,
    health_effect = 'Kiệt sức', health_duration = 4,
    spiritual_effect = 'Âm khí xâm nhập', spiritual_duration = 3
WHERE oc_name = 'Kỷ Huyền Sâm' AND name = 'Trừ tà';

-- Kỷ Huyền Sâm | Phong ấn
UPDATE skill_templates
SET mental_effect = 'Mất phương hướng', mental_duration = 3,
    health_effect = 'Suy nhược', health_duration = 3,
    spiritual_effect = 'Âm khí xâm nhập', spiritual_duration = 3,
    duration = '1 - 3',
    tradeoff = 'Tiêu hao từ 20% đến 70% thể lực để duy trì trận pháp, tuỳ theo cấp độ quỷ dị và độ khó của dị sự. Không thể sử dụng trong 2 dị sự liên tiếp nhau.'
WHERE oc_name = 'Kỷ Huyền Sâm' AND name = 'Phong ấn';

-- Kỷ Huyền Sâm | Pháp Kiếm
UPDATE skill_templates
SET mental_effect = 'Căng thẳng', mental_duration = 3,
    health_effect = 'Đau nhức', health_duration = 3,
    spiritual_effect = 'Âm khí xâm nhập', spiritual_duration = 3
WHERE oc_name = 'Kỷ Huyền Sâm' AND name = 'Pháp Kiếm';

-- Trầm Sương | Trận pháp (đã có duration='4.0')
UPDATE skill_templates
SET mental_effect = 'Mất phương hướng', mental_duration = 4,
    health_effect = 'Suy nhược', health_duration = 4,
    spiritual_effect = 'Âm khí xâm nhập', spiritual_duration = 4
WHERE oc_name = 'Trầm Sương' AND name = 'Trận pháp';

-- Trầm Sương | Thanh tẩy, siêu độ
UPDATE skill_templates
SET mental_effect = 'Căng thẳng', mental_duration = 3,
    health_effect = 'Kiệt sức', health_duration = 3,
    spiritual_effect = 'Thanh khiết', spiritual_duration = 0
WHERE oc_name = 'Trầm Sương' AND name = 'Thanh tẩy, siêu độ';

-- Trầm Sương | Phục hồi, trị thương
UPDATE skill_templates
SET mental_effect = 'Mệt mỏi', mental_duration = 3,
    health_effect = 'Kiệt sức', health_duration = 3,
    spiritual_effect = 'Thanh khiết', spiritual_duration = 0
WHERE oc_name = 'Trầm Sương' AND name = 'Phục hồi, trị thương';