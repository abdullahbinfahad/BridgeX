import * as Network from "expo-network";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getOfflineQueue, replaceOfflineQueue } from "../lib/cache";
import { loadMemberProfile, markNotificationRead } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { BridgeXProfile } from "../types";

async function flushSafeActions(userId: string) {
  const actions = await getOfflineQueue();
  const remaining = [];
  for (const action of actions) {
    try {
      if (action.type === "notification-read") await markNotificationRead(userId, action.payload.notificationId);
      else remaining.push(action);
    } catch { remaining.push(action); }
  }
  await replaceOfflineQueue(remaining);
}

export function useBridgeXSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<BridgeXProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  const refreshProfile = useCallback(async (userId = session?.user.id) => {
    if (!userId) { setProfile(null); return; }
    try { setProfile(await loadMemberProfile(userId)); } catch { /* Cached data remains available during an outage. */ }
  }, [session?.user.id]);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await refreshProfile(data.session.user.id);
      if (mounted) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) void refreshProfile(next.user.id); else setProfile(null);
    });
    const network = Network.addNetworkStateListener(state => {
      const reachable = Boolean(state.isInternetReachable ?? state.isConnected);
      setOnline(reachable);
      if (reachable && session?.user.id) void flushSafeActions(session.user.id);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); network.remove(); };
  }, [refreshProfile, session?.user.id]);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); setProfile(null); }, []);
  return { session, profile, loading, online, refreshProfile, signOut };
}
