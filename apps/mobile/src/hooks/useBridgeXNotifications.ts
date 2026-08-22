import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { BRIDGEX_EAS_PROJECT_ID } from "../config";
import { loadNativeNotificationById, loadNativeUnreadCounts, markNotificationRead, registerNativePushToken, resolveNativeNotificationDestination, type NativeNotificationDestination, type NativeUnreadCounts } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { NativeNotification } from "../types";

const emptyCounts: NativeUnreadCounts = { updates: 0, messages: 0, workspace: 0, more: 0 };

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
  });
}

async function registerForNativePush(userId: string) {
  if (Platform.OS === "web") return;
  await Notifications.setNotificationChannelAsync("bridgex-updates", { name: "BridgeX updates", importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 180, 120, 180], sound: "default", lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC });
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;
  const token = await Notifications.getExpoPushTokenAsync({ projectId: BRIDGEX_EAS_PROJECT_ID });
  await registerNativePushToken(userId, token.data);
}

export function useBridgeXNotifications(userId: string | undefined, onOpenDestination: (destination: NativeNotificationDestination) => void) {
  const [counts, setCounts] = useState<NativeUnreadCounts>(emptyCounts);
  const refresh = useCallback(async () => {
    if (!userId) { setCounts(emptyCounts); if (Platform.OS !== "web") await Notifications.setBadgeCountAsync(0); return; }
    try {
      const next = await loadNativeUnreadCounts();
      setCounts(next);
      if (Platform.OS !== "web") await Notifications.setBadgeCountAsync(next.updates);
    } catch { /* The app remains usable with the last known badge state during a temporary outage. */ }
  }, [userId]);

  useEffect(() => {
    if (!userId) { void refresh(); return; }
    void refresh();
    void registerForNativePush(userId).catch(() => undefined);
    const channel = supabase.channel(`native-unread-counts-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => void refresh()).on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => void refresh()).subscribe();
    const received = Platform.OS === "web" ? undefined : Notifications.addNotificationReceivedListener(() => void refresh());
    const response = Platform.OS === "web" ? undefined : Notifications.addNotificationResponseReceivedListener(notificationResponse => {
      const data = notificationResponse.notification.request.content.data || {};
      const notificationId = typeof data.notificationId === "string" ? data.notificationId : "";
      void (async () => {
        try {
          const item = notificationId ? await loadNativeNotificationById(userId, notificationId) : null;
          if (item) {
            if (!item.read_at) await markNotificationRead(userId, item.id);
            onOpenDestination(resolveNativeNotificationDestination(item));
          } else {
            const fallback: NativeNotification = { id: notificationId || `push-${Date.now()}`, created_at: new Date().toISOString(), link: typeof data.link === "string" ? data.link : "/notifications" };
            onOpenDestination(resolveNativeNotificationDestination(fallback));
          }
        } finally { await refresh(); }
      })();
    });
    return () => { void supabase.removeChannel(channel); received?.remove(); response?.remove(); };
  }, [onOpenDestination, refresh, userId]);

  return { counts, refresh };
}
