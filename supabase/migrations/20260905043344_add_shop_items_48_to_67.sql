-- Insert shop items 48-67 into shop_items
-- Categories and areas mapped to existing conventions

INSERT INTO shop_items (name, category, price, currency_type, shop_area, purchase_limit, description, stock) VALUES
-- 48
('Trầm Hương Long Não', 'Vật phẩm tiêu hao', 850, 'CONG_DUC', 'Thường', '02 bánh / tuần',
 'Bánh trầm hương ép cùng tinh chất long não nghìn năm, khi đốt tỏa ra khói dày màu bạc tẩy uế không gian rộng. Thanh lọc toàn bộ khí ô uế và độc tố tâm linh trong bán kính 15m, ép Vô Diện Quỷ phải khựng lại. Hỗ trợ dọn dẹp môi trường ám khí nặng ở Dị sự cấp Ngân và Hoàng. Không thể sử dụng ở môi trường thoáng gió hoặc có mưa lớn.', 99),
-- 49
('Trụ Đá Ngũ Hành Trấn Địa', 'Trấn vật cao cấp', 2400, 'CONG_DUC', 'Hiếm', '01 bộ / tháng',
 'Bộ 5 cột đá cẩm thạch nhỏ khắc phù văn Ngũ Hành cân bằng địa khí, phong tỏa sự lan rộng của đại ma trận. Khóa chặt sự di chuyển địa hình của Sơn Quỷ, chặn đứng sự lan rộng của vùng máu chảy từ Huyết Quỷ trong 1 giờ. Phù hợp làm trận địa cố định trong Dị sự cấp Hoàng. Cần đặt đủ 5 trụ đúng 5 vị trí Kim-Mộc-Thủy-Hỏa-Thổ; sai lệch 1 góc trận pháp sẽ bị phá vỡ.', 99),
-- 50
('Roi Mây Niệm Chú', 'Vũ khí thường', 1800, 'CONG_DUC', 'Hiếm', '01 cây / người',
 'Roi được tết từ dây mây rừng ngâm nước thánh và niệm chú Trấn Sát trong 100 ngày. Đánh trúng sẽ làm suy yếu ngay lập tức 40% linh lực của quỷ thể, quật đứt sự khống chế của dây thừng treo cổ. Vũ khí cận chiến tầm trung cực tốt ở Dị sự cấp Ngân và Hoàng. Yêu cầu người chơi có thể lực tốt để vung roi liên tục.', 99),
-- 51
('Chuông Gió Ngũ Kim', 'Pháp khí thường', 1200, 'CONG_DUC', 'Hiếm', '01 bộ / người',
 'Bộ chuông gió đúc từ 5 loại kim loại quý, phát ra tần số âm thanh có khả năng bóc tách không gian ảo. Phát hiện sự xâm nhập không gian mơ hoặc kịch bản giả lập; tự động phát ra tiếng kêu cảnh báo khi quỷ tiến vào bán kính 10m. Cảnh báo sớm trong Dị sự cấp Ngân và Hoàng. Nếu bị bọc trong quỷ khí nồng độ cao quá 10 phút, chuông sẽ bị hoen rỉ và mất tác dụng.', 99),
-- 52
('Phù Lục Thái Sơn Trấn', 'Bùa chú cao cấp', 950, 'CONG_DUC', 'Hiếm', '02 lá / tháng',
 'Lá bùa lớn vẽ bằng mực chu sa trên vải lụa vàng, mang uy áp nặng như núi Thái Sơn. Đè nén quỷ thể khiến chúng chịu áp lực trọng lực cực lớn, giảm 70% tốc độ di chuyển trong 30 giây. Giúp kéo dài thời gian để hoàn thành điều kiện ở Dị sự cấp Hoàng. Chỉ dán được lên bề mặt phẳng cố định hoặc dán trực tiếp lên lưng quỷ.', 99),
-- 53
('Tẩu Thuốc Trầm Ngọc', 'Pháp khí thường', 1500, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Tẩu thuốc bằng bạch ngọc đắt giá, khi hút đốt cùng linh thảo sẽ phun ra làn khói bao bọc cơ thể. Tạo lớp màng khói cách ly người chơi khỏi sự ăn mòn của nước độc hoặc máu ma quỷ trong 15 phút. Rất có ích khi thám hiểm vùng nước hoặc Huyết Trì ở Dị sự cấp Ngân và Hoàng. Tiêu hao phổi và thể lực của người chơi khi hút liên tục.', 99),
-- 54
('Kính Bát Quái Đồng Đen', 'Pháp khí hiếm', 3200, 'CONG_DUC', 'Hiếm', '01 chiếc / người',
 'Phiên bản nâng cấp tối thượng của Gương Bát Quái, đúc hoàn toàn bằng đồng đen nguyên khối. Chiếu ra luồng Hắc Kim Quang phản đòn 50% sát thương quỷ khí cấp cao và cố định Hung Sát trong 5 giây. Vật phẩm phòng thủ chiến lược cho Dị sự cấp Hoàng và Phỉ. Thời gian hồi chiêu giữa các lần kích hoạt quang mang là 30 phút.', 99),
-- 55
('Huyết Lệnh Chiêu Hồn', 'Pháp khí truyền thuyết', 45, 'AM_DUC', 'Sự kiện', '01 chiếc / tháng',
 'Tấm lệnh bài bằng xương thú cổ đại khắc bằng máu tươi của quỷ cấp Hung Sát. Tạm thời cưỡng chế ra lệnh cho toán Binh Hồn cấp thấp quay sang tấn công quỷ chủ trong 3 phút. Vũ khí lật kèo nguy hiểm ở Dị sự cấp Hoàng và Phỉ. Sau khi hết 3 phút, toàn bộ Binh Hồn bị thao túng sẽ cuồng nộ tấn công ngược lại người sử dụng.', 99),
-- 56
('Tượng Quỷ Sai Trấn Môn', 'Trấn vật cao cấp', 60, 'AM_DUC', 'Sự kiện', '01 cặp / người',
 'Cặp tượng tạc hình Đầu Trâu Mặt Ngựa (Ngưu Đầu Mã Diện) mang uy áp của Địa Phủ. Đặt trước cửa ranh giới để ngăn hoàn toàn sự xâm nhập của bất kỳ đại quỷ nào dưới cấp Quỷ Tướng trong 4 giờ. Thiết lập căn cứ an toàn tuyệt đối ở Dị sự cấp Hoàng và Phỉ. Tượng sẽ tự vỡ nát nếu bị Quỷ Vương tấn công trực tiếp.', 99),
-- 57
('Hộp Gỗ Đào Phong Ma', 'Trấn vật phong ấn', 35, 'AM_DUC', 'Hiếm', '02 chiếc / tháng',
 'Hộp gỗ làm từ ruột cây đào nghìn năm, bên trong lót lụa quỷ ngâm máu ngọc tủy. Vật chứa duy nhất có khả năng thu nạp và giam giữ vĩnh viễn linh hồn hoặc vật ký sinh sau khi hoàn thành quy trình phong ấn. Bắt buộc phải có để hoàn thành Dị sự cấp Hoàng và Phỉ. Phải dán thêm bùa phong ấn bên ngoài mới đảm bảo quỷ không phá hộp chui ra.', 99),
-- 58
('Nhẫn Cốt Tủy Âm Vương', 'Dị bảo truyền thuyết', 80, 'AM_DUC', 'Sự kiện', '01 chiếc / toàn máy chủ',
 'Nhẫn tạc từ xương ngón tay của một Quỷ Vương cổ đại đã bị diệt trừ. Giúp người đeo hoàn toàn ẩn tàng sinh khí, biến bản thân thành "người chết" trong mắt quỷ quái. Công cụ trinh sát và sinh tồn tối thượng ở Dị sự cấp Phỉ. Tiêu hao tuổi thọ của người chơi mỗi khi kích hoạt trạng thái tàng hình (1 năm tuổi thọ / 10 phút).', 99),
-- 59
('Khai Tử Phù', 'Bùa chú cao cấp', 50, 'AM_DUC', 'Sự kiện', '01 lá / tháng',
 'Lá bùa đen tuyền khắc chữ đỏ, chứa đựng sát ý và quy luật cái chết của Hệ thống. Bỏ qua 80% phòng thủ âm khí, giáng một đòn sát thương trực tiếp vào điểm yếu cốt lõi của đại quỷ. Vũ khí dứt điểm ở Dị sự cấp Hoàng và Phỉ. Nếu đánh trượt, người chơi sẽ bị quỷ khí phản phệ gây thương tổn nặng.', 99),
-- 60
('Mão Quan Mộc Linh', 'Pháp khí thường', 5000, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Mũ đội đầu đan từ rễ cây đào ngàn năm, có khả năng bảo vệ vùng đầu và định thần cực mạnh. Phế bỏ hoàn toàn ảo giác tác động vào não bộ; giúp người chơi luôn giữ tỉnh táo trong giấc mơ ma quái. Khắc tinh ảo giác ở Dị sự cấp Ngân và Hoàng. Độ bền giảm dần khi chịu các đòn tấn công vật lý trực diện.', 99),
-- 61
('Khăn Trùm Cô Dâu Máu', 'Dị bảo hiếm', 7200, 'HUA_TIEN', 'Hiếm', '01 chiếc / tháng',
 'Tấm khăn che mặt đỏ thẫm nhuốm máu khô của một Tân Nương Quỷ cấp Quỷ Tướng. Giúp người trùm khăn hòa nhập vào đám cưới ma hoặc nghi thức Bách Quỷ Dạ Hành mà không bị phát hiện. Phục vụ khâu điều tra thâm nhập sâu vào Dị sự cấp Hoàng và Phỉ. Chỉ có tác dụng khi người chơi không phát ra tiếng động hoặc không có vết thương hở chảy máu.', 99),
-- 62
('Chuỗi Tràng Hạt Ngũ Cốt', 'Pháp khí hiếm', 4200, 'HUA_TIEN', 'Hiếm', '01 chuỗi / người',
 'Chuỗi 108 hạt được mài từ xương của 5 loài linh thú mang dương khí mạnh mẽ. Ném ra tạo thành vòng ma trận giam giữ quỷ quái bên trong; quỷ đụng vào hạt nào sẽ bị lửa dương thiêu bỏng hạt đó. Khống chế diện rộng ở Dị sự cấp Ngân và Hoàng. Cần nhặt lại đủ 108 hạt sau mỗi trận chiến để chuỗi hạt hồi phục linh tính.', 99),
-- 63
('Bàn Thờ Thổ Địa Bằng Đồng', 'Trấn vật cao cấp', 8500, 'HUA_TIEN', 'Hiếm', '01 bộ / người',
 'Bệ thờ nhỏ gọn đúc bằng đồng thau, chứa đựng năng lượng thổ địa chính thống. Cưỡng chế trục xuất Trạch Quỷ ra khỏi khu vực chiếm giữ; làm suy yếu 30% sức mạnh địa lợi của Sơn Quỷ. Thay đổi lợi thế địa hình ở Dị sự cấp Hoàng. Phải thắp đủ 3 nén hương chuẩn hệ thống thì bệ thờ mới phát huy tác dụng.', 99),
-- 64
('Tấm Giáp Binh Hồn Rách', 'Pháp khí thường', 6000, 'HUA_TIEN', 'Hiếm', '01 bộ / tháng',
 'Bộ giáp sắt rách nát thu thập từ các trận chiến xưa, chứa đậm sát khí chiến trường. Giảm 60% sát thương từ các loại vũ khí âm khí (đao, thương, xích) do quỷ binh gây ra. Món đồ sinh tồn cận chiến ở Dị sự cấp Ngân và Hoàng. Giảm 20% tốc độ di chuyển của người chơi do trọng lượng giáp khá nặng.', 99),
-- 65
('Bình Gốm Nước Mắt Mẹ', 'Vật phẩm đặc biệt', 9000, 'HUA_TIEN', 'Hiếm', '01 bình / tháng',
 'Bình gốm tích tụ nước mắt sám hối của hàng trăm người mẹ từng từ bỏ con mình. Tưới nước mắt lên quỷ thể sẽ làm tan rã 80% oán hận cuồng loạn, đưa quỷ rơi vào trạng thái ngừng tấn công và dễ bị độ hóa. Giải quyết cốt lõi Dị sự cấp Hoàng theo hướng hòa bình. Nước mắt sẽ mất tác dụng nếu bị dính máu hoặc ô uế từ vết thương của người chơi.', 99),
-- 66
('Bút Lông Lao Cực', 'Vật phẩm đặc biệt', 3800, 'HUA_TIEN', 'Hiếm', '01 chiếc / người',
 'Cây bút lông làm từ tóc của người chết giờ Tý và thân gỗ dâu tằm ma quái. Bổ trợ vẽ bùa chú nâng cao chống lại toàn bộ các loại quỷ. Tăng 100% hiệu lực cho tất cả các loại bùa chú vẽ bằng bút này; giảm 50% lượng chu sa tiêu hao. Dùng chế tạo trang bị cho Dị sự cấp Ngân, Hoàng, Phỉ. Cần người chơi có kỹ năng vẽ phù lục chuẩn xác mới kích hoạt được.', 99),
-- 67
('Chuông Nguyện Hồn Đen', 'Pháp khí truyền thuyết', 11000, 'HUA_TIEN', 'Sự kiện', '01 chiếc / sự kiện đặc biệt',
 'Chiếc chuông lắc tay bằng sắt đen không lưỡi, kêu lên bằng âm thanh rung động linh hồn. Khi lắc chuông, cưỡng chế tất cả quỷ quái trong bán kính 20m phải lộ diện thực thể và ngưng trệ mọi kỹ năng trong 3 giây. Công cụ khống chế quần thể tối thượng trong Dị sự cấp Phỉ. Mỗi lần sử dụng sẽ làm người chơi bị tụt 20% lượng máu tối đa hiện tại.', 99);
