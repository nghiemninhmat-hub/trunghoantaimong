/*
# Convert parent-level status values to sub-tag equivalents

Old system stored a single parent-level value (e.g. "Bình Thường", "Ảnh hưởng nhẹ").
New system uses comma-separated sub-tags (e.g. "Khỏe mạnh", "Bất an, Nóng nảy").

This migration converts existing parent-level values to their default sub-tag:
  Bình Thường → Khỏe mạnh
  Ảnh hưởng nhẹ → (leave as-is, admin will re-assign sub-tags)
  Nghiêm trọng → (leave as-is)
  Cực kỳ nghiêm trọng → (leave as-is)
  Suy kiệt → (leave as-is)
  Ngưỡng sinh tử → (leave as-is)

Only "Bình Thường" has a 1:1 mapping to a single sub-tag "Khỏe mạnh".
Other parent values are kept as-is so admins can re-assign specific sub-tags.
*/

UPDATE profiles
SET status_physical = 'Khỏe mạnh'
WHERE status_physical = 'Bình Thường';

UPDATE profiles
SET status_mental = 'Khỏe mạnh'
WHERE status_mental = 'Bình Thường';

UPDATE profiles
SET status_spiritual = 'Khỏe mạnh'
WHERE status_spiritual = 'Bình Thường';

-- Set default for NULL values
UPDATE profiles
SET status_physical = COALESCE(status_physical, 'Khỏe mạnh')
WHERE status_physical IS NULL;

UPDATE profiles
SET status_mental = COALESCE(status_mental, 'Khỏe mạnh')
WHERE status_mental IS NULL;

UPDATE profiles
SET status_spiritual = COALESCE(status_spiritual, 'Khỏe mạnh')
WHERE status_spiritual IS NULL;
