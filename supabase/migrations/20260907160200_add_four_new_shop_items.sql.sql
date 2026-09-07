INSERT INTO shop_items (id, name, category, shop_area, price, currency_type, description, stock, purchase_limit)
VALUES
  (
    gen_random_uuid(),
    'Ngũ Hành Huyền Minh Thạch (Đá Phát Âm Khí)',
    'Trấn vật cao cấp',
    'Hiếm',
    180,
    'AM_DUC',
    'Viên đá đen óng ánh tỏa ra âm khí u ám hệt như một vong hồn mạnh mẽ. Ném xa đến vị trí chỉ định: Tác dụng lên Tất cả các loại Quỷ săn mồi bằng Linh Khí / Âm Khí, khiến chúng nhầm viên đá là người chơi và lao tới cắn xé viên đá trong 3 cmt. Tương thích Dị sự: Đánh lạc hướng cứu đồng đội ở Dị sự cấp Ngân và Hoàng. ⚠️ Tác dụng phụ: Nếu ném viên đá quá gần người chơi khác, quỷ sẽ nhầm cả hai và lao vào xé xác luôn cả người chơi đó.',
    99,
    '02 viên / tháng'
  ),
  (
    gen_random_uuid(),
    'Cửu Âm Bồi Nguyệt Đan (Viên Ô Mai Chua)',
    'Vật phẩm tiêu hao',
    'Hiếm',
    450,
    'AM_DUC',
    'Viên ô mai xí muội dầm muối ớt, chua đến mức ngửi thôi đã chảy nước miếng. Ngậm vào miệng: Tác dụng lên Bản thân, giúp miễn nhiễm toàn bộ hiệu ứng làm chậm, hoảng loạn do Quỷ Mộng Mị / Hí Quỷ gây ra trong 3 cmt. Tương thích Dị sự: Chống ma thuật tâm thần ở Dị sự cấp Hoàng và Phỉ. ⚠️ Tác dụng phụ: Vị chua xộc lên tận óc làm nhân vật bị hiệu ứng "Co Giật Mặt", không thể sử dụng kỹ năng ngắm bắn chính xác trong 5 cmt.',
    99,
    '03 viên / tháng'
  ),
  (
    gen_random_uuid(),
    'Thái Cực Hoàn Nguyên Thang (Tô Bún Thang Linh Mộc)',
    'Vật phẩm tiêu hao',
    'Hiếm',
    900,
    'AM_DUC',
    'Tô bún thang bốc khói ngùn ngụt, nấu từ gà tơ và các vị thuốc bắc quý hiếm. Ăn hết bát bún: Tác dụng lên Bản thân, giúp hồi 100% Thể lực và giảm 50% thời gian hồi chiêu (Cooldown) của toàn bộ kỹ năng trong 4 cmt. Tương thích Dị sự: Chuẩn bị trước khi vào phòng Boss ở Dị sự cấp Hoàng và Phỉ. ⚠️ Tác dụng phụ: Bát bún quá nóng! Ăn xong bị hiệu ứng "Bỏng Lưỡi", mất khả năng dùng lệnh thoại kêu cứu trong 10 cmt.',
    99,
    '01 bát / tuần'
  ),
  (
    gen_random_uuid(),
    'Vĩnh Cửu Tán (Ô Giấy Dầu Trú Ẩn)',
    'Pháp khí giới hạn',
    'Hiếm',
    450,
    'CONG_DUC',
    'Chiếc ô giấy dầu vẽ hình hoa mai đỏ, xòe ra tạo thành lá chắn linh lực. Giương ô lên: Tác dụng lên Bản thân và 01 đồng đội đứng sát bên, giúp chặn toàn bộ đòn đánh tầm xa / mưa độc do Quỷ Tầm Xa / Quỷ Độc bắn tới. Tương thích Dị sự: Chống mưa axit/đòn tầm xa ở Dị sự cấp Hoàng và Phỉ. ⚠️ Tác dụng phụ: Khi giương ô, bị cố định tốc độ di chuyển (chỉ có thể đứng yên).',
    99,
    '01 chiếc / người'
  );
