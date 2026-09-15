/*
# Add foreign key from bach_hoa_votes to profiles

1. Problem
- The `bach_hoa_votes` table has a `user_id` column but no foreign key constraint
  to `profiles(id)`. Without the FK, PostgREST cannot resolve the nested select
  `profiles(oc_name, anonymous_name)` in the admin dashboard query, so the voter
  list returns an error and appears empty.

2. Changes
- Add FK constraint `bach_hoa_votes_user_id_fkey` referencing `profiles(id)`
  with `ON DELETE CASCADE` (matching the `entry_id` FK behavior).

3. Security
- No RLS or policy changes. The existing `bach_hoa_votes_select_admin` policy
  (admin-only SELECT) remains in effect.
*/

-- Add the foreign key constraint if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bach_hoa_votes_user_id_fkey'
    AND conrelid = 'public.bach_hoa_votes'::regclass
  ) THEN
    ALTER TABLE public.bach_hoa_votes
      ADD CONSTRAINT bach_hoa_votes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
