/*
# Add Skill Approval Status

## Purpose
Add an approval workflow for individual character skills. Admins can approve or reject each skill independently during registration review.

## Modified Tables

### `character_skills`
- Add `skill_status` (text, NOT NULL DEFAULT 'pending')
  - Values: 'pending' (chưa duyệt), 'approved' (đã duyệt), 'rejected' (từ chối)
- Add `skill_reviewed_at` (timestamptz, nullable — when admin reviewed)
- Add `skill_reviewed_by` (uuid, nullable — which admin reviewed)

## Security
- No new policies needed; existing admin_all_skills policy already grants admins full CRUD on character_skills.
- Existing owner-scoped policies remain unchanged.
*/

ALTER TABLE public.character_skills
  ADD COLUMN IF NOT EXISTS skill_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.character_skills
  ADD COLUMN IF NOT EXISTS skill_reviewed_at timestamptz;

ALTER TABLE public.character_skills
  ADD COLUMN IF NOT EXISTS skill_reviewed_by uuid;

-- Backfill existing skills as pending
UPDATE public.character_skills SET skill_status = 'pending' WHERE skill_status IS NULL OR skill_status = '';
