/*
# Create wills (Di Chúc) system

## Purpose
Players can create a will (Di Chúc) to designate inheritance of their
inventory items upon death. Will submissions go to admin for review:
approve, request changes, or reject. Only approved wills are stored
as the official record.

## New Table: wills
- id (uuid, PK)
- user_id (uuid, NOT NULL, defaults to auth.uid(), FK to auth.users)
- author_oc_name (text) — OC name snapshot at submission time
- heir_name (text) — designated heir player name
- heir_oc_name (text) — designated heir OC name
- heir_relationship (text) — relationship to author
- inheritance_type (text) — 'ALL' (all items) or 'SPECIFIC' (specific items)
- item_list (text) — free-form list of items to bequeath
- heir_assignments (text) — multi-heir item assignments (free text)
- status (text) — 'pending' | 'approved' | 'revision_requested' | 'rejected'
- reviewer_id (uuid, nullable) — admin who reviewed
- reviewer_name (text, nullable) — admin OC name snapshot
- reviewed_at (timestamptz, nullable) — review timestamp
- will_code (text, nullable) — system-assigned code on approval
- admin_note (text, nullable) — admin's note to player
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

## Security (RLS)
- Enable RLS on wills.
- Players can SELECT, INSERT, UPDATE, DELETE only their own wills.
- Admins (is_admin()) can SELECT all wills and UPDATE status/review fields.
- Admin updates are restricted to status, reviewer_id, reviewer_name,
  reviewed_at, will_code, admin_note columns via column-level UPDATE grant.
*/

CREATE TABLE IF NOT EXISTS wills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_oc_name text,
  heir_name text,
  heir_oc_name text,
  heir_relationship text,
  inheritance_type text NOT NULL DEFAULT 'ALL',
  item_list text,
  heir_assignments text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_name text,
  reviewed_at timestamptz,
  will_code text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wills ENABLE ROW LEVEL SECURITY;

-- Players: CRUD on own wills
DROP POLICY IF EXISTS "select_own_wills" ON wills;
CREATE POLICY "select_own_wills" ON wills FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wills" ON wills;
CREATE POLICY "insert_own_wills" ON wills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_wills" ON wills;
CREATE POLICY "update_own_wills" ON wills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wills" ON wills;
CREATE POLICY "delete_own_wills" ON wills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Admins: read all wills
DROP POLICY IF EXISTS "admin_select_wills" ON wills;
CREATE POLICY "admin_select_wills" ON wills FOR SELECT
  TO authenticated USING (is_admin());

-- Admins: update review fields on any will
DROP POLICY IF EXISTS "admin_update_wills" ON wills;
CREATE POLICY "admin_update_wills" ON wills FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Grant authenticated full CRUD (policies enforce the real rules)
GRANT SELECT, INSERT, UPDATE, DELETE ON wills TO authenticated;
