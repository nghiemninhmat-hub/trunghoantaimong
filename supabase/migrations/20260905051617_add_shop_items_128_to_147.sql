-- Insert shop items 128-147 into shop_items
-- Elegant/poetic items with subtle support effects

INSERT INTO shop_items (name, category, price, currency_type, shop_area, purchase_limit, description, stock) VALUES
-- 128
('Phù Sanh Nhất Nhẫn (Lá mỏng đời người)', 'Vật phẩm tiêu hao', 800, 'HUA_TIEN', 'Thường', '03 lá / tuần',
 'Phiến lá ngô đồng ngâm qua sương sớm trên núi cao, mỏng manh như tơ lụa nhưng ngạt ngào thanh khí. Khi chịu đòn tấn công từ xa (như đạn âm khí, gai ma), lá cây tự động tan vỡ để triệt tiêu đúng 10% sát thương của đòn đánh đó. Giảm nhẹ sát thương quấy rối ở Dị sự cấp Trúc và Ngân. Chỉ đỡ được đúng 1 lần đánh rồi rách hẳn, không có tác dụng với đòn cận chiến trực tiếp.', 99),
-- 129
('Tuyết Lạc Vô Thanh (Trấn giấy tuyết rơi)', 'Pháp khí thường', 1500, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Thước trấn giấy bằng bạch ngọc đẽo gọt tỉ mỉ, chạm khắc hình bông tuyết mùa đông đang rơi tĩnh lặng. Khi giắt quanh lưng, mọi bước chân, tiếng hít thở và tiếng thu dọn đồ đạc của bạn sẽ bị giảm 30% tiếng động phát ra môi trường. Mộc trinh sát, lén lút băng qua khu vực quỷ ngủ ở Dị sự cấp Ngân. Cơ thể người chơi sẽ luôn tỏa ra cái lạnh nhè nhẹ, dễ bị cảm lạnh nếu ở trong môi trường nước lâu.', 99),
-- 130
('Dạ Nguyệt Lưu Quang (Ngọc phát sáng)', 'Vật phẩm đặc biệt', 50, 'AM_DUC', 'Hiếm', '02 viên / tháng',
 'Viên dạ minh châu kích thước bằng hạt nhãn, phát ra ánh sáng dịu nhẹ như ánh trăng rằm. Tỏa ra quầng sáng dịu mát bán kính 3m, giúp nhìn rõ đường đi trong bóng tối mà không làm kích động các loài quỷ nhạy cảm với lửa/ánh sáng mạnh. Môi trường hang tối hoặc hầm mộ ở Dị sự cấp Trúc và Ngân. Quầng sáng quá yếu, không thể dùng để soi rọi qua sương mù ma quái dầy đặc.', 99),
-- 131
('Đoạn Oán U Hương (Hương thơm đứt đoạn)', 'Vật phẩm tiêu hao', 1200, 'HUA_TIEN', 'Thường', '02 túi / tháng',
 'Túi thơm thêu gấm ướp hoa đỗ quyên khô ngâm cõi âm, tỏa mùi hương nhẹ nhàng thanh nhã. Che phủ hoàn toàn mùi máu tươi và mùi hơi thở của người chơi trong 3 phút, khiến quỷ mù không thể ngửi thấy bạn. Sinh tồn khi đang bị thương ở Dị sự cấp Trúc và Ngân. Hương thơm thu hút các loài côn trùng bình thường (như muỗi, kiến) vây quanh người chơi.', 99),
-- 132
('Minh Nhĩ Trầm Sương (Nút tai ngọc)', 'Pháp khí thường', 1800, 'CONG_DUC', 'Hiếm', '01 đôi / người',
 'Cặp nút đeo tai bằng ngọc bích chạm hình hoa mận, mang hơi lạnh tịnh hóa. Giảm 20% hiệu lực ảo giác từ các tiếng thì thầm, tiếng khóc than của quỷ tác động vào màng nhĩ. Tránh bị loạn trí ở Dị sự cấp Ngân và Hoàng. Giảm 40% khả năng nghe âm thanh thông thường, khiến bạn khó nghe thấy tiếng cảnh báo từ đồng đội.', 99),
-- 133
('Vân Tơ Phược Mộng (Chỉ tơ trói mộng)', 'Vật phẩm tiêu hao', 60, 'AM_DUC', 'Hiếm', '05 cuộn / tháng',
 'Cuộn chỉ tơ tằm nhả dưới trăng tròn, mảnh như tơ nhện nhưng lấp lánh sắc bạc. Dăng chỉ ngang đường làm chuông báo động: Khi quỷ lướt qua làm đứt chỉ, chỉ sẽ phát ra tiếng đàn tranh thanh thoát để cảnh báo vị trí. Giám sát lối đi ở Dị sự cấp Ngân. Tơ rất mỏng manh, gió mạnh hoặc động vật nhỏ chạy qua cũng làm đứt dây gây báo động giả.', 99),
-- 134
('Trúc Nhược Thanh Phong (Quạt trúc ngọc)', 'Pháp khí thường', 2200, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Chiếc quạt xòe làm từ nan trúc non hun khói, mặt quạt vẽ cảnh núi sông mờ ảo. Phẩy quạt tạo ra luồng gió nhẹ giúp thổi dạt sương mù độc hoặc khói độc trong diện tích 2m trước mặt. Dọn dẹp môi trường ở Dị sự cấp Trúc và Ngân. Tốn thể lực khi quạt liên tục; không thể thổi tan sương mù do quỷ cấp Hung Sát tạo ra.', 99),
-- 135
('Định Tâm Thạch Ngạn (Đá kẹp tóc định tâm)', 'Pháp khí thường', 2000, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Trâm cài tóc bằng đá cuội sông ngầm được khắc một chữ "ĐỊNH" viết bằng thư pháp. Giúp tốc độ tụt Tinh Thần (Sanity) chậm hơn 15% khi đứng trong vùng âm khí dầy đặc. Duy trì sự tỉnh táo ở Dị sự cấp Ngân và Hoàng. Trâm khá nặng, đeo lâu gây đau đầu nhẹ sau khi rời khỏi màn chơi.', 99),
-- 136
('Hồi Nhãn Lưu Hà (Nước nhỏ mắt hoa sen)', 'Vật phẩm tiêu hao', 70, 'AM_DUC', 'Hiếm', '02 lọ / tháng',
 'Lọ gốm nhỏ chứa giọt sương đọng trên cánh hoa sen trắng ban sương sớm. Nhỏ vào mắt giúp nhìn rõ hơn các vệt dấu chân âm khí mờ nhạt trên sàn nhà trong 2 phút. Truy vết quỷ ở Dị sự cấp Trúc và Ngân. Gây cay mắt nhẹ trong 3 giây đầu tiên sau khi nhỏ, làm chảy nước mắt liên tục.', 99),
-- 137
('Tịnh Thủy Nhĩ Bối (Chén sứ tịnh thủy)', 'Pháp khí thường', 1000, 'HUA_TIEN', 'Thường', '01 chiếc / người',
 'Chiếc chén sứ trắng tinh khiết, đáy chén chạm nổi hình một chiếc lá trà. Rót chất lỏng vào chén: Nếu chất lỏng có chứa âm khí hoặc độc tố, lòng chén sẽ tự động ngả sang màu xám nhạt. Tránh ăn phải đồ ăn nguyền rủa ở Dị sự cấp Ngân. Chén chỉ nhận biết chứ không có khả năng tịnh hóa hay giải độc cho chất lỏng.', 99),
-- 138
('Phù Âm Khuyết Nguyện (Bùa giấy hình trăng khuyết)', 'Bùa chú tiêu hao', 800, 'CONG_DUC', 'Thường', '03 lá / tháng',
 'Lá bùa cắt theo hình vầng trăng khuyết màu lam nhạt, tỏa ra cảm giác an lành. Dán lên người đồng đội: Hồi phục ngay lập tức 5% Máu (HP) và tạo hiệu ứng dễ chịu nhẹ. Hỗ trợ sinh tồn khẩn cấp ở Dị sự cấp Trúc và Ngân. Lượng máu hồi quá ít, không thể cứu sống người đã rơi vào trạng thái hấp hối.', 99),
-- 139
('Báo Xuân Mộc Đào (Cành đào khô)', 'Vật phẩm tiêu hao', 1100, 'HUA_TIEN', 'Thường', '01 cành / người',
 'Cành đào khô đơm vài nụ hoa nhỏ, được ngâm trong nước thánh đền chùa. Cầm cành đào xua đuổi làm quỷ nhỏ giật mình né xa 1m, không dám áp sát quấy rối trong 5 giây. Dọn quỷ nhỏ ngáng đường ở Dị sự cấp Trúc. Cành gỗ rất giòn, chạm mạnh vào tường hoặc giáp cứng sẽ gãy ngay.', 99),
-- 140
('Tẩy Trần Linh Phấn (Phấn nụ hoa mài)', 'Vật phẩm tiêu hao', 90, 'AM_DUC', 'Hiếm', '02 hộp / tháng',
 'Hộp phấn nụ màu hồng nhạt làm từ bột ngọc trai và cánh hoa lài khô. Thoa bột phấn lên mặt giúp xóa bỏ vết bẩn âm khí, vết tơ nhện ma quái hoặc cảm giác dính nhem nhép trên da. Tiện ích cá nhân ở Dị sự cấp Trúc và Ngân. Phấn có mùi thơm nhẹ, dễ bị quỷ hệ Mỹ Nhân/Tân Nương chú ý đến.', 99),
-- 141
('U Cốc Linh Phong (Chuông gió trúc)', 'Pháp khí thường', 1600, 'HUA_TIEN', 'Hiếm', '01 bộ / người',
 'Bộ chuông gió gồm 4 ống trúc nhỏ treo dưới một miếng gỗ tròn khắc phù chú. Treo trước cửa phòng: Khi có dòng lưu chuyển âm khí bất thường (quỷ tiến lại gần trong 5m), chuông sẽ phát ra tiếng "Linh lang" va chạm nhẹ. Cảnh báo khi nghỉ ngơi ở Dị sự cấp Ngân. Tiếng chuông vang lên cũng đồng thời báo cho quỷ biết nơi đó có người ở.', 99),
-- 142
('Bát Nhã Thanh Âm (Xâu hạt bồ đề)', 'Pháp khí thường', 2500, 'CONG_DUC', 'Hiếm', '01 xâu / người',
 'Xâu 108 hạt cây bồ đề cổ thụ, bề mặt bóng loáng nhờ được mài nhẵn qua thời gian. Khi gặt từng hạt bồ đề, bạn sẽ giảm 10% thời gian chịu các hiệu ứng hoảng sợ hoặc choáng nhẹ. Hỗ trợ tinh thần ở Dị sự cấp Ngân và Hoàng. Phải dùng cả hai tay để niệm gặt hạt, không thể cầm vũ khí cùng lúc.', 99),
-- 143
('Vô Tương Huyền Thấu (Tấm khăn voan xám)', 'Dị bảo hiếm', 100, 'AM_DUC', 'Hiếm', '01 chiếc / tháng',
 'Khăn voan che mặt dệt bằng tơ xám, mỏng như làn khói mùa thu. Đội khăn voan giúp giảm 20% khả năng bị phát hiện khi bạn đang ẩn nấp trong bóng râm hoặc góc tối. Lẩn trốn ở Dị sự cấp Trúc và Ngân. Khăn voan làm giảm tầm nhìn của chính người chơi đi 15%.', 99),
-- 144
('Thầm Hương Tịnh Giáp (Sáp dưỡng gỗ)', 'Vật phẩm tiêu hao', 900, 'HUA_TIEN', 'Thường', '02 hũ / tháng',
 'Hũ sáp chế từ mỡ lợn rừng ngâm tinh dầu trầm hương ngàn năm. Thoa sáp lên vũ khí bằng gỗ giúp hồi phục 20% độ bền của vũ khí đó sau khi chinh chiến. Bảo dưỡng trang bị ở Dị sự cấp Ngân. Không có tác dụng với vũ khí kim loại hay trang bị dệt may.', 99),
-- 145
('Lưu Lạc Lăng Ca (Chiếc sáo trúc nhỏ)', 'Pháp khí thường', 2100, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Chiếc sáo trúc ngắn dệt bằng chỉ đỏ, phát ra tiếng sáo du dương buồn man mác. Thổi sáo khiến các du hồn lang thang dừng lại lắng nghe trong 5 giây, quên đi việc tấn công. Câu giờ ở Dị sự cấp Trúc. Bạn phải đứng yên một chỗ để thổi sáo, hoàn toàn không thể di chuyển hay né đòn.', 99),
-- 146
('Mộc Miên Trường Thọ (Túi bông gòn tịnh hóa)', 'Vật phẩm tiêu hao', 1200, 'CONG_DUC', 'Thường', '03 gói / tháng',
 'Túi bông xơ thu hoạch từ cây gòn cổ thụ trên đỉnh núi thiêng, sạch sẽ không chút bụi trần. Cầm máu vết thương ngay lập tức và giảm 50% nguy cơ bị nhiễm trùng do âm khí dính vào vết thương hở. Sơ cứu ở Dị sự cấp Trúc và Ngân. Chỉ dùng cho vết thương xước da/chảy máu nhẹ, không thể chữa gãy xương hay tổn thương nội tạng.', 99),
-- 147
('Ngọc Thạch Thanh Lương (Viên ngọc ngậm)', 'Dị bảo hiếm', 110, 'AM_DUC', 'Hiếm', '01 viên / tháng',
 'Viên ngọc nhỏ hình giọt nước, tỏa ra vị mát lạnh thanh khiết khi ngậm trong miệng. Ngậm ngọc trong miệng giúp người chơi không bị hôi miệng hay khô cổ họng, giảm 30% mức tiêu thụ nước uống trong suốt màn chơi. Sinh tồn đường dài ở Dị sự cấp Ngân và Hoàng. Nếu bị quỷ đánh mạnh vào cằm, bạn có nguy cơ hóc viên ngọc vào cổ họng.', 99);
