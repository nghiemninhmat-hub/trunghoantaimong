/*
# Add Chức Nghiệp Level (Profession Level) to Profiles

1. New Columns
- `profiles.chuc_nghiep_level` (integer, NOT NULL, default 1)
  - Represents the profession level of each player.
  - All accounts start at level 1.
  - No maximum — admins can raise or lower it freely.
  - Only admins can change this value; players see it read-only.

2. Backfill
- All existing profiles get `chuc_nghiep_level = 1`.

3. Security
- No new RLS policies needed — the column is read via existing profile SELECT policies.
- Updates are done through admin-only RPC / direct update by admin role.
- Grant UPDATE on `chuc_nghiep_level` to `authenticated` is NOT needed since only admins (service role / existing admin policies) change it.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS chuc_nghiep_level integer NOT NULL DEFAULT 1;

-- Backfill: ensure all existing rows have level 1
UPDATE profiles SET chuc_nghiep_level = 1 WHERE chuc_nghiep_level IS NULL;
