/*
# Character Skills System + Registration Review

## Purpose
Add a character skills system to the registration flow and admin review process.
Players fill out up to 4 skills during registration (multi-step wizard).
Admins can approve/reject/request-edit on registration profiles, with a feedback message.
Admins can also directly edit skills on any profile.

## New Tables

### `character_skills`
- `id` (uuid, primary key)
- `user_id` (uuid, FK to profiles, ON DELETE CASCADE)
- `slot` (int 1-4, which skill slot)
- `name` (text, skill name)
- `usage_detail` (text, chi tiết cách sử dụng)
- `effect` (text, hiệu quả)
- `tradeoff` (text, đánh đổi)
- `cong_duc_cost` (int, tiêu hao công đức)
- `am_duc_cost` (int, tiêu hao âm đức)
- `duration` (text, thời gian duy trì)
- `mental_effect` (text, ảnh hưởng tinh thần — tag name from MENTAL_TAGS)
- `mental_duration` (int, thời gian ảnh hưởng tinh thần, max 50)
- `health_effect` (text, ảnh hưởng sức khỏe — tag name from STATUS_TAGS)
- `health_duration` (int, thời gian ảnh hưởng sức khỏe, max 50)
- `spiritual_effect` (text, ảnh hưởng tâm linh — tag name from STATUS_TAGS)
- `spiritual_duration` (int, thời gian ảnh hưởng tâm linh, max 50)
- `ghost_level_effect` (text, ảnh hưởng lên từng cấp quỷ)
- `destruction_percent` (int, gây bao nhiêu % tiêu diệt, 0-100)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### `registration_reviews`
- `id` (uuid, primary key)
- `user_id` (uuid, FK to profiles, ON DELETE CASCADE)
- `admin_id` (uuid, admin who reviewed)
- `status` (text: 'approved' | 'rejected' | 'request_edit')
- `feedback` (text, admin feedback to player)
- `created_at` (timestamptz)

## Modified Tables

### `profiles`
- Add `review_status` (text, default 'pending' — tracks registration review state)
  - Values: 'pending' (chưa duyệt), 'approved' (đã duyệt), 'rejected' (từ chối), 'request_edit' (yêu cầu sửa)
- Add `review_feedback` (text, nullable — latest admin feedback message)

## Security
- RLS enabled on both new tables
- character_skills: owner-scoped SELECT/INSERT/UPDATE for authenticated users;
  admin gets full access via is_admin() check
- registration_reviews: only admin can INSERT/SELECT; users can SELECT their own
- All policies use auth.uid() for ownership, is_admin() for admin access

## Notes
- Mental status tags are stored as text values matching the tag definitions in the frontend
- Duration fields are integers (0-50) representing time units
- Destruction percent is 0-100
- The `review_status` column on profiles replaces the boolean `is_approved` for richer states,
  but `is_approved` is kept for backward compatibility (true when review_status='approved')
*/

-- Add review columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_feedback text;

-- Sync existing is_approved values to review_status
UPDATE public.profiles SET review_status = 'approved' WHERE is_approved = true AND review_status = 'pending';

-- Create character_skills table
CREATE TABLE IF NOT EXISTS public.character_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot int NOT NULL DEFAULT 1,
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.character_skills ENABLE ROW LEVEL SECURITY;

-- Policies: users can CRUD their own skills
DROP POLICY IF EXISTS "select_own_skills" ON public.character_skills;
CREATE POLICY "select_own_skills" ON public.character_skills FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_skills" ON public.character_skills;
CREATE POLICY "insert_own_skills" ON public.character_skills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_skills" ON public.character_skills;
CREATE POLICY "update_own_skills" ON public.character_skills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_skills" ON public.character_skills;
CREATE POLICY "delete_own_skills" ON public.character_skills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Admin policies: admins can manage all skills
DROP POLICY IF EXISTS "admin_all_skills" ON public.character_skills;
CREATE POLICY "admin_all_skills" ON public.character_skills FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Create registration_reviews table
CREATE TABLE IF NOT EXISTS public.registration_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id uuid,
  status text NOT NULL DEFAULT 'pending',
  feedback text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_reviews ENABLE ROW LEVEL SECURITY;

-- Users can read their own reviews
DROP POLICY IF EXISTS "select_own_reviews" ON public.registration_reviews;
CREATE POLICY "select_own_reviews" ON public.registration_reviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Admins can read and insert all reviews
DROP POLICY IF EXISTS "admin_select_reviews" ON public.registration_reviews;
CREATE POLICY "admin_select_reviews" ON public.registration_reviews FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_reviews" ON public.registration_reviews;
CREATE POLICY "admin_insert_reviews" ON public.registration_reviews FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_character_skills_user_id ON public.character_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_reviews_user_id ON public.registration_reviews(user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.character_skills TO authenticated;
GRANT SELECT, INSERT ON public.registration_reviews TO authenticated;
