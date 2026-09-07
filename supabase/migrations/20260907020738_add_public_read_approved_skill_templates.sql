/*
# Add public read policy for approved skill templates

1. Security Changes
- Add a SELECT policy on `skill_templates` allowing all users (anon + authenticated)
  to read only approved skill templates (phe_duyet = 'Đã duyệt').
- Admins already have full CRUD via existing is_admin policies.
- This lets the NghiepThuat page display approved skills to all visitors,
  while unapproved skills remain admin-only.
*/

DROP POLICY IF EXISTS "public_read_approved_skill_templates" ON skill_templates;

CREATE POLICY "public_read_approved_skill_templates"
ON skill_templates FOR SELECT
TO anon, authenticated
USING (phe_duyet = 'Đã duyệt');
