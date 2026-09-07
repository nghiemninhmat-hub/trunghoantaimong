/*
# Skill Templates Library (Nghiệp Thuật)

## Purpose
Create a reusable library of pre-defined skill templates that admins can
browse, create, edit, and delete. Admins can assign a template to any
player's character_skills slot, copying all fields into that player's record.

## New Table: `skill_templates`
- `id` (uuid, primary key)
- `name` (text, skill name)
- `usage_detail` (text, chi tiết cách sử dụng)
- `effect` (text, hiệu quả)
- `tradeoff` (text, đánh đổi)
- `cong_duc_cost` (int, tiêu hao công đức)
- `am_duc_cost` (int, tiêu hao âm đức)
- `duration` (text, thời gian duy trì)
- `mental_effect` (text, ảnh hưởng tinh thần)
- `mental_duration` (int, max 50)
- `health_effect` (text, ảnh hưởng sức khỏe)
- `health_duration` (int, max 50)
- `spiritual_effect` (text, ảnh hưởng tâm linh)
- `spiritual_duration` (int, max 50)
- `ghost_level_effect` (text, ảnh hưởng lên từng cấp quỷ)
- `destruction_percent` (int, 0-100)
- `category` (text, nullable — optional grouping label)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security
- RLS enabled
- Admin-only CRUD (is_admin() check)
- No anon access

## Notes
- Templates are independent of players — they serve as a master library
- Assigning a template copies all fields into the target player's character_skills row
*/

CREATE TABLE IF NOT EXISTS public.skill_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  usage_detail text DEFAULT '',
  effect text DEFAULT '',
  tradeoff text DEFAULT '',
  cong_duc_cost int NOT NULL DEFAULT 0,
  am_duc_cost int NOT NULL DEFAULT 0,
  duration text DEFAULT '',
  mental_effect text DEFAULT '',
  mental_duration int NOT NULL DEFAULT 0,
  health_effect text DEFAULT '',
  health_duration int NOT NULL DEFAULT 0,
  spiritual_effect text DEFAULT '',
  spiritual_duration int NOT NULL DEFAULT 0,
  ghost_level_effect text DEFAULT '',
  destruction_percent int NOT NULL DEFAULT 0,
  category text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_skill_templates" ON public.skill_templates;
CREATE POLICY "admin_select_skill_templates" ON public.skill_templates FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_skill_templates" ON public.skill_templates;
CREATE POLICY "admin_insert_skill_templates" ON public.skill_templates FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_skill_templates" ON public.skill_templates;
CREATE POLICY "admin_update_skill_templates" ON public.skill_templates FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_skill_templates" ON public.skill_templates;
CREATE POLICY "admin_delete_skill_templates" ON public.skill_templates FOR DELETE
  TO authenticated USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_templates TO authenticated;

CREATE INDEX IF NOT EXISTS idx_skill_templates_category ON public.skill_templates(category);
