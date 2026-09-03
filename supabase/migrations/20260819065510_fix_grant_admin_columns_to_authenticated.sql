/*
# Fix: Grant UPDATE on admin-controlled columns to authenticated role

## Root Cause
The `authenticated` role only had UPDATE column privileges on 4 columns:
anonymous_name, anonymous_name_changes, avatar_url, bio.

Admins need to update is_approved, approved_by, approved_at (approve accounts),
danh_vong (set titles), and status_physical/spiritual/mental (set character status)
via direct frontend table updates. The RLS policies (profiles_admin_update_all,
admin_update_status) correctly allow is_admin() to update these, but the
underlying GRANT was missing — so the update silently failed for moderators.

RLS is an additional filter on top of GRANTs. Both must allow the operation.
The RLS policies already enforce that only is_admin() can update these columns
on other users' rows, so granting UPDATE to authenticated is safe — non-admins
are still blocked by RLS from updating anyone else's row.

## Changes
- GRANT UPDATE (is_approved, approved_by, approved_at, danh_vong,
  status_physical, status_spiritual, status_mental) ON profiles TO authenticated
*/

GRANT UPDATE (is_approved, approved_by, approved_at, danh_vong, status_physical, status_spiritual, status_mental) ON public.profiles TO authenticated;