-- Re-run password sync to ensure all profiles.password values are in auth.users
CREATE OR REPLACE FUNCTION public.sync_all_passwords_v2()
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

SELECT public.sync_all_passwords_v2();

DROP FUNCTION public.sync_all_passwords_v2();