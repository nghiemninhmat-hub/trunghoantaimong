-- Enable realtime updates on profiles table so the wheel page can sync spin counts
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;