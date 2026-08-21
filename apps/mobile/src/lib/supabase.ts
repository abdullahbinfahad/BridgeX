import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { BRIDGEX_SUPABASE_PUBLISHABLE_KEY, BRIDGEX_SUPABASE_URL } from "../config";
import { secureStorage } from "./secureStorage";

export const supabase = createClient(BRIDGEX_SUPABASE_URL, BRIDGEX_SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: secureStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
