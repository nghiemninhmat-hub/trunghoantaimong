CREATE TABLE IF NOT EXISTS _pwd_check_results (
  id int primary key,
  total_null_pwd int,
  tht123456_matches int
);

DELETE FROM _pwd_check_results;

INSERT INTO _pwd_check_results (id, total_null_pwd, tht123456_matches)
SELECT 1,
  count(*) FILTER (WHERE p.password IS NULL),
  count(*) FILTER (WHERE p.password IS NULL AND u.encrypted_password = crypt('tht123456', u.encrypted_password))
FROM auth.users u
JOIN public.profiles p ON u.id = p.id::uuid;
