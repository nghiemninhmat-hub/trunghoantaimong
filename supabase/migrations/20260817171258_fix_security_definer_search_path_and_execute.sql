/*
# Fix SECURITY DEFINER function security issues

## Summary
Fixes two classes of security findings reported by the database linter:
1. Mutable search_path on SECURITY DEFINER functions.
2. EXECUTE privilege granted to `anon` (and `authenticated`) on trigger-only
   SECURITY DEFINER functions that should never be called via RPC.

## Changes

### Trigger functions — set search_path + revoke EXECUTE
These functions have no arguments and are invoked exclusively by database
triggers. They must NOT be callable via the PostgREST RPC endpoint by any
role. We also pin `search_path = public` so a hostile role cannot hijack
unqualified table references.

Functions:
- public.create_registration_notification  (trigger: on_profile_insert)
- public.create_post_notification           (trigger: on_post_insert)
- public.create_message_notification        (trigger: on_message_insert)
- public.create_friendship_notification     (trigger: on_friendship_insert)
- public.create_friendship_accepted_notification (trigger: on_friendship_update)

For each: ALTER FUNCTION ... SET search_path = public, then
REVOKE EXECUTE ON FUNCTION ... FROM anon, authenticated.

### log_admin_action — set search_path + revoke from anon
This is a user-facing admin RPC (called from AdminDashboard). It already has
an internal `is_admin()` guard, so authenticated execution is intentional.
However `anon` must not be able to call it, and its search_path must be
pinned. We REVOKE EXECUTE FROM anon and ALTER ... SET search_path = public.

### User-facing RPCs — pin search_path (no execute change)
These are intentionally callable by `authenticated` users and contain their
own authorization checks, so we only pin the search_path where missing:
- admin_adjust_currency   (already has search_path)
- admin_grant_spins       (already has search_path)
- is_admin                (already has search_path)
- purchase_items          (already has search_path)
- self_adjust_currency    (already has search_path)
- spin_wheel              (already has search_path)
- transfer_hua_tien       (already has search_path)
None of these need changes; they already have search_path set.

## Security
- No table changes, no RLS policy changes.
- No data is modified or lost.
- All changes are idempotent (REVOKE is a no-op if the privilege is absent;
  ALTER FUNCTION SET search_path is safe to repeat).
*/

-- ---------------------------------------------------------------------------
-- Trigger-only notification functions: pin search_path + revoke all EXECUTE
-- ---------------------------------------------------------------------------

ALTER FUNCTION public.create_registration_notification()
  SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.create_registration_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_registration_notification() FROM authenticated;

ALTER FUNCTION public.create_post_notification()
  SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.create_post_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_post_notification() FROM authenticated;

ALTER FUNCTION public.create_message_notification()
  SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.create_message_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_message_notification() FROM authenticated;

ALTER FUNCTION public.create_friendship_notification()
  SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.create_friendship_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_friendship_notification() FROM authenticated;

ALTER FUNCTION public.create_friendship_accepted_notification()
  SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.create_friendship_accepted_notification() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_friendship_accepted_notification() FROM authenticated;

-- ---------------------------------------------------------------------------
-- log_admin_action: pin search_path + revoke from anon (keep authenticated)
-- ---------------------------------------------------------------------------

ALTER FUNCTION public.log_admin_action(
  p_action text,
  p_target_user_id uuid,
  p_target_description text,
  p_details jsonb
) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(
  p_action text,
  p_target_user_id uuid,
  p_target_description text,
  p_details jsonb
) FROM anon;
