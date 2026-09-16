/*
# Fix green tag: "Tỉnh táo" → "Khỏe mạnh"

The tag at level "Bình Thường" (green) should be "Khỏe mạnh", not "Tỉnh táo".
This migration replaces "Tỉnh táo" with "Khỏe mạnh" in all effect columns
of both character_skills and skill_templates.
*/

UPDATE character_skills
SET mental_effect = REPLACE(mental_effect, 'Tỉnh táo', 'Khỏe mạnh')
WHERE mental_effect LIKE '%Tỉnh táo%';

UPDATE character_skills
SET health_effect = REPLACE(health_effect, 'Tỉnh táo', 'Khỏe mạnh')
WHERE health_effect LIKE '%Tỉnh táo%';

UPDATE character_skills
SET spiritual_effect = REPLACE(spiritual_effect, 'Tỉnh táo', 'Khỏe mạnh')
WHERE spiritual_effect LIKE '%Tỉnh táo%';

UPDATE skill_templates
SET mental_effect = REPLACE(mental_effect, 'Tỉnh táo', 'Khỏe mạnh')
WHERE mental_effect LIKE '%Tỉnh táo%';

UPDATE skill_templates
SET health_effect = REPLACE(health_effect, 'Tỉnh táo', 'Khỏe mạnh')
WHERE health_effect LIKE '%Tỉnh táo%';

UPDATE skill_templates
SET spiritual_effect = REPLACE(spiritual_effect, 'Tỉnh táo', 'Khỏe mạnh')
WHERE spiritual_effect LIKE '%Tỉnh táo%';
