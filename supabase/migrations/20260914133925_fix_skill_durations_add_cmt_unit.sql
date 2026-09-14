/*
# Fix skill duration values: add "cmt" unit to bare numeric durations

## Summary
The `duration` field in `skill_templates` and `character_skills` contains bare numeric values
(e.g. "1.0", "2.0", "3.0") that represent turns in cmt (chuỗi mười / 10-minute turns).
This migration appends "cmt" to those bare numeric values so the display is clear.

Also fixes the erroneous "46082.0" duration value for Tỏa Khí skill, which was a data entry
error from the original spreadsheet. The correct duration is "1 - 3 cmt" based on the skill
description (3 cmts with Du hồn, 2 cmts with Oán hồn, 1 cmt with Lệ quỷ).

## Affected Tables
- `skill_templates` — update duration field for bare numeric values
- `character_skills` — update duration field for bare numeric values

## Notes
- Only updates rows where duration matches a bare numeric pattern (e.g. "1.0", "2.0", "3.0")
- Does NOT touch rows where duration already contains text like "cmt", "dị sự", "ngày", etc.
- The "46082.0" value is replaced with "1 - 3 cmt"
- Idempotent: re-running won't affect rows that already have "cmt" in the duration
*/

-- Fix the erroneous 46082.0 value first
UPDATE skill_templates 
SET duration = '1 - 3 cmt' 
WHERE duration = '46082.0';

UPDATE character_skills 
SET duration = '1 - 3 cmt' 
WHERE duration = '46082.0';

-- Append "cmt" to bare numeric durations in skill_templates
-- Matches patterns like "1.0", "2.0", "3.0", "4.0" but NOT "1 - 3" or "4 cmt."
UPDATE skill_templates
SET duration = regexp_replace(duration, '^([0-9]+)\.0$', '\1 cmt')
WHERE duration ~ '^[0-9]+\.0$';

-- Append "cmt" to bare numeric durations in character_skills
UPDATE character_skills
SET duration = regexp_replace(duration, '^([0-9]+)\.0$', '\1 cmt')
WHERE duration ~ '^[0-9]+\.0$';

-- Also handle bare integers without .0 (like "4")
UPDATE skill_templates
SET duration = duration || ' cmt'
WHERE duration ~ '^[0-9]+$'
  AND duration NOT LIKE '%cmt%';

UPDATE character_skills
SET duration = duration || ' cmt'
WHERE duration ~ '^[0-9]+$'
  AND duration NOT LIKE '%cmt%';
