-- Normalize all profile emails to lowercase to match auth.users behavior
UPDATE public.profiles SET email = lower(email) WHERE email != lower(email);