-- Insert 4 new shop items: 51, 152, 157, 194
-- Mixed categories: buff armor, mouth equipment, trap, healing

INSERT INTO shop_items (name, category, price, currency_type, shop_area, purchase_limit, description, stock) VALUES
-- 51
('Thần Dược "Bát Bảo Kim Cương Béo"', 'Vật phẩm tiêu hao', 1800, 'HUA_TIEN', 'Thường', '02 viên / tuần',
 'Viên linh đan to bằng quả trứng gà, bọc lớp vỏ mỡ lợn ngâm thảo dược cổ truyền. Nuốt viên đan vào: Cơ thể lập tức tăng kích thước gấp đôi, béo tròn như tượng Lặc Ma, tăng 300% giáp vật lý và kháng văng lùi trong 30 giây. Mở đường, đỡ đòn chặn cửa ở Dị sự cấp Ngân và Hoàng. Bạn trở nên quá béo! Không thể chui qua các khe cửa hẹp, giếng nước hay cửa sổ trong thời gian hiệu lực.', 99),
-- 152
('Táo Quân Táo Bôi (Sáp môi Táo Quân)', 'Trang bị miệng', 1000, 'CONG_DUC', 'Hiếm', '01 hũ / tháng',
 'Hũ sáp mật mướp đắng dùng để cúng Táo Quân cuối năm để "dán miệng" không cho báo cáo việc xấu. Tác dụng lên Hí Quỷ, Mộng Quỷ, Quỷ Mẫu (Quỷ dùng chiêu bằng tiếng động/nguyện rủa). Phi sáp bôi trúng miệng quỷ: Dính chặt môi quỷ lại bằng lớp mật quánh đặc, khiến nó không thể gào khóc hay niệm chú trong 15 giây. Khóa chiêu diện rộng của quỷ âm thanh ở Dị sự cấp Hoàng. Nếu ném trượt, sáp dính vào tay người chơi sẽ khiến bạn không thể mở ba lô/túi đồ trong 10 giây vì tay bị dính chặt.', 99),
-- 157
('Bô Sứ "Hoàng Cung Nạp Mệnh"', 'Bẫy thu hút uế khí', 1110, 'AM_DUC', 'Hiếm', '01 chiếc / tháng',
 'Chiếc bô bằng sứ vẽ hoa văn xanh lam của thái giám trong cung, chứa sẵn một lượng uế khí đậm đặc. Tác dụng lên Thủy Quỷ, Huyết Quỷ, Trạch Quỷ (Quỷ hệ chất lỏng/uế khí). Đặt bô xuống đất: Lực hấp dẫn uế khí khiến mọi đòn tấn công dạng chất lỏng/máu độc của quỷ bị hút lệch hướng bay thẳng vào trong bô. Hấp thụ chiêu độc của Boss ở Dị sự cấp Hoàng. Bô chứa tối đa được 3 lần hút; lần thứ 4 bô sẽ nổ tung, bắn uế khí ra khắp phòng gây sát thương độc cho cả nhóm.', 99),
-- 194
('Cổ Mộc Huyết Đan (Viên Kẹo Táo Tàu)', 'Vật phẩm tiêu hao', 330, 'AM_DUC', 'Thường', '03 viên / tháng',
 'Viên đan dược tròn xoe màu đỏ thẫm bọc đường, tỏa ra mùi táo tàu ngòn ngọt. Nuốt viên đan: Hồi ngay 40% Máu trong vòng 1 giây. Cứu tử khẩn cấp ở Dị sự cấp Hoàng và Phỉ. Đan rất dai! Sau khi nuốt, bạn bị dính răng và không thể nói chuyện/chát âm thoại với đồng đội trong 20 giây.', 99);
