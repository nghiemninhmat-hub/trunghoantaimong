/*
# Allow all authenticated players to view wheel spin history

## Purpose
Previously `wheel_spin_log` could only be read by admins or the spin owner.
We now want every logged-in player to see the full spin history board
(showing which OC name spun and what reward they got), so we add a
SELECT policy for all authenticated users.

## Changes
- New RLS policy `wheel_spin_log_auth_select` on `wheel_spin_log`:
  allows any authenticated user to SELECT all rows.
- Existing admin and owner policies remain unchanged.
*/

DROP POLICY IF EXISTS "wheel_spin_log_auth_select" ON wheel_spin_log;
CREATE POLICY "wheel_spin_log_auth_select"
  ON wheel_spin_log FOR SELECT
  TO authenticated USING (true);
