/*
# Unify all 3 effect columns to use MENTAL_SUB_TAGS only

All 3 columns (mental_effect, health_effect, spiritual_effect) now share the same
tag list (MENTAL_SUB_TAGS). This migration:

1. Fixes spelling: "Nhạy cảm giác quan" → "Nhạy cảm với các giác quan",
   "Tâm trí hoen ố" → "Tâm trí có dấu hiệu hoen ố"
2. Removes parent-level tag values (Bình Thường, Ảnh hưởng nhẹ, Nghiêm trọng,
   Cực kỳ nghiêm trọng, Suy kiệt, Ngưỡng sinh tử) from effect columns — these are
   category names, not selectable sub-tags
3. Removes tags that were health-specific or spiritual-specific (no longer valid)
   from health_effect and spiritual_effect columns
4. Applies to both character_skills and skill_templates tables
5. Also fixes "Hoa mắt, choáng váng" (with comma) in skill_templates and removes quotes
*/

-- Helper: the set of valid sub-tags (MENTAL_SUB_TAGS values)
-- We use a CTE to define the valid tags, then filter each column.

-- Step 1: Fix spelling in character_skills
UPDATE character_skills
SET mental_effect = REPLACE(mental_effect, 'Nhạy cảm giác quan', 'Nhạy cảm với các giác quan')
WHERE mental_effect LIKE '%Nhạy cảm giác quan%';

UPDATE character_skills
SET mental_effect = REPLACE(mental_effect, 'Tâm trí hoen ố', 'Tâm trí có dấu hiệu hoen ố')
WHERE mental_effect LIKE '%Tâm trí hoen ố%' AND mental_effect NOT LIKE '%Tâm trí hoen ố nặng%';

-- Step 2: Fix spelling in skill_templates
UPDATE skill_templates
SET mental_effect = REPLACE(mental_effect, 'Nhạy cảm giác quan', 'Nhạy cảm với các giác quan')
WHERE mental_effect LIKE '%Nhạy cảm giác quan%';

UPDATE skill_templates
SET mental_effect = REPLACE(mental_effect, 'Tâm trí hoen ố', 'Tâm trí có dấu hiệu hoen ố')
WHERE mental_effect LIKE '%Tâm trí hoen ố%' AND mental_effect NOT LIKE '%Tâm trí hoen ố nặng%';

-- Step 3: Fix "Hoa mắt, choáng váng" and quotes in skill_templates
UPDATE skill_templates
SET health_effect = REPLACE(health_effect, 'Hoa mắt, choáng váng', 'Hoa mắt choáng váng')
WHERE health_effect ILIKE '%Hoa mắt, choáng váng%';

UPDATE skill_templates
SET health_effect = REGEXP_REPLACE(health_effect, '"([^"]*)"', '\1', 'g')
WHERE health_effect LIKE '%"%"%';

UPDATE skill_templates
SET mental_effect = REGEXP_REPLACE(mental_effect, '"([^"]*)"', '\1', 'g')
WHERE mental_effect LIKE '%"%"%';

UPDATE skill_templates
SET spiritual_effect = REGEXP_REPLACE(spiritual_effect, '"([^"]*)"', '\1', 'g')
WHERE spiritual_effect LIKE '%"%"%';

-- Capitalize lowercase first letters in skill_templates spiritual_effect
UPDATE skill_templates
SET spiritual_effect = (
  SELECT string_agg(
    CASE WHEN tag = '' THEN tag ELSE UPPER(LEFT(tag, 1)) || SUBSTRING(tag FROM 2) END,
    ', '
  )
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM skill_templates st2,
         LATERAL (SELECT st2.spiritual_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE st2.id = skill_templates.id
  ) tags
)
WHERE spiritual_effect ~ '^[a-z]' OR spiritual_effect ~ ', [a-z]';

-- Step 4: Remove parent-level values and invalid tags from all 3 effect columns
-- in character_skills. We keep only values that match MENTAL_SUB_TAGS.

-- Define valid tags as a set
-- Valid sub-tags: Tỉnh táo, Bất an, Nóng nảy, Mơ hồ, Không thể tập trung, Căng thẳng,
-- Thất thần, Nhạy cảm với các giác quan, Rối trí, Lãnh cảm, Quá tải giác quan, Suy sụp,
-- Hoảng loạn, Ám ảnh, Mê man, Mộng du, Tâm trí có dấu hiệu hoen ố, Ảo giác,
-- Thần trí lúc tỉnh lúc mê, Kinh hãi, Ký ức hỗn loạn, Tâm trí hoen ố nặng,
-- Mất lòng tin, Kiệt quệ, Mất phương hướng, Vô cảm, Mất ý thức, Hoang tưởng,
-- Rối loạn nhận thức, Tinh thần tan rã, Cuồng loạn

-- Process mental_effect in character_skills
UPDATE character_skills
SET mental_effect = (
  SELECT string_agg(tag, ', ')
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM character_skills cs2,
         LATERAL (SELECT cs2.mental_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE cs2.id = character_skills.id
  ) tags
  WHERE tag IN (
    'Tỉnh táo', 'Bất an', 'Nóng nảy', 'Mơ hồ', 'Không thể tập trung', 'Căng thẳng',
    'Thất thần', 'Nhạy cảm với các giác quan', 'Rối trí', 'Lãnh cảm', 'Quá tải giác quan',
    'Suy sụp', 'Hoảng loạn', 'Ám ảnh', 'Mê man', 'Mộng du', 'Tâm trí có dấu hiệu hoen ố',
    'Ảo giác', 'Thần trí lúc tỉnh lúc mê', 'Kinh hãi', 'Ký ức hỗn loạn', 'Tâm trí hoen ố nặng',
    'Mất lòng tin', 'Kiệt quệ', 'Mất phương hướng', 'Vô cảm',
    'Mất ý thức', 'Hoang tưởng', 'Rối loạn nhận thức', 'Tinh thần tan rã', 'Cuồng loạn'
  )
)
WHERE mental_effect IS NOT NULL AND mental_effect != '';

-- Process health_effect in character_skills
UPDATE character_skills
SET health_effect = (
  SELECT string_agg(tag, ', ')
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM character_skills cs2,
         LATERAL (SELECT cs2.health_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE cs2.id = character_skills.id
  ) tags
  WHERE tag IN (
    'Tỉnh táo', 'Bất an', 'Nóng nảy', 'Mơ hồ', 'Không thể tập trung', 'Căng thẳng',
    'Thất thần', 'Nhạy cảm với các giác quan', 'Rối trí', 'Lãnh cảm', 'Quá tải giác quan',
    'Suy sụp', 'Hoảng loạn', 'Ám ảnh', 'Mê man', 'Mộng du', 'Tâm trí có dấu hiệu hoen ố',
    'Ảo giác', 'Thần trí lúc tỉnh lúc mê', 'Kinh hãi', 'Ký ức hỗn loạn', 'Tâm trí hoen ố nặng',
    'Mất lòng tin', 'Kiệt quệ', 'Mất phương hướng', 'Vô cảm',
    'Mất ý thức', 'Hoang tưởng', 'Rối loạn nhận thức', 'Tinh thần tan rã', 'Cuồng loạn'
  )
)
WHERE health_effect IS NOT NULL AND health_effect != '';

-- Process spiritual_effect in character_skills
UPDATE character_skills
SET spiritual_effect = (
  SELECT string_agg(tag, ', ')
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM character_skills cs2,
         LATERAL (SELECT cs2.spiritual_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE cs2.id = character_skills.id
  ) tags
  WHERE tag IN (
    'Tỉnh táo', 'Bất an', 'Nóng nảy', 'Mơ hồ', 'Không thể tập trung', 'Căng thẳng',
    'Thất thần', 'Nhạy cảm với các giác quan', 'Rối trí', 'Lãnh cảm', 'Quá tải giác quan',
    'Suy sụp', 'Hoảng loạn', 'Ám ảnh', 'Mê man', 'Mộng du', 'Tâm trí có dấu hiệu hoen ố',
    'Ảo giác', 'Thần trí lúc tỉnh lúc mê', 'Kinh hãi', 'Ký ức hỗn loạn', 'Tâm trí hoen ố nặng',
    'Mất lòng tin', 'Kiệt quệ', 'Mất phương hướng', 'Vô cảm',
    'Mất ý thức', 'Hoang tưởng', 'Rối loạn nhận thức', 'Tinh thần tan rã', 'Cuồng loạn'
  )
)
WHERE spiritual_effect IS NOT NULL AND spiritual_effect != '';

-- Process mental_effect in skill_templates
UPDATE skill_templates
SET mental_effect = (
  SELECT string_agg(tag, ', ')
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM skill_templates st2,
         LATERAL (SELECT st2.mental_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE st2.id = skill_templates.id
  ) tags
  WHERE tag IN (
    'Tỉnh táo', 'Bất an', 'Nóng nảy', 'Mơ hồ', 'Không thể tập trung', 'Căng thẳng',
    'Thất thần', 'Nhạy cảm với các giác quan', 'Rối trí', 'Lãnh cảm', 'Quá tải giác quan',
    'Suy sụp', 'Hoảng loạn', 'Ám ảnh', 'Mê man', 'Mộng du', 'Tâm trí có dấu hiệu hoen ố',
    'Ảo giác', 'Thần trí lúc tỉnh lúc mê', 'Kinh hãi', 'Ký ức hỗn loạn', 'Tâm trí hoen ố nặng',
    'Mất lòng tin', 'Kiệt quệ', 'Mất phương hướng', 'Vô cảm',
    'Mất ý thức', 'Hoang tưởng', 'Rối loạn nhận thức', 'Tinh thần tan rã', 'Cuồng loạn'
  )
)
WHERE mental_effect IS NOT NULL AND mental_effect != '';

-- Process health_effect in skill_templates
UPDATE skill_templates
SET health_effect = (
  SELECT string_agg(tag, ', ')
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM skill_templates st2,
         LATERAL (SELECT st2.health_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE st2.id = skill_templates.id
  ) tags
  WHERE tag IN (
    'Tỉnh táo', 'Bất an', 'Nóng nảy', 'Mơ hồ', 'Không thể tập trung', 'Căng thẳng',
    'Thất thần', 'Nhạy cảm với các giác quan', 'Rối trí', 'Lãnh cảm', 'Quá tải giác quan',
    'Suy sụp', 'Hoảng loạn', 'Ám ảnh', 'Mê man', 'Mộng du', 'Tâm trí có dấu hiệu hoen ố',
    'Ảo giác', 'Thần trí lúc tỉnh lúc mê', 'Kinh hãi', 'Ký ức hỗn loạn', 'Tâm trí hoen ố nặng',
    'Mất lòng tin', 'Kiệt quệ', 'Mất phương hướng', 'Vô cảm',
    'Mất ý thức', 'Hoang tưởng', 'Rối loạn nhận thức', 'Tinh thần tan rã', 'Cuồng loạn'
  )
)
WHERE health_effect IS NOT NULL AND health_effect != '';

-- Process spiritual_effect in skill_templates
UPDATE skill_templates
SET spiritual_effect = (
  SELECT string_agg(tag, ', ')
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM skill_templates st2,
         LATERAL (SELECT st2.spiritual_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE st2.id = skill_templates.id
  ) tags
  WHERE tag IN (
    'Tỉnh táo', 'Bất an', 'Nóng nảy', 'Mơ hồ', 'Không thể tập trung', 'Căng thẳng',
    'Thất thần', 'Nhạy cảm với các giác quan', 'Rối trí', 'Lãnh cảm', 'Quá tải giác quan',
    'Suy sụp', 'Hoảng loạn', 'Ám ảnh', 'Mê man', 'Mộng du', 'Tâm trí có dấu hiệu hoen ố',
    'Ảo giác', 'Thần trí lúc tỉnh lúc mê', 'Kinh hãi', 'Ký ức hỗn loạn', 'Tâm trí hoen ố nặng',
    'Mất lòng tin', 'Kiệt quệ', 'Mất phương hướng', 'Vô cảm',
    'Mất ý thức', 'Hoang tưởng', 'Rối loạn nhận thức', 'Tinh thần tan rã', 'Cuồng loạn'
  )
)
WHERE spiritual_effect IS NOT NULL AND spiritual_effect != '';
