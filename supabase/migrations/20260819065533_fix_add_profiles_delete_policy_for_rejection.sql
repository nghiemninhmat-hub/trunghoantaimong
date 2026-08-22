/*
# Fix: Add DELETE policy on profiles for admin account rejection

## Root Cause
The `rejectUser` function in the admin dashboard deletes a profile row to
reject a pending account. However, there was NO DELETE policy on the profiles
table — only SELECT, INSERT, and UPDATE policies existed. RLS blocks all
deletes when no DELETE policy exists, so moderators could not reject accounts.

## Changes
- Add profiles_admin_delete policy: only is_admin() can delete profile rows.
  This is used for rejecting pending registrations.
*/

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE
  TO authenticated USING (is_admin());