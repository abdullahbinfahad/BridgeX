import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { enqueueOfflineAction } from "../lib/cache";
import { loadNotifications, markNotificationRead, resolveNativeNotificationDestination, type NativeNotificationDestination } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { NativeNotification } from "../types";

const PAGE_SIZE = 30;
const mergeNotices = (first: NativeNotification[], second: NativeNotification[]) => Array.from(new Map([...first, ...second].map(item => [item.id, item])).values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export function NotificationsScreen({ userId, onOpenDestination, onUnreadChange }: { userId: string; onOpenDestination: (destination: NativeNotificationDestination) => void; onUnreadChange?: () => void }) {
  const [items, setItems] = useState<NativeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const loadFirst = useCallback(async (merge = false) => { merge ? setRefreshing(true) : setLoading(true); try { setError(""); const page = await loadNotifications(userId, null, PAGE_SIZE); setItems(current => merge ? mergeNotices(page.items, current) : page.items); if (!merge || items.length === 0) setNextBefore(page.nextBefore); setHasMore(page.hasMore); } catch (failure: any) { setError(failure?.message || "BridgeX could not load updates."); } finally { setLoading(false); setRefreshing(false); } }, [items.length, userId]);
  const loadMore = useCallback(async () => { if (!hasMore || !nextBefore || loadingMore) return; setLoadingMore(true); try { const page = await loadNotifications(userId, nextBefore, PAGE_SIZE); setItems(current => mergeNotices(current, page.items)); setNextBefore(page.nextBefore); setHasMore(page.hasMore); } catch (failure: any) { setError(failure?.message || "BridgeX could not load older updates."); } finally { setLoadingMore(false); } }, [hasMore, loadingMore, nextBefore, userId]);

  useEffect(() => {
    void loadFirst();
    const channel = supabase.channel(`native-notifications-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, payload => {
      const incoming = payload.new as NativeNotification;
      if (payload.eventType === "INSERT" && incoming?.id) setItems(current => mergeNotices([incoming], current));
      if (payload.eventType === "UPDATE" && incoming?.id) setItems(current => current.map(item => item.id === incoming.id ? { ...item, ...incoming } : item));
      void onUnreadChange?.();
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadFirst, onUnreadChange, userId]);

  const open = async (item: NativeNotification) => {
    if (!item.read_at) {
      try { await markNotificationRead(userId, item.id); setItems(current => current.map(value => value.id === item.id ? { ...value, read_at: new Date().toISOString() } : value)); }
      catch { await enqueueOfflineAction({ id: `notification-read:${item.id}`, type: "notification-read", payload: { notificationId: item.id }, createdAt: Date.now() }); setItems(current => current.map(value => value.id === item.id ? { ...value, read_at: new Date().toISOString() } : value)); }
      void onUnreadChange?.();
    }
    onOpenDestination(resolveNativeNotificationDestination(item));
  };

  return <View style={styles.page}><View style={styles.hero}><View><Text style={styles.eyebrow}>YOUR BRIDGEX ACTIVITY</Text><Text style={styles.title}>Updates</Text><Text style={styles.copy}>Fresh account, deal, payment, and safety activity appears here first.</Text></View><View style={styles.heroBell}><Text style={styles.heroBellText}>{items.filter(item => !item.read_at).length}</Text></View></View>{loading ? <View style={styles.center}><ActivityIndicator color="#6f5cff" /></View> : <FlatList data={items} keyExtractor={item => item.id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadFirst(true)} tintColor="#6f5cff" />} onEndReached={() => void loadMore()} onEndReachedThreshold={0.35} ListFooterComponent={loadingMore ? <View style={styles.footer}><ActivityIndicator color="#6f5cff" /><Text style={styles.footerText}>Loading older updates…</Text></View> : hasMore ? <Text style={styles.footerText}>Scroll for older updates</Text> : items.length ? <Text style={styles.footerText}>All available updates are loaded</Text> : null} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No updates yet</Text><Text style={styles.emptyCopy}>Payment, safety, deal, and account updates will appear here.</Text></View>} renderItem={({ item, index }) => <Pressable onPress={() => void open(item)} style={[styles.item, { borderLeftColor: updateColor(item.type || "", index) }, !item.read_at && styles.unread]}><View style={[styles.dot, { backgroundColor: updateColor(item.type || "", index) }]} /><View style={styles.itemCopy}><View style={styles.itemHead}><Text style={styles.itemTitle}>{item.title || "BridgeX update"}</Text><Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text></View><Text style={styles.body}>{item.body || "Open this update for more details."}</Text><Text style={styles.open}>Open related activity ›</Text></View></Pressable>} />}{error ? <Text style={styles.error}>{error}</Text> : null}</View>;
}

function updateColor(type: string, index: number) { const value = type.toLowerCase(); if (value.includes("payment")) return "#7c3aed"; if (value.includes("offer") || value.includes("interest")) return "#ea580c"; if (value.includes("verify") || value.includes("safety")) return "#059669"; return ["#2563eb", "#db2777", "#6f5cff"][index % 3]; }

const styles = StyleSheet.create({ page: { backgroundColor: "#f7f6ff", flex: 1 }, hero: { alignItems: "center", backgroundColor: "#272055", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 22, paddingTop: 12 }, eyebrow: { color: "#bdb2ff", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { color: "#fff", fontFamily: "serif", fontSize: 30, fontWeight: "800", letterSpacing: -0.9, marginTop: 3 }, copy: { color: "#d8d4f2", fontSize: 13, lineHeight: 18, marginTop: 3, maxWidth: 255 }, heroBell: { alignItems: "center", backgroundColor: "#ffc56e", borderRadius: 22, height: 44, justifyContent: "center", width: 44 }, heroBellText: { color: "#4d3201", fontSize: 15, fontWeight: "900" }, center: { alignItems: "center", flex: 1, justifyContent: "center" }, list: { gap: 10, padding: 16, paddingTop: 18 }, item: { alignItems: "flex-start", backgroundColor: "#fff", borderLeftWidth: 5, borderRadius: 18, flexDirection: "row", gap: 10, padding: 15, shadowColor: "#37305d", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, unread: { backgroundColor: "#fffdf5" }, dot: { borderRadius: 5, height: 10, marginTop: 5, width: 10 }, itemCopy: { flex: 1 }, itemHead: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" }, itemTitle: { color: "#29233f", flex: 1, fontSize: 14, fontWeight: "900" }, time: { color: "#7b729a", fontSize: 10 }, body: { color: "#645e78", fontSize: 12, lineHeight: 18, marginTop: 4 }, open: { color: "#5e48d7", fontSize: 11, fontWeight: "900", marginTop: 7 }, empty: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d9d3f3", borderRadius: 18, borderStyle: "dashed", borderWidth: 1, padding: 26 }, emptyTitle: { color: "#30294d", fontSize: 16, fontWeight: "900" }, emptyCopy: { color: "#706987", fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: "center" }, footer: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center", padding: 16 }, footerText: { color: "#776f93", fontSize: 12, fontWeight: "700", padding: 16, textAlign: "center" }, error: { color: "#a23e55", fontSize: 12, padding: 15, textAlign: "center" } });
