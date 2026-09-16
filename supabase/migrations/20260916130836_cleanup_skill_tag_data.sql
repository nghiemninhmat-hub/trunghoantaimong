/*
# Cleanup skill tag data in character_skills

1. Data fixes
- Replace "Hoa mắt, choáng váng" with "Hoa mắt choáng váng" in health_effect (the comma was causing parseMultiValue to split incorrectly)
- Remove surrounding double-quotes from tag values in mental_effect, health_effect, spiritual_effect
- Capitalize first letter of spiritual_effect values that were stored lowercase (e.g., "suy giảm khả năng phân biệt âm dương" → "Suy giảm khả năng phân biệt âm dương")
2. No schema changes
3. No security changes
*/

-- Fix the comma-in-tag issue: replace "Hoa mắt, choáng váng" with "Hoa mắt choáng váng"
UPDATE character_skills
SET health_effect = REPLACE(health_effect, 'Hoa mắt, choáng váng', 'Hoa mắt choáng váng')
WHERE health_effect ILIKE '%Hoa mắt, choáng váng%';

-- Remove surrounding double-quotes from tag values in all three effect columns
UPDATE character_skills
SET mental_effect = REGEXP_REPLACE(mental_effect, '"([^"]*)"', '\1', 'g')
WHERE mental_effect LIKE '%"%"%';

UPDATE character_skills
SET health_effect = REGEXP_REPLACE(health_effect, '"([^"]*)"', '\1', 'g')
WHERE health_effect LIKE '%"%"%';

UPDATE character_skills
SET spiritual_effect = REGEXP_REPLACE(spiritual_effect, '"([^"]*)"', '\1', 'g')
WHERE spiritual_effect LIKE '%"%"%';

-- Capitalize first letter of spiritual_effect values (fix lowercase entries)
UPDATE character_skills
SET spiritual_effect = (
  SELECT string_agg(
    CASE
      WHEN tag = '' THEN tag
      ELSE UPPER(LEFT(tag, 1)) || SUBSTRING(tag FROM 2)
    END,
    ', '
  )
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM character_skills cs2,
         LATERAL (SELECT cs2.spiritual_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE cs2.id = character_skills.id
  ) tags
)
WHERE spiritual_effect ~ '^[a-z]' OR spiritual_effect ~ ', [a-z]';

-- Capitalize first letter of mental_effect values (fix lowercase entries)
UPDATE character_skills
SET mental_effect = (
  SELECT string_agg(
    CASE
      WHEN tag = '' THEN tag
      ELSE UPPER(LEFT(tag, 1)) || SUBSTRING(tag FROM 2)
    END,
    ', '
  )
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM character_skills cs2,
         LATERAL (SELECT cs2.mental_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE cs2.id = character_skills.id
  ) tags
)
WHERE mental_effect ~ '^[a-z]' OR mental_effect ~ ', [a-z]';

-- Capitalize first letter of health_effect values (fix lowercase entries)
UPDATE character_skills
SET health_effect = (
  SELECT string_agg(
    CASE
      WHEN tag = '' THEN tag
      ELSE UPPER(LEFT(tag, 1)) || SUBSTRING(tag FROM 2)
    END,
    ', '
  )
  FROM (
    SELECT trim(split_part(v.tag_str, ',', idx.idx)) AS tag
    FROM character_skills cs2,
         LATERAL (SELECT cs2.health_effect AS tag_str) v,
         LATERAL generate_series(1, array_length(string_to_array(v.tag_str, ','), 1)) AS idx(idx)
    WHERE cs2.id = character_skills.id
  ) tags
)
WHERE health_effect ~ '^[a-z]' OR health_effect ~ ', [a-z]';
