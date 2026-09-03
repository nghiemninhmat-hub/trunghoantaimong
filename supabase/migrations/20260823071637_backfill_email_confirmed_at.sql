-- Backfill: Set email_confirmed_at for all existing auth.users that don't have it
-- This fixes login for all existing accounts that were created without email confirmation
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
updated_at = now()
WHERE email_confirmed_at IS NULL;