-- Add account and oc_name columns to skill_templates for linking skills to specific players
ALTER TABLE skill_templates
  ADD COLUMN IF NOT EXISTS account text DEFAULT '',
  ADD COLUMN IF NOT EXISTS oc_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS nghe text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phe_duyet text DEFAULT '';

-- Grant admin access (is_admin check already exists via RLS policies on this table)
-- authenticated role can read skill_templates (already has SELECT policy)
