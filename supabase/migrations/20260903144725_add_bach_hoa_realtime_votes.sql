/*
# Enable Realtime on bach_hoa_votes

1. Changes
- Adds `bach_hoa_votes` table to the `supabase_realtime` publication so vote inserts
  propagate to subscribed clients in real time.
- This allows the public page and admin dashboard to show new voters instantly
  without polling.

2. Security
- No RLS policy changes. The existing SELECT policy on `bach_hoa_votes` already
  allows `anon, authenticated` to read all votes (intentionally public so voter
  names are visible on the ranking page).
*/

ALTER PUBLICATION supabase_realtime ADD TABLE public.bach_hoa_votes;
