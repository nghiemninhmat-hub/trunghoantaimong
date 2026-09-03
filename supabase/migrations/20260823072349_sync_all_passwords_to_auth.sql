-- Sync ALL plaintext passwords from profiles.password to auth.users.encrypted_password
-- This ensures that the password shown in admin dashboard matches what login uses
CREATE OR REPLACE FUNCTION public.sync_all_passwords_to_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_count int := 0;
  v_record record;
BEGIN
  FOR v_record IN SELECT id, password FROM public.profiles WHERE password IS NOT NULL AND length(password) >= 6
  LOOP
    UPDATE auth.users
    SET encrypted_password = crypt(v_record.password, gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_record.id;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'synced_count', v_count);
END;
$function$;

-- Execute the sync
SELECT public.sync_all_passwords_to_auth();

-- Drop the helper function (no longer needed)
DROP FUNCTION public.sync_all_passwords_to_auth();