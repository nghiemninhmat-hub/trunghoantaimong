DO $$
DECLARE
  match_count int;
  total_count int;
BEGIN
  SELECT count(*) INTO total_count
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id::uuid
  WHERE p.password IS NULL;
  
  SELECT count(*) INTO match_count
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id::uuid
  WHERE p.password IS NULL
    AND u.encrypted_password = crypt('tht123456', u.encrypted_password);
  
  RAISE NOTICE 'Total accounts with NULL password: %', total_count;
  RAISE NOTICE 'Accounts where tht123456 matches hash: %', match_count;
END $$;
