import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };

export function useAuth(options?: UseAuthOptions) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!options?.redirectOnUnauthenticated || loading || user || typeof window === "undefined") return;
    window.location.href = options.redirectPath ?? "/access";
  }, [loading, options?.redirectOnUnauthenticated, options?.redirectPath, user]);
  const logout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); }, []);
  return { user, loading, error: null, isAuthenticated: Boolean(user), refresh: async () => { const { data } = await supabase.auth.getUser(); setUser(data.user); }, logout };
}
