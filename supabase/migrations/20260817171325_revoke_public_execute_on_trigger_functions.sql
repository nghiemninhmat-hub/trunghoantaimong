/*
# Revoke PUBLIC execute on trigger-only and admin SECURITY DEFINER functions

## Summary
The previous migration revoked EXECUTE from `anon` and `authenticated`
individually, but PostgreSQL grants EXECUTE to the implicit `PUBLIC` role
by default, and `anon`/`authenticated` inherit that grant. The revokes
therefore had no effect. This migration revokes EXECUTE from PUBLIC on the
trigger-only notification functions and on log_admin_action, then re-grants
EXECUTE to `authenticated` ONLY for log_admin_action (which is a legitimate
admin RPC with an internal is_admin() guard).

## Changes

### Trigger-only functions — REVOKE FROM PUBLIC
These are invoked exclusively by database triggers and must never be called
via the RPC endpoint by any role:
- public.create_registration_notification
- public.create_post_notification
- public.create_message_notification
- public.create_friendship_notification
- public.create_friendship_accepted_notification

### log_admin_action — REVOKE FROM PUBLIC, re-grant to authenticated
This is a user-facing admin RPC. Revoke from PUBLIC (closes the anon hole),
then grant EXECUTE to authenticated only. The function's body already
returns early if is_admin() is false, so authenticated non-admins cannot
write audit entries.

## Security
- No table or RLS changes.
- No data modified.
- Idempotent: REVOKE is a no-op if already absent; GRANT is idempotent.
*/

-- Trigger-only notification functions: revoke all execute via PUBLIC
REVOKE EXECUTE ON FUNCTION public.create_registration_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_post_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_message_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_friendship_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_friendship_accepted_notification() FROM PUBLIC;

-- log_admin_action: close anon hole, keep authenticated
REVOKE EXECUTE ON FUNCTION public.log_admin_action(
  p_action text,
  p_target_user_id uuid,
  p_target_description text,
  p_details jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_action(
  p_action text,
  p_target_user_id uuid,
  p_target_description text,
  p_details jsonb
) TO authenticated;
