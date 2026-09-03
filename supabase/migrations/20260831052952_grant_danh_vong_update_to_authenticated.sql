-- Grant UPDATE on danh_vong column to authenticated role so admins can set danh vọng
GRANT UPDATE (danh_vong) ON public.profiles TO authenticated;