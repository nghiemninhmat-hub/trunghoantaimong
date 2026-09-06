/*
# Clean up test function and fix Lam Thanh Vĩ

1. Drops the temporary test_spin_as_auth function used during debugging.
2. Lam Thanh Vĩ has 30 total spins but wheel_special_claimed=false
   because they spun past 26 before the ambiguous column fix was applied.
   Since they already passed the threshold without getting a special reward
   (due to the old bug), we set wheel_special_claimed=true to prevent
   them from getting a special reward on their next spin (which would
   be unfair to others). They had their chance at spin 26 but the bug
   prevented it.
*/

DROP FUNCTION IF EXISTS public.test_spin_as_auth(uuid);

-- Mark Lam Thanh Vĩ as having passed the special threshold without claiming
UPDATE public.profiles 
SET wheel_special_claimed = true 
WHERE id = '43d2c480-8651-4922-a984-bb8ba4934a6d' 
  AND wheel_total_spins > 26 
  AND wheel_special_claimed = false;
