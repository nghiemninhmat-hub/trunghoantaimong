-- Revoke public read access to skill templates
-- Only admins should see the full list of registered skills (player privacy)

DROP POLICY IF EXISTS "public_read_approved_skill_templates" ON skill_templates;
