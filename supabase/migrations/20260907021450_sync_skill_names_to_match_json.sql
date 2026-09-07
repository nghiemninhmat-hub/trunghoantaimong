/*
# Sync skill_templates names to match source JSON file

1. Data Update
- 17 skill names in the database are missing trailing periods that exist in the source JSON file.
- This migration updates those 17 names to match the JSON exactly, ensuring full synchronization.
- No structural changes, no data loss — only name text corrections.
*/

UPDATE skill_templates SET name = 'Bùa Tăng Tốc.' WHERE name = 'Bùa Tăng Tốc' AND oc_name = 'Kiều Quỳnh Chỉ';
UPDATE skill_templates SET name = 'Bùa Ẩn Thân.' WHERE name = 'Bùa Ẩn Thân' AND oc_name = 'Kiều Quỳnh Chỉ';
UPDATE skill_templates SET name = 'Hỏa Phù.' WHERE name = 'Hỏa Phù' AND oc_name = 'Kiều Quỳnh Chỉ';
UPDATE skill_templates SET name = 'Lôi Phù.' WHERE name = 'Lôi Phù' AND oc_name = 'Kiều Quỳnh Chỉ';
UPDATE skill_templates SET name = 'Định Huyệt.' WHERE name = 'Định Huyệt' AND oc_name = 'Điển Phách Huân.';
UPDATE skill_templates SET name = 'Lập Trận.' WHERE name = 'Lập Trận' AND oc_name = 'Điển Phách Huân.';
UPDATE skill_templates SET name = 'Cửu Thiên Tru Tà Trận.' WHERE name = 'Cửu Thiên Tru Tà Trận' AND oc_name = 'Điển Phách Huân.';
UPDATE skill_templates SET name = 'Thái Thanh Tịnh Thế Trận.' WHERE name = 'Thái Thanh Tịnh Thế Trận' AND oc_name = 'Điển Phách Huân.';
UPDATE skill_templates SET name = 'Định Hồn Phạn.' WHERE name = 'Định Hồn Phạn' AND oc_name = 'Thục Hương Ngữ';
UPDATE skill_templates SET name = 'Tịch Tĩnh Giới.' WHERE name = 'Tịch Tĩnh Giới' AND oc_name = 'Thục Hương Ngữ';
UPDATE skill_templates SET name = 'Huyễn Âm Dẫn Hồn.' WHERE name = 'Huyễn Âm Dẫn Hồn' AND oc_name = 'Thục Hương Ngữ';
UPDATE skill_templates SET name = 'Hộ Giới Âm.' WHERE name = 'Hộ Giới Âm' AND oc_name = 'Thục Hương Ngữ';
UPDATE skill_templates SET name = 'Lập Trận.' WHERE name = 'Lập Trận' AND oc_name = 'Kỷ Huyền Sâm';
UPDATE skill_templates SET name = 'Lưu Quang Toái Ảnh - Thừa Ảnh Kiếm Pháp.' WHERE name = 'Lưu Quang Toái Ảnh - Thừa Ảnh Kiếm Pháp' AND oc_name = 'Thanh Trúc Kinh Giang';
UPDATE skill_templates SET name = 'Dẫn Lôi - Thừa Ảnh Kiếm Pháp.' WHERE name = 'Dẫn Lôi - Thừa Ảnh Kiếm Pháp' AND oc_name = 'Thanh Trúc Kinh Giang';
UPDATE skill_templates SET name = 'Nhất Kiếm Phá Vọng - Thừa Ảnh Kiếm Pháp.' WHERE name = 'Nhất Kiếm Phá Vọng - Thừa Ảnh Kiếm Pháp' AND oc_name = 'Thanh Trúc Kinh Giang';
UPDATE skill_templates SET name = 'Ảnh Hành Vô Tích - Thừa Ảnh Kiếm Pháp.' WHERE name = 'Ảnh Hành Vô Tích - Thừa Ảnh Kiếm Pháp' AND oc_name = 'Thanh Trúc Kinh Giang';
