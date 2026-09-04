/*
# Create Organizations System

1. New Tables
- `organizations` — stores organization info (name, category, leader reference)
  - id (uuid PK), name (text unique), category (text), leader_id (uuid FK profiles), description (text), timestamps
- `organization_members` — links players to organizations
  - id (uuid PK), organization_id (uuid FK CASCADE), user_id (uuid FK CASCADE), role (text), created_at
  - UNIQUE(organization_id, user_id)

2. Security
- RLS on both tables. Public read, admin-only write via is_admin().
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'Tổ Chức',
  leader_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_public_read" ON organizations;
CREATE POLICY "org_public_read" ON organizations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "org_admin_insert" ON organizations;
CREATE POLICY "org_admin_insert" ON organizations FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "org_admin_update" ON organizations;
CREATE POLICY "org_admin_update" ON organizations FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "org_admin_delete" ON organizations;
CREATE POLICY "org_admin_delete" ON organizations FOR DELETE
  TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Thành viên',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_mem_public_read" ON organization_members;
CREATE POLICY "org_mem_public_read" ON organization_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "org_mem_admin_insert" ON organization_members;
CREATE POLICY "org_mem_admin_insert" ON organization_members FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "org_mem_admin_update" ON organization_members;
CREATE POLICY "org_mem_admin_update" ON organization_members FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "org_mem_admin_delete" ON organization_members;
CREATE POLICY "org_mem_admin_delete" ON organization_members FOR DELETE
  TO authenticated USING (is_admin());
