import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string };
type MemberProfile = { full_name?: string | null; phone?: string | null; bio?: string | null; avatar_path?: string | null; current_country?: string | null; current_city?: string | null; current_address?: string | null; home_country?: string | null; home_city?: string | null; home_address?: string | null; china_address?: string | null; preferred_currency?: string | null };
type BridgeXUser = { id: string; email?: string; name?: string; avatarUrl?: string; user_metadata?: Record<string, unknown>; profile?: MemberProfile; role?: "member" | "admin" | "super_admin"; verificationStatus?: "not_submitted" | "pending_review" | "approved" | "rejected"; onboardingComplete?: boolean } | null;
let cachedUser: BridgeXUser | undefined;
let cachedAt = 0;
let hydrationRequest: Promise<BridgeXUser> | null = null;
const SESSION_CACHE_MS = 45_000;

async function readBridgeXUser(): Promise<BridgeXUser> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const authenticatedUser = sessionData.session?.user;
  if (!authenticatedUser) return null;
  const { data: profile, error: profileError } = await supabase.from("users").select("role,verification_status,onboarding_complete,full_name,phone,bio,avatar_path,current_country,current_city,current_address,home_country,home_city,home_address,china_address,preferred_currency").eq("id", authenticatedUser.id).maybeSingle();
  if (profileError) throw profileError;
  const metadata = authenticatedUser.user_metadata ?? {};
  const avatarPath = profile?.avatar_path;
  const uploadedAvatarUrl = avatarPath ? supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl : undefined;
  const providerAvatar = typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : undefined;
  const name = profile?.full_name || (typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : authenticatedUser.email?.split("@")[0]);
  return { ...authenticatedUser, name, avatarUrl: uploadedAvatarUrl || providerAvatar, profile: profile ?? undefined, role: profile?.role === "super_admin" ? "super_admin" : profile?.role === "admin" ? "admin" : "member", verificationStatus: profile?.verification_status ?? "not_submitted", onboardingComplete: Boolean(profile?.onboarding_complete) };
}

export function useAuth(options?: UseAuthOptions) {
  const [user, setUser] = useState<BridgeXUser>(null);
  const [loading, setLoading] = useState(true);
  const hydrate = useCallback(async (force = false) => {
    if (!force && cachedUser !== undefined && Date.now() - cachedAt < SESSION_CACHE_MS) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      hydrationRequest ??= readBridgeXUser();
      const nextUser = await hydrationRequest;
      cachedUser = nextUser;
      cachedAt = Date.now();
      setUser(nextUser);
    } catch {
      cachedUser = null;
      cachedAt = Date.now();
      setUser(null);
    } finally {
      hydrationRequest = null;
      setLoading(false);
    }
  }, []);
  useEffect(() => { void hydrate(); const { data: listener } = supabase.auth.onAuthStateChange(() => { cachedUser = undefined; cachedAt = 0; void hydrate(true); }); return () => listener.subscription.unsubscribe(); }, [hydrate]);
  useEffect(() => { if (!options?.redirectOnUnauthenticated || loading || user || typeof window === "undefined") return; window.location.href = options.redirectPath ?? "/access"; }, [loading, options?.redirectOnUnauthenticated, options?.redirectPath, user]);
  const logout = useCallback(async () => { await supabase.auth.signOut(); cachedUser = null; cachedAt = Date.now(); setUser(null); }, []);
  return { user, loading, error: null, isAuthenticated: Boolean(user), refresh: hydrate, logout };
}
