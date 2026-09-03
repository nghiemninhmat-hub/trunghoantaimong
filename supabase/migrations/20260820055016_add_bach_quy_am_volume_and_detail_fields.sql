/*
# Add volume fields and detailed ghost attributes to bach_quy_am

1. Purpose
- Restructure the Bách Quỷ Âm bestiary to support 15 volumes (quyển) × 5 sub-entries each (75 total).
- Each ghost entry now has structured fields matching the new content format:
  Lời phán, Duyên sinh, Quỷ tính, Quỷ luật, Quỷ Vực, Tử huyệt, Phá pháp, Dị văn.
- The "Phá pháp" field will always show "Chưa cập nhật" — no lock/unlock system needed.

2. New Columns on bach_quy_am
- volume_number (int) — which quyển (1–15) this entry belongs to
- volume_name (text) — display name of the quyển (e.g. "TRẠM HỒN HỆ")
- volume_subtitle (text) — Chinese-style heading (e.g. "一 · TREO CỔ QUỶ")
- volume_tagline (text) — italic quote under the volume title
- volume_traits (text) — "Đặc tính chung" description
- volume_signs (text) — "Dấu hiệu xuất hiện" description
- volume_taboo (text) — "Quỷ Kỵ" description
- volume_vuc_name (text) — name of the volume's Quỷ Vực (e.g. "Thòng Lọng")
- volume_vuc_desc (text) — description of the volume's Quỷ Vực
- looi_phan (text) — "Lời phán" quote for this ghost
- duyen_sinh (text) — "Duyên sinh" origin
- quy_tinh (text) — "Quỷ tính" behavior
- quy_luat (text) — "Quỷ luật" rules
- quy_vuc (text) — "Quỷ Vực" for this ghost
- tu_huyet (text) — "Tử huyệt" weakness point
- pha_phap (text) — "Phá pháp" (always "Chưa cập nhật")
- di_van (text) — "Dị văn" anecdote

3. Modified Columns
- Drop is_unlocked and unlocked_at columns (no lock system).
- The old fields (weakness, appearance, behavior, destruction, sealing, brief_description,
  classification, danger_level, event_level) are kept for backward compatibility but the new
  structured fields take priority in the UI.

4. Security
- No RLS policy changes — existing anon read policy remains in place.
*/

ALTER TABLE bach_quy_am
  ADD COLUMN IF NOT EXISTS volume_number int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS volume_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS volume_subtitle text DEFAULT '',
  ADD COLUMN IF NOT EXISTS volume_tagline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS volume_traits text DEFAULT '',
  ADD COLUMN IF NOT EXISTS volume_signs text DEFAULT '',
  ADD COLUMN IF NOT EXISTS volume_taboo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS volume_vuc_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS volume_vuc_desc text DEFAULT '',
  ADD COLUMN IF NOT EXISTS looi_phan text DEFAULT '',
  ADD COLUMN IF NOT EXISTS duyen_sinh text DEFAULT '',
  ADD COLUMN IF NOT EXISTS quy_tinh text DEFAULT '',
  ADD COLUMN IF NOT EXISTS quy_luat text DEFAULT '',
  ADD COLUMN IF NOT EXISTS quy_vuc text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tu_huyet text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pha_phap text DEFAULT 'Chưa cập nhật',
  ADD COLUMN IF NOT EXISTS di_van text DEFAULT '';
