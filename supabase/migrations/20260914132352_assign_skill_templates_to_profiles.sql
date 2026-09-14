/*
# Auto-assign skill templates to matching profiles by OC name

## Summary
Matches skill_templates to approved profiles by OC name (trimming trailing dots)
and inserts the template's full skill data into character_skills for each matched user.
Skips skills that the user already has (by name match, trimmed).
Slot assignment: existing skill count + sequential offset, capped at slot 4.

## Affected Tables
- `character_skills` — new rows inserted for matched profile/template pairs

## Matching Logic
1. Match profiles.oc_name to skill_templates.oc_name (case-sensitive, trim trailing dots)
2. Skip pairs where character_skills already has a row with the same trimmed name
3. Assign slot = existing skill count for that user + row_number offset
4. Only insert if target slot <= 4

## Notes
- Idempotent: re-running will skip already-assigned skills
- Does NOT modify or delete existing character_skills rows
- Copies all skill detail fields from the template to the character_skill
*/

WITH matched AS (
  SELECT 
    p.id as user_id,
    t.id as template_id,
    t.name as skill_name,
    t.usage_detail,
    t.effect,
    t.tradeoff,
    t.cong_duc_cost,
    t.am_duc_cost,
    t.duration,
    t.mental_effect,
    t.mental_duration,
    t.health_effect,
    t.health_duration,
    t.spiritual_effect,
    t.spiritual_duration,
    t.ghost_level_effect,
    t.destruction_percent
  FROM skill_templates t
  JOIN profiles p 
    ON regexp_replace(trim(p.oc_name), '\.+$', '') = regexp_replace(trim(t.oc_name), '\.+$', '')
  WHERE p.is_approved = true
    AND NOT EXISTS (
      SELECT 1 FROM character_skills cs 
      WHERE cs.user_id = p.id 
        AND trim(regexp_replace(cs.name, '\.+$', '')) = trim(regexp_replace(t.name, '\.+$', ''))
    )
),
existing_counts AS (
  SELECT user_id, count(*) as cnt 
  FROM character_skills 
  GROUP BY user_id
),
to_insert AS (
  SELECT 
    m.*,
    COALESCE(ec.cnt, 0) as existing_count,
    ROW_NUMBER() OVER (PARTITION BY m.user_id ORDER BY m.skill_name) as slot_offset
  FROM matched m
  LEFT JOIN existing_counts ec ON ec.user_id = m.user_id
),
final AS (
  SELECT 
    user_id,
    existing_count + slot_offset as target_slot,
    skill_name,
    usage_detail, effect, tradeoff,
    cong_duc_cost, am_duc_cost, duration,
    mental_effect, mental_duration,
    health_effect, health_duration,
    spiritual_effect, spiritual_duration,
    ghost_level_effect, destruction_percent
  FROM to_insert
  WHERE existing_count + slot_offset <= 4
)
INSERT INTO character_skills (
  user_id, slot, name,
  usage_detail, effect, tradeoff,
  cong_duc_cost, am_duc_cost, duration,
  mental_effect, mental_duration,
  health_effect, health_duration,
  spiritual_effect, spiritual_duration,
  ghost_level_effect, destruction_percent,
  skill_status
)
SELECT 
  user_id, target_slot, skill_name,
  usage_detail, effect, tradeoff,
  cong_duc_cost, am_duc_cost, duration,
  mental_effect, mental_duration,
  health_effect, health_duration,
  spiritual_effect, spiritual_duration,
  ghost_level_effect, destruction_percent,
  'approved'
FROM final;
