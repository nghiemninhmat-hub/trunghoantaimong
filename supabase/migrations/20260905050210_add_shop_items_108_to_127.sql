-- Insert shop items 108-127 into shop_items
-- Humorous/unconventional items mapped to existing categories and areas

INSERT INTO shop_items (name, category, price, currency_type, shop_area, purchase_limit, description, stock) VALUES
-- 108
('Bánh Bao Thạch Thấu (Bánh bao trong suốt)', 'Vật phẩm tiêu hao', 1500, 'HUA_TIEN', 'Hiếm', '03 cái / tuần',
 'Chiếc bánh bao làm từ bột sắn dây ngàn năm, trong suốt như thủy tinh, tỏa mùi nhân thịt thơm nức mũi. Ăn bánh bao này vào, cơ thể và trang phục người chơi sẽ trở nên trong suốt hoàn toàn (tàng hình) trong 1 phút. Trốn thoát, ám sát ở Dị sự cấp Ngân và Hoàng. Dù cơ thể tàng hình nhưng thức ăn trong dạ dày và chất thải trong ruột thì không! Nếu người chơi vừa ăn no xong mà tàng hình, quỷ sẽ thấy một đống đồ ăn nửa tiêu hóa đang lơ lửng bước đi.', 99),
-- 109
('Nước Mắm Ngàn Năm Tịnh Âm', 'Vật phẩm tiêu hao', 80, 'AM_DUC', 'Sự kiện', '02 chai / tháng',
 'Hũ nước mắm cốt cá cơm cổ đại ngâm dưới đất âm 300 năm, độ đạm cao đến mức bốc mùi nồng nặc vượt qua ranh giới Âm Dương. Tạt nước mắm vào mặt quỷ: Mùi khắm quá mức quy định sẽ làm quỷ bị choáng váng (Stun), nôn mửa liên tục và mất khả năng dùng ảo thuật trong 20 giây. Phá ảo cảnh, ngắt chiêu Boss ở Dị sự cấp Hoàng. Mùi ám cực lâu! Người chơi tạt nước mắm cũng sẽ bị ám mùi, đi đến đâu đồng đội và quỷ khác đều ngửi thấy trong phạm vi 50m.', 99),
-- 110
('Bùa Đổi Tên "Cửu Trọng Đại Hoàng"', 'Bùa chú cao cấp', 2000, 'CONG_DUC', 'Hiếm', '01 lá / tháng',
 'Lá bùa màu vàng tươi có hình một con chó vàng đang ngủ gật. Dán bùa lên ngực, tên của bạn trong mắt quỷ và sổ Sinh Tử sẽ lập tức đổi thành "Chó Vàng Làng Bên". Quỷ gọi tên thật của bạn để nguyền rủa sẽ hoàn toàn bị thất bại. Chống lại các chiêu thức điểm danh/gọi tên ở Dị sự cấp Hoàng và Phỉ. Trong thời gian dán bùa (10 phút), bạn chỉ có thể phát ra tiếng sủa "Gâu gâu" khi mở miệng nói chuyện.', 99),
-- 111
('Chiếc Quạt Xoè "Nữ Vương Kiều Diễm"', 'Trấn vật cao cấp', 3200, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Chiếc quạt giấy xếp màu hồng phấn thêu hình hoa mẫu đơn, tỏa mùi phấn hoa lụa cổ đại. Xòe quạt ra che nửa mặt và nháy mắt: Cưỡng chế tất cả quỷ đực/quỷ nam xung quanh quay sang tấn công bạn (Taunt) và tăng 20% giáp cho bản thân. Kéo xe, gánh đòn cứu đồng đội ở Dị sự cấp Ngân và Hoàng. Dùng cho nhân vật nam sẽ gây ức chế tâm lý cực cao cho quỷ, khiến quỷ tấn công với sát thương gấp đôi vì gai mắt.', 99),
-- 112
('Dày Rơm "Khinh Công Chạy Mất Dép"', 'Pháp khí thường', 1800, 'HUA_TIEN', 'Hiếm', '01 đôi / người',
 'Đôi giày dệt bằng rơm nếp có gắn hai chiếc lông gà trống ở hai bên mông giày. Kích hoạt tuyệt chiêu "Vô Lực Đào Tẩu": Tốc độ chạy tăng 200% trong 15 giây, để lại một vệt khói bụi mờ mịt phía sau. Trốn chạy khi lỡ chọc giận Boss ở Dị sự cấp Ngân, Hoàng, Phỉ. Giày chỉ chạy được theo đường thẳng! Muốn rẽ ngoặt, bạn phải đâm sầm vào tường hoặc ngã chổng vó để lấy đà rẽ hướng khác.', 99),
-- 113
('Nồi Đất "Đại Đầu Khang"', 'Pháp khí thường', 1200, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Cái nồi đất dùng để kho cá thời xưa, đáy nồi dính đầy muội than đen kịt. Úp nồi lên đầu: Miễn nhiễm 100% sát thương chặt đầu, thắt cổ hoặc bị quỷ móc mắt/ăn não. Sinh tồn khi bị áp sát ở Dị sự cấp Ngân và Hoàng. Tầm nhìn bị giảm về 0! Bạn chỉ có thể nhìn đời qua 2 cái lỗ nhỏ đục ở đáy nồi và nghe tiếng vang "ong ong" mỗi khi bị quỷ đập vào nồi.', 99),
-- 114
('Quần Đẩu Cổ "Nghịch Thiên Bão Táp"', 'Dị bảo hiếm', 120, 'AM_DUC', 'Sự kiện', '01 chiếc / tháng',
 'Chiếc quần lót vải thô màu đỏ gạch của các đô vật thời xưa, mang nồng độ Dương Khí tích tụ qua nhiều năm. Khi bị quỷ ôm chân hoặc kéo xuống nước, thả một quả "Hồn Khí Đát" (trung tiện âm khí): Tạo ra sóng xung kích khí nén đẩy văng quỷ ra xa 5m và làm nước xung quanh sôi ùng ục. Giai đoạn thoát hiểm dưới nước ở Dị sự cấp Ngân và Hoàng. Độ bền giảm rất nhanh sau mỗi lần xả khí. Đồng đội đứng sau lưng cũng bị dính hiệu ứng choáng 2 giây.', 99),
-- 115
('Bút Lông "Vọng Ngôn Sơn Hà"', 'Vật phẩm đặc biệt', 3500, 'CONG_DUC', 'Hiếm', '01 cây / người',
 'Cây bút lông cỡ đại cán bằng trúc miếu, lông bút làm từ râu mèo thần tài. Dùng bút vẽ một cánh cửa lên tường, cánh cửa đó sẽ biến thành cửa thật cho bạn chui qua; vẽ một bức tường lên không trung sẽ biến thành bức tường gạch thật cản đường quỷ trong 10 giây. Mở đường trốn thoát hoặc cản đường đuổi bắt ở Dị sự cấp Hoàng và Phỉ. Trình độ hội họa quyết định độ bền! Vẽ nét nguệch ngoạc như học sinh mẫu giáo thì bức tường chỉ đỡ được 1 cú đấm của quỷ là sụp đổ.', 99),
-- 116
('Gương Đồng "Soi Rõ Sự Thật"', 'Trấn vật cao cấp', 2500, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Gương đồng cổ viền hoa văn rồng phụng, mặt gương bóng loáng nhưng có khả năng biến đổi hình ảnh phản chiếu. Đưa gương ra trước mặt quỷ: Gương sẽ tự động chiếu lại hình ảnh quỷ ở phiên bản xấu xí, mập ạp và hói đầu nhất. Chiêu này làm quỷ bị tổn thương tự trọng sâu sắc, rơi vào trạng thái trầm cảm (Debuff giảm 40% sức tấn công) trong 1 phút. Giảm sức mạnh Boss nữ ở Dị sự cấp Hoàng. Nếu người chơi vô tình nhìn vào gương, gương cũng sẽ hiện ra nhược điểm ngoại hình xấu nhất của bạn, làm bạn tụt 10% Tinh Thần (Sanity).', 99),
-- 117
('Thước Mộc Trục Quỷ "Nghiêm Sư"', 'Vũ khí thường', 4200, 'HUA_TIEN', 'Hiếm', '01 cây / người',
 'Cây thước gỗ gõ đầu học sinh của các đồ gàn thời xưa, thấm đẫm uy nghiêm của người làm thầy. Đập thước vào mông hoặc tay quỷ: Cưỡng chế quỷ rơi vào trạng thái "Đứng Khoanh Tay Bị Cốc Đầu", không thể di chuyển hay tấn công trong 5 giây vì sợ hãi gia giáo. Khống chế quỷ nhỏ ở Dị sự cấp Trúc và Ngân. Không có hiệu lực với quỷ cấp cao hơn (như Quỷ Tướng); nếu đập thước vào Quỷ Tướng, thước sẽ gãy và bạn sẽ bị đập lại gấp đôi.', 99),
-- 118
('Chày Giã Tỏi "Vương Gia"', 'Vũ khí thường', 90, 'AM_DUC', 'Sự kiện', '01 chiếc / tháng',
 'Chiếc chày bằng gỗ ngã sét đâm, dùng để giã tỏi ngâm dấm trong bếp điện đền cổ. Gõ chày vào đầu thi quỷ sẽ phát ra tiếng "CỐC!" cực to, làm vương vãi hương tỏi dương khí cực mạnh, đốt cháy ma độc và đẩy lùi quỷ 3m. Phá giáp thi quỷ ở Dị sự cấp Ngân và Hoàng. Tiếng "CỐC" quá vui tai có thể khiến người chơi bị nghiện gõ, dẫn đến việc đứng gõ quỷ liên tục mà quên mất nhiệm vụ chính.', 99),
-- 119
('Chum Rượu "Túy Ôn Thần"', 'Vật phẩm đặc biệt', 5500, 'CONG_DUC', 'Hiếm', '01 bình / tháng',
 'Bình rượu ủ bằng ngũ cốc thượng hạng kết hợp với bùa Trục Tà, thơm nức lòng người. Uống một ngụm: Cơ thể bước vào trạng thái "Túy Quyền Mông Cổ". Né tránh 80% mọi đòn tấn công vật lý của quỷ và tăng 100% sức mạnh đấm tay không trong 30 giây. Lật kèo khi hết vũ khí ở Dị sự cấp Hoàng và Phỉ. Nhân vật sẽ bị say rượu nặng, màn hình chơi bị điên đảo, điều khiển phím bấm bị đảo ngược hoàn toàn (Trái thành Phải, Tiến thành Lùi).', 99),
-- 120
('Bùa "Tự Động Té Ngã" (Cối Xay Bùa)', 'Bùa chú tiêu hao', 1100, 'HUA_TIEN', 'Thường', '05 lá / tuần',
 'Lá bùa vẽ hình vỏ chuối màu xanh lét. Ném bùa dưới chân quỷ: Tạo ra một vùng mặt đất trượt ma sát bằng 0. Quỷ lao qua sẽ bị trượt chân ngã chổng cặc/vồ ếch, ngắt hoàn toàn đòn gạt và chịu sát thương té ngã. Ngắt chiêu càn quét của quỷ ở Dị sự cấp Ngân và Hoàng. Bùa không phân biệt ai! Đồng đội hoặc chính bạn chạy qua cũng sẽ ngã chổng gọng tương tự.', 99),
-- 121
('Chiếc Loa Đồng "Gia Khinh Trì"', 'Pháp khí thường', 2800, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Chiếc loa bằng đồng thau giống như loa rao bán hàng của các lái buôn cổ đại. Nói vào loa để gào to các câu tụng kinh hoặc chửi thề. Âm thanh khuếch đại gấp 10 lần, tạo thành sóng âm vật lý đẩy lùi đám đông quỷ nhỏ và làm rối loạn hàng ngũ quỷ. Dọn đường, giải tán đám đông quỷ ở Dị sự cấp Trúc và Ngân. Tiếng gào to sẽ thu hút sự chú ý của toàn bộ Boss trong bán kính 200m tìm đến "tâm sự".', 99),
-- 122
('Áo Yếm Đỏ "Đầu Điền Ngưu"', 'Dị bảo hiếm', 150, 'AM_DUC', 'Sự kiện', '01 cái / người',
 'Chiếc áo yếm thêu hình con trâu vàng của trẻ em thời xưa, màu đỏ tươi rực rỡ. Mặc áo yếm đỏ vào: Tăng 50% giáp vật lý và phản lại 30% sát thương đâm/đập thành sát thương lửa dương khí. Tanker đỡ đòn ở Dị sự cấp Hoàng. Quỷ thuộc hệ Trâu/Bò/Động Vật sẽ bị kích động mạnh khi thấy màu đỏ, lao vào húc bạn với 200% tốc độ.', 99),
-- 123
('Tượng Thần Tài "Cười Hả Hê"', 'Trấn vật cao cấp', 4000, 'CONG_DUC', 'Hiếm', '01 tượng / người',
 'Bức tượng Thần Tài bằng sứ sơn màu rực rỡ, cái bụng bự và nụ cười ngoác đến tận mang tai. Đặt tượng xuống đất: Tượng phát ra tiếng cười "Ha Ha Ha" sang sảng. Tiếng cười này xua tan mọi mù mịt, sương mù ma quái và lập tức hồi 50% Tinh Thần (Sanity) cho cả nhóm. Hồi phục tinh thần khẩn cấp ở Dị sự cấp Hoàng và Phỉ. Tiếng cười quá to và dai dẳng (kéo dài 3 phút) sẽ làm người chơi bị nhức đầu và không thể nghe thấy tiếng bước chân quỷ đang tiến lại gần.', 99),
-- 124
('Dầu Cù Là "Thái Dương Cổ Truyền"', 'Vật phẩm tiêu hao', 600, 'HUA_TIEN', 'Thường', '05 hũ / tuần',
 'Hũ cao bôi nhỏ bằng thiếc, bên trong là chất cao màu vàng thơm mùi bạc hà và đinh hương nồng nặc. Bôi cao vào hai bên thái dương: Xóa bỏ lập tức mọi hiệu ứng ảo giác, choáng váng, buồn ngủ do quỷ gây ra; đồng thời tăng 20% tốc độ đánh trong 30 giây. Giải hiệu ứng khống chế ở Dị sự cấp Ngân và Hoàng. Nếu lỡ tay bôi trúng vào mắt, bạn sẽ bị hiệu ứng "Mù Cực Đột Ngột" và khóc lóc thảm thiết trong 15 giây vì cay!', 99),
-- 125
('Thần Phù "Oản Đậu Hũ" (Bùa Đậu Hũ)', 'Bùa chú cao cấp', 1500, 'CONG_DUC', 'Hiếm', '03 lá / tháng',
 'Lá bùa được in trên miếng bìa đậu hũ khô dính chút gia vị cổ truyền. Dán bùa lên người: Khi bị quỷ đâm/chặt, cơ thể bạn sẽ trở nên mềm dẻo và đàn hồi như miếng đậu hũ. Đòn đánh của quỷ sẽ bị nảy ngược ra mà không gây thương tích. Hấp thụ đòn chí mạng ở Dị sự cấp Hoàng. Cơ thể mềm dẻo khiến bạn bị nảy tưng tưng như quả bóng mỗi khi chạm vào tường hoặc mặt đất trong 10 giây.', 99),
-- 126
('Cần Cụ "Trục Quỷ Điền Sào" (Bồn Cầu Cổ)', 'Trấn vật phong ấn', 200, 'AM_DUC', 'Sự kiện', '01 chiếc / toàn máy chủ',
 'Chiếc bồn cầu đẽo bằng gỗ sông ngầm, vốn dùng trong các vương phủ thời xưa để trút bỏ uế khí. Mở nắp bồn cầu ra: Tạo lực hút không khí cực mạnh (Vacuum) hút tụi quỷ nhỏ hoặc thể lỏng của Huyết Quỷ vào bên trong rồi đậy nắp lại phong ấn vĩnh viễn! Dọn dẹp quỷ con hoặc Boss dạng lỏng ở Dị sự cấp Hoàng và Phỉ. Khi hút đầy quỷ, bồn cầu sẽ bị nghẹt và bốc ra mùi hôi thối dữ dội, bắt buộc người chơi phải dội nước dương khí mới dùng tiếp được.', 99),
-- 127
('Chiếc Đũa Phép "Cơm Gia Đình"', 'Pháp khí hiếm', 3800, 'HUA_TIEN', 'Hiếm', '01 đôi / người',
 'Đôi đũa gỗ gõ mắm muối ngàn năm, chuyên dùng để gắp thức ăn trong các bữa cơm cúng cổ truyền. Cầm đôi đũa gắp thẳng vào mũi hoặc đầu lưỡi của quỷ: Khóa chặt chuyển động của quỷ trong 10 giây giống như gắp một gắp thịt nướng! Khống chế cứng Boss ở Dị sự cấp Hoàng. Yêu cầu tay nghề gắp đũa cực kỳ chuẩn xác của người chơi. Nếu gắp trượt, bạn sẽ bị quỷ cắn trúng tay và gãy đũa ngay lập tức.', 99);
