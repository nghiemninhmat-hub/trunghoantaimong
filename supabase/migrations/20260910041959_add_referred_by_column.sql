/*
# Add referred_by column to profiles

1. Modified Tables
   - `profiles`: add `referred_by` (text, nullable) — stores the OC name of the person who referred this player during registration.
2. Security
   - No RLS policy changes needed; existing profile policies already cover the new column.
3. Notes
   - The column is optional (nullable) so existing profiles are unaffected.
   - The value is a free-text OC name entered by the registering player; admins see it in the pending-approval list.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by text;
