/*
# Revoke public read access to wheel_spin_log

## Purpose
The previous migration `add_wheel_spin_log_public_read` allowed all
authenticated users to read the full spin history. The spin log should
only be visible to admins (who already had access). This drops the
broad policy and restores the original admin-only + owner-only visibility.

## Changes
- Drop policy `wheel_spin_log_auth_select` from `wheel_spin_log`.
- Existing policies `wheel_spin_log_admin_select` and
  `wheel_spin_log_select_own` remain unchanged.
*/

DROP POLICY IF EXISTS "wheel_spin_log_auth_select" ON wheel_spin_log;
