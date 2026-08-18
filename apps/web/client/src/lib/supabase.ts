import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://cyvaajdozstfltulnghp.supabase.co",
  "sb_publishable_Fe6enUGU2YKo3sgke3RvWw_ONg9eqhZ",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
