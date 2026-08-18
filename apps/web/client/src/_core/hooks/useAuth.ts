import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };
type BridgeXUser = { id: string; email?: string; user_metadata?: Record<string, unknown>; role?: "member" | "admin"; verificationStatus?: "not_submitted" | "pending_review" | "approved" | "rejected"; onboardingComplete?: boolean } | null;

export function useAuth(options?: UseAuthOptions) {
  const [user, setUser] = useState<BridgeXUser>(null);
  const [loading, setLoading] = useState(true);
  const hydrate = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setUser(null); setLoading(false); return; }
    const { data: profile } = await supabase.from("users").select("role,verification_status,onboarding_complete").eq("id", data.user.id).maybeSingle();
    setUser({ ...data.user, role: profile?.role === "admin" ? "admin" : "member", verificationStatus: profile?.verification_status ?? "not_submitted", onboardingComplete: Boolean(profile?.onboarding_complete) }); setLoading(false);
  }, []);
  useEffect(() => { void hydrate(); const { data: listener } = supabase.auth.onAuthStateChange(() => { void hydrate(); }); return () => listener.subscription.unsubscribe(); }, [hydrate]);
  useEffect(() => { if (!options?.redirectOnUnauthenticated || loading || user || typeof window === "undefined") return; window.location.href = options.redirectPath ?? "/access"; }, [loading, options?.redirectOnUnauthenticated, options?.redirectPath, user]);
  const logout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); }, []);
  return { user, loading, error: null, isAuthenticated: Boolean(user), refresh: hydrate, logout };
}
