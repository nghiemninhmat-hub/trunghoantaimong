/*
# Sync BAN QUẢN LÝ moderator into is_admin()

1. Changes to is_admin()
- Add 'vinhtongthuong@gmail.com' to the admin email allowlist inside is_admin().
- The frontend ADMIN_EMAILS array already includes this email, but the database
  function was missing it, so this moderator could see the admin dashboard UI
  but was blocked by RLS when trying to approve members or update profiles.
- This brings the database in sync with the frontend, allowing the BAN QUẢN LÝ
  moderator to approve/reject member registrations.

2. Security
- No new tables or columns.
- No new RLS policies — the existing profiles_admin_update_all and
  admin_update_status policies already use is_admin(), so adding this email
  to the function automatically grants the moderator the same UPDATE permissions
  on profiles that other admins already have.
- admin_audit_log policies also use is_admin(), so the moderator can log
  approval actions to the audit trail.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND email IN (
      'kinhnha010@gmail.com',
      'hamthien53@gmail.com',
      'Ngoncanhtac001@gmail.com',
      'thanhhuyenbsc@gmail.com',
      'dungchikienn@gmail.com',
      'vinhtongthuong@gmail.com'
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;