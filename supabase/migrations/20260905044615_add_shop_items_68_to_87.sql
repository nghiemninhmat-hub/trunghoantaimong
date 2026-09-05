-- Insert shop items 68-87 into shop_items
-- These are humorous/unconventional items, mapped to existing categories and areas

INSERT INTO shop_items (name, category, price, currency_type, shop_area, purchase_limit, description, stock) VALUES
-- 68
('Quạt Giấy Rách Của Tế Công', 'Pháp khí thường', 1800, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Chiếc quạt nan tre rách rưới, tỏa ra mùi khét của rượu nếp và thịt chó. Quạt một cái, quỷ quái lập tức bị luồng gió hôi hám hất văng xa 5m và ngất ngơ vì "say rượu giả". Giải tán đám đông quỷ cấp thấp ở Dị sự cấp Thi và Ngân. Người quạt cũng sẽ bị dính mùi rượu thịt chó nồng nặc suốt 24 giờ, đi đến đâu Ngạ Quỷ thèm ăn đuổi theo đến đó.', 99),
-- 69
('Mắm Tôm Gia Truyền Bách Năm', 'Vật phẩm tiêu hao', 450, 'HUA_TIEN', 'Thường', '03 hũ / tuần',
 'Hũ mắm tôm ủ trong chum sành dưới lòng đất 100 năm, hội tụ đỉnh cao "chính khí cực thối". Tạt mắm tôm vào mặt quỷ làm chúng bị "sốc mùi", nôn mửa liên tục và mất khả năng ngửi thấy sinh khí người chơi trong 10 phút. Tạo cơ hội tẩu thoát ở Dị sự cấp Ngân và Hoàng. Bị dính một giọt vào quần áo thì đồng đội cũng sẽ xa lánh bạn, giảm 80% chỉ số thiện cảm của các NPC xung quanh.', 99),
-- 70
('Búa Vàng Đập Chuột Linh Tự', 'Vũ khí thường', 2200, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Chiếc búa bằng xốp mạ vàng nhưng gia trì chú thuật nặng ngàn cân khi đập vào đầu quỷ. Đập trúng đầu quỷ sẽ phát ra tiếng "BONG!" cực to, làm quỷ xuất hiện vòng sao quay mòng mòng trên đầu và bị choáng (Stun) 5 giây. Khống chế quỷ nhỏ hiếu động ở Dị sự cấp Thi và Ngân. Mỗi lần đập "BONG!", tiếng động sẽ thu hút toàn bộ quỷ quái trong bán kính 100m mò tới xem chuyện gì đang xảy ra.', 99),
-- 71
('Chiếu Cót Cãi Nhau Gia Đình', 'Trấn vật cao cấp', 60, 'AM_DUC', 'Sự kiện', '01 chiếc / tháng',
 'Tấm chiếu cót trải ở đình làng xóm cũ, thấm đẫm oán khí từ hàng ngàn cuộc cãi vã mùng 1 Tết. Trải chiếu ra, toán âm binh bước vào sẽ tự động quay sang chửi lộn, đánh lộn lẫn nhau vì những lý do lặt vặt. Gây nhiễu loạn đội hình địch ở Dị sự cấp Hoàng và Phỉ. Nếu người chơi vô tình bước chân lên chiếu, bạn cũng sẽ lập tức nhảy vào chửi nhau với quỷ chứ không chịu chạy trốn.', 99),
-- 72
('Yếm Đỏ Tân Nương (Nhái)', 'Dị bảo hiếm', 3500, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Chiếc áo yếm màu đỏ rực thêu hoa mẫu đơn nhưng kích cỡ dành cho nam giới thể hình lực lưỡng. Mặc yếm đỏ vào, Tân Nương Quỷ nhìn thấy sẽ bị ngơ ngác, hoang mang sâu sắc về nhân sinh, ngưng tấn công trong 10 giây vì không hiểu chuyện gì xảy ra. Phá vỡ không khí căng thẳng ở Dị sự cấp Hoàng. Tăng 300% tỷ lệ bị Quỷ Tướng nam (nếu có) chú ý và đuổi theo đòi "kết duyên".', 99),
-- 73
('Gương Thần "Selfie" Cổ Đại', 'Pháp khí hiếm', 1200, 'AM_DUC', 'Sự kiện', '01 chiếc / tháng',
 'Mặt gương đồng ma mị, bất kỳ sinh linh hay ma quỷ nào nhìn vào cũng thấy mình đẹp hơn 1000 lần. Giơ gương ra, quỷ quái sẽ dính chặt mắt vào gương để tự ngắm nghía, chốt dáng, vuốt tóc mà quên mất việc phải đi giết người. Câu giờ cực kỳ hiệu quả trong Dị sự cấp Ngân và Hoàng. Nếu người chơi tự nhìn vào gương quá 3 giây, bạn cũng sẽ bị mê đắm nhan sắc của chính mình và đứng ngắm đến hết giờ.', 99),
-- 74
('Đuôi Cáo Chín Dại (Cáo điên)', 'Vật phẩm tiêu hao', 5000, 'HUA_TIEN', 'Hiếm', '02 chiếc / tuần',
 'Đuôi của con hồ ly bị ngáo ngơ, chứa năng lượng hỗn loạn không thể kiểm soát. Ném xuống đất, toàn bộ người lẫn quỷ trong khu vực sẽ bắt đầu nhảy múa tung tăng bài "Vũ điệu trừ tà" trong 15 giây. Hủy chiêu thức tích lực của boss ở Dị sự cấp Hoàng và Phỉ. Bạn cũng phải nhảy múa cùng quỷ, không thể di chuyển hay dùng chiêu khác trong thời gian hiệu lực.', 99),
-- 75
('Nước Mắt Cá Sấu Linh', 'Bùa chú cao cấp', 900, 'CONG_DUC', 'Hiếm', '02 lọ / tuần',
 'Lọ nước cất từ mắt con sấu tinh, nhỏ vào mắt giúp nhìn thấy nỗi đau của người khác. Nhỏ vào mắt rồi khóc lóc van xin, khiến đại quỷ cảm thấy bạn quá thảm hại và tủi thân, tự dưng mất hứng giết bạn. Cứu mạng phút chót ở Dị sự cấp Phỉ. Chỉ có hiệu lực nếu bạn diễn xuất thật trôi chảy; nếu giả vờ khóc trơ tráo sẽ bị quỷ đập chết nhanh hơn.', 99),
-- 76
('Thùng Rác Âm Dương', 'Trấn vật phong ấn', 80, 'AM_DUC', 'Sự kiện', '01 chiếc / người',
 'Chiếc thùng gỗ đút vôi màu đen, mở nắp ra là hư vô không đáy chuyên hút rác tâm linh. Có thể ném thẳng bùa lỗi, đồ nguyền rủa hoặc chộp đầu Tiểu Quỷ quăng vào thùng để "tiêu hủy rác thải". Dọn dẹp hiện trường ở Dị sự cấp Thi và Ngân. Nếu lỡ tay làm rơi đồ đạc quan trọng vào thùng, nó sẽ mất vĩnh viễn không lấy lại được.', 99),
-- 77
('Sáo Trúc Thất Âm (Thổi Tệ)', 'Pháp khí thường', 2800, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Cây sáo trúc gia trì phù văn, nhưng ai thổi vào cũng phát ra tiếng rên rỉ lệch tông khủng khiếp. Tiếng sáo dở tệ đến mức quỷ quái phải bịt tai ôm đầu chịu đựng, giảm 50% khả năng tập trung và né tránh. Hỗ trợ đồng đội xông lên đánh ở Dị sự cấp Ngân và Hoàng. Đồng đội đứng gần không đeo nút tai cũng sẽ bị tụt máu do "thương tổn tinh thần sâu sắc".', 99),
-- 78
('Quả Khổ Qua Ngâm Giấm', 'Vật phẩm tiêu hao', 600, 'CONG_DUC', 'Thường', '05 quả / tuần',
 'Quả đắng ngâm trong giấm chua 3 năm, vị đắng chua xé lưỡi có thể thức tỉnh vạn vật. Nhét quả này vào miệng mục tiêu đang bị nhập/mê chướng, vị đắng cực hạn sẽ làm họ giật nảy người tỉnh rụi ngay lập tức. Giải bùa mê tốc độ cao ở Dị sự cấp Hoàng. Người ăn xong sẽ bị dính hiệu ứng "Khó ở", nói năng cọc cằn với tất cả mọi người trong 1 giờ.', 99),
-- 79
('Chuông Lạc Lừa Lừa', 'Pháp khí hiếm', 40, 'AM_DUC', 'Hiếm', '02 chiếc / tháng',
 'Chiếc chuông lục lạc đeo cổ trâu nhưng phát ra tiếng bước chân của 100 người đàn ông khỏe mạnh. Ném chuông ra xa, tiếng bước chân rầm rộ sẽ dụ toàn bộ quỷ quái kéo ra góc đó tưởng có đoàn tiếp tế. Dương đông kích tây ở Dị sự cấp Ngân và Hoàng. Chuông kêu quá to có thể lôi kéo thêm các loại quỷ xa hơn mà bạn chưa phát hiện ra.', 99),
-- 80
('Bánh Bao Thịt Thối Ma Trêu', 'Vật phẩm tiêu hao', 1500, 'HUA_TIEN', 'Thường', '03 cái / tuần',
 'Bánh bao hấp nóng hổi nhưng nhân làm từ bùn ao và lá rơm nguyền rủa. Ngạ Quỷ nhìn thấy bánh bao sẽ lao vào giật lấy ăn ngấu nghiến, ăn xong bị dính ruột đứng nhăn nhó 1 phút. Dùng làm mồi nhử ở Dị sự cấp Thi và Ngân. Nếu người chơi lỡ tay ăn nhầm, bạn sẽ bị tiêu chảy liên tục trong dị sự, giảm 50% tốc độ di chuyển.', 99),
-- 81
('Bùn Trát Mặt Giả Tử Thi', 'Dị bảo hiếm', 35, 'AM_DUC', 'Hiếm', '02 hũ / tuần',
 'Hũ bùn đen vắt từ đáy mộ cổ ngàn năm, lạnh ngắt và bốc mùi tử khí. Trát bùn lên mặt, bạn sẽ có làn da tái nhợt và mùi hương y hệt một cái xác chết đã phân hủy 3 ngày. Thi quỷ sẽ bỏ qua bạn vì tưởng "đồng nghiệp". Trốn tránh trong ổ Cương thi ở Dị sự cấp Hoàng. Da mặt bị dị ứng nặng, giảm 20% lượng máu tối đa do bị ngấm tử khí qua da.', 99),
-- 82
('Chổi Rơm Quét Nợ', 'Vũ khí thường', 1500, 'CONG_DUC', 'Thường', '01 cây / người',
 'Cây chổi quét sân đình, thấm đẫm mồ hôi của các ông chủ đòi nợ thời cổ. Quét chổi tới đâu, quỷ quái bị xua đuổi như "quét rác" tới đó, vừa quét vừa hét "Trả tiền đây!" làm quỷ sợ hãi bỏ chạy. Dọn đường di chuyển ở Dị sự cấp Thi. Không có sát thương thực tế, chỉ có tác dụng xua đuổi. Nếu quỷ bị dồn vào đường cùng nó sẽ quay lại cắn nát cây chổi.', 99),
-- 83
('Kính Râm Rùa Đen', 'Pháp khí thường', 4000, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Kính mài từ mai rùa đen huyền bí, gọng gỗ đen bóng, ngầu đét bối cảnh cổ đại. Chống hoàn toàn các chiêu thức làm mù mắt bởi quỷ khí sáng chói hoặc ánh mắt mê hoặc của Tân Nương Quỷ. Hỗ trợ chiến đấu chống lại kỹ năng khống chế thị giác ở Dị sự cấp Hoàng. Đeo kính vào đêm tối làm bạn bị giảm 70% tầm nhìn thông thường, dễ vấp cục đá té ngửa.', 99),
-- 84
('Chăn Bông Bát Bảo (Trùm Đầu)', 'Pháp khí thường', 2000, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Chiếc chăn bông dày thêu phù văn, mang niềm tin vĩnh cửu của loài người: "Trùm chăn là ma không làm gì được". Trùm chăn kín đầu và nằm yên: Quỷ quái đi ngang qua sẽ hoàn toàn mất khả năng nhận diện bạn trong 30 giây (Quy luật tâm lý). Trốn kỹ khi Boss đi tuần ở Dị sự cấp Hoàng và Phỉ. Trong lúc trùm chăn bạn không được cử động hay thở mạnh; nếu thò một ngón chân ra ngoài chăn, bạn sẽ bị kéo đi ngay lập tức.', 99),
-- 85
('Bịt Mũi Bằng Bông Thánh', 'Vật phẩm tiêu hao', 800, 'HUA_TIEN', 'Thường', '05 bộ / tuần',
 'Cục bông gòn ngâm nước hoa hòe khô, nhét gọn vào hai lỗ mũi. Miễn nhiễm 100% với các đòn tấn công bằng mùi hôi, khí độc tâm linh hoặc chưởng mắm tôm từ đồng đội. Thám hiểm khu vực độc khí ở Dị sự cấp Ngân và Hoàng. Bạn phải thở bằng miệng, dẫn đến việc không thể giao tiếp bằng lời nói với đồng đội (chỉ có thể ra hiệu bằng tay).', 99),
-- 86
('Hòn Đất Trấn Mộc (Cú ném may mắn)', 'Vật phẩm tiêu hao', 15, 'AM_DUC', 'Thường', '10 cục / tuần',
 'Hòn đất sét đào từ góc đền hoang, mang chút linh khí tàn dư. Ném thẳng hòn đất vào mặt quỷ: 100% tỷ lệ ném trúng mắt quỷ, làm đứt đoạn chiêu thức đang niệm của chúng. Phá chiêu đối phương ở Dị sự cấp Thi và Ngân. Kích thích 200% độ phẫn nộ của quỷ, khiến mục tiêu bỏ qua tất cả người khác và lao vào đập một mình bạn.', 99),
-- 87
('Bài Bàn Cờ Ma Chước', 'Trấn vật cao cấp', 120, 'AM_DUC', 'Sự kiện', '01 bộ / tháng',
 'Bàn cờ vây bằng gỗ mục, chứa linh hồn của một kỳ thủ chết vì cay cú. Trải bàn cờ ra thách đấu: Cưỡng chế đại quỷ ngồi xuống đánh một ván cờ với bạn. Trong lúc đánh cờ, quỷ không thể tấn công. Câu giờ tối đa cho đồng đội làm nhiệm vụ ở Dị sự cấp Phỉ. Nếu bạn thua ván cờ (hoặc đi nước cờ ngu ngốc), quỷ sẽ tức giận xé xác bạn ngay tại chỗ.', 99);
