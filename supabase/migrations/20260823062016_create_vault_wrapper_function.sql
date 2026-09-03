-- Create a wrapper function in public schema to store vault secrets via REST API
-- This allows the edge function to store the service role key in vault
CREATE OR REPLACE FUNCTION public.store_vault_secret(
  p_secret text,
  p_name text,
  p_description text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  -- Check if secret with this name already exists
  SELECT id INTO v_id FROM vault.secrets WHERE name = p_name LIMIT 1;
  
  IF v_id IS NOT NULL THEN
    -- Update existing
    PERFORM vault.update_secret(v_id, p_secret, p_name, p_description);
    RETURN v_id;
  END IF;
  
  -- Create new
  v_id := vault.create_secret(p_secret, p_name, p_description);
  RETURN v_id;
END;
$function$;

-- Only service_role can call this (not anon or authenticated)
REVOKE EXECUTE ON FUNCTION public.store_vault_secret(text, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.store_vault_secret(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.store_vault_secret(text, text, text) FROM authenticated;
