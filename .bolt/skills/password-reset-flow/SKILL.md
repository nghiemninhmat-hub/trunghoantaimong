---
name: password-reset-flow
description: Self-service password reset for players in Trùng Hoan Tái. Use when the user asks to add a "forgot password" feature, a password recovery flow, or any change to how players reset their own password without admin help. Also covers syncing passwords between profiles.password and auth.users.encrypted_password.
---

# Password Reset Flow

Players can reset their own password from the login page without admin intervention. Admins can still view and change any player's password from the admin dashboard.

## How it works

1. Login page has a "Quên mật Khẩu" link below the sign-in button.
2. Clicking it opens an inline form (not a separate page) where the player enters their email and a new password (min 6 chars).
3. The form calls a SECURITY DEFINER DB function `user_reset_own_password(p_email, p_new_password)` that:
   - Looks up the profile by email (case-insensitive, trimmed).
   - Updates `auth.users.encrypted_password` with a bcrypt hash (cost 10).
   - Updates `profiles.password` with the new plaintext (so admin dashboard stays in sync).
   - Saves to `password_history`.
   - Revokes all refresh tokens and deletes sessions for that user.
4. On success, the player is redirected to the login form with a success message.

## Why both profiles.password and auth.users stay in sync

The admin dashboard displays `profiles.password` (plaintext) so admins can see/share passwords. The login system uses `auth.users.encrypted_password` (bcrypt). Every password change — whether from admin, self-reset, or registration — must update BOTH tables. If they diverge, players can't log in with the password the admin sees.

## Admin dashboard

The admin dashboard already shows each player's password (with reveal toggle) and has an inline edit to change it. The edge function `admin-update-password` calls `admin_update_user_password(p_user_id, p_new_password, p_admin_id)` which updates both tables, revokes sessions, and saves history. No changes needed there — just ensure the self-reset function follows the same pattern.

## Security notes

- The self-reset function is callable by anon/authenticated (no login required) — this is intentional because the user forgot their password. The email itself acts as the verification factor.
- Rate limiting is handled by Supabase's built-in auth rate limits.
- Password history is always saved for audit trail.
