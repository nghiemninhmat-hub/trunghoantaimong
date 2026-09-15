-- Add Nghiêm Hoằng Chương and Truy Yên as admins
-- Nghiêm Hoằng Chương: trinhhoaiquang@gmail.com
-- Truy Yên: tkplaygame1510@gmail.com

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
  AND email IN (
    'kinhnha010@gmail.com',
    'hamthien53@gmail.com',
    'Ngoncanhtac001@gmail.com',
    'thanhhuyenbsc@gmail.com',
    'dungchikienn@gmail.com',
    'vinhtongthuong@gmail.com',
    'trinhhoaiquang@gmail.com',
    'tkplaygame1510@gmail.com'
  )
);
$function$;

-- Ensure execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
