/*
# Allow visitors to read displayed titles

## Problem
The `user_titles` table only had a SELECT policy allowing `auth.uid() = user_id OR is_admin()`.
This meant visitors could not see other players' displayed titles on their profile cards.

## Changes
- Adds a new SELECT policy `select_displayed_user_titles` allowing any authenticated user
  to read rows where `is_displayed = true`.
- The existing `select_own_user_titles` policy remains, so users can still read all their
  own titles (displayed or not) for the title management UI.

## Security
- Only displayed titles are exposed to other users — hidden titles remain private.
- INSERT/UPDATE/DELETE policies are unchanged (owner-only).
*/

DROP POLICY IF EXISTS "select_displayed_user_titles" ON user_titles;

CREATE POLICY "select_displayed_user_titles"
ON user_titles FOR SELECT
TO authenticated
USING (is_displayed = true);
