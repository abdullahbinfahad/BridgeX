import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { NativeLoading } from "../components/NativeLoading";
import { loadCachedMarketplace, loadMarketplace } from "../lib/api";
import { supabase } from "../lib/supabase";
import { isNativeImagePath, isNativeVideoPath, nativeSignedPostMediaUrl, withMediaRetry } from "../lib/publicMedia";
import { PRODUCT_CATEGORIES } from "../lib/constants";
import { useBridgeXAppearance } from "../lib/appearance";
import { useNativeLanguage } from "../lib/i18n";
import type { MarketplacePost, MarketplaceTab } from "../types";

type Props = { onOpenPost: (post: MarketplacePost) => void; onCreateRequest: () => void; onCreateCarry: () => void };

function PublicPostImage({ path, kind }: { path?: string; kind: MarketplacePost["kind"] }) {
  const [attempt, setAttempt] = useState(0);
  const [url, setUrl] = useState<string>();
  useEffect(() => { let active = true; setAttempt(0); setUrl(undefined); void nativeSignedPostMediaUrl(path).then(next => { if (active) setUrl(next); }); return () => { active = false; }; }, [path]);
  if (!url || attempt > 1) return <View style={styles.mediaFallback}><Ionicons name={kind === "requests" ? "cube-outline" : "briefcase-outline"} size={32} color="#6f5cff" /><Text style={styles.mediaFallbackText}>{attempt > 1 ? "Image unavailable" : "Loading image…"}</Text></View>;
  return <Image source={{ uri: withMediaRetry(url, attempt) }} style={styles.image} resizeMode="cover" onError={() => setAttempt(current => current + 1)} accessibilityLabel="Post image" />;
}

function PublicPostVideo({ path }: { path: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => { let active = true; void nativeSignedPostMediaUrl(path).then(next => { if (active) setUrl(next); }); return () => { active = false; }; }, [path]);
  return url ? <NativeVideoPreview url={url} /> : <View style={styles.mediaFallback}><Ionicons name="play-circle-outline" size={32} color="#6f5cff" /><Text style={styles.mediaFallbackText}>Loading video…</Text></View>;
}

function NativeVideoPreview({ url }: { url: string }) {
  const player = useVideoPlayer(url, instance => { instance.muted = true; instance.loop = false; });
  return <VideoView player={player} nativeControls style={styles.image} contentFit="cover" />;
}

export function MarketplaceScreen({ onOpenPost, onCreateRequest, onCreateCarry }: Props) {
  const palette = useBridgeXAppearance();
  const { t } = useNativeLanguage();
  const [tab, setTab] = useState<MarketplaceTab>("requests");
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [priceBand, setPriceBand] = useState<"all" | "low" | "mid" | "high">("all");
  const [timeBand, setTimeBand] = useState<"all" | "today" | "week">("all");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [toolsCollapsed, setToolsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false, quiet = false) => {
    if (refresh) setRefreshing(true); else if (!quiet) setLoading(true);
    try { setError(""); setPosts(await loadMarketplace(tab)); }
    catch (failure: any) { setError(failure?.message || "BridgeX could not load posts right now."); }
    finally { if (!quiet) setLoading(false); setRefreshing(false); }
  }, [tab]);

  useEffect(() => {
    let active = true;
    const prime = async () => {
      const cached = await loadCachedMarketplace(tab);
      if (!active) return;
      if (cached?.length) { setPosts(cached); setLoading(false); void load(false, true); } else void load();
    };
    void prime();
    const table = tab === "requests" ? "send_requests" : "carry_listings";
    const channel = supabase.channel(`native-marketplace-${table}`).on("postgres_changes", { event: "*", schema: "public", table }, () => void load(false, true)).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [load, tab]);

  const filtered = useMemo(() => posts.filter(post => {
    const textMatch = `${post.title} ${post.route} ${post.category || ""} ${(post.categories || []).join(" ")} ${post.posterName || ""}`.toLowerCase().includes(query.toLowerCase().trim());
    const categories = [post.category || "", ...(post.categories || [])].map(value => value.toLowerCase());
    const price = Number(post.price || 0);
    const priceMatch = priceBand === "all" || (priceBand === "low" && price <= 1000) || (priceBand === "mid" && price > 1000 && price <= 10000) || (priceBand === "high" && price > 10000);
    const age = post.createdAt ? Date.now() - new Date(post.createdAt).getTime() : Infinity;
    const timeMatch = timeBand === "all" || (timeBand === "today" && age <= 24 * 60 * 60 * 1000) || (timeBand === "week" && age <= 7 * 24 * 60 * 60 * 1000);
    return textMatch && priceMatch && timeMatch && (!category || categories.includes(category.toLowerCase()));
  }), [posts, query, category, priceBand, timeBand]);

  const selectTab = (value: MarketplaceTab) => { void Haptics.selectionAsync(); setTab(value); setToolsCollapsed(false); };
  const selectCategory = (value: string | null) => { void Haptics.selectionAsync(); setCategory(current => current === value ? null : value); setCategoryOpen(false); };
  const compose = (kind: "request" | "carry") => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); kind === "request" ? onCreateRequest() : onCreateCarry(); };
  const toggleCategories = () => { void Haptics.selectionAsync(); setCategoryOpen(value => !value); };
  const onScroll = (event: any) => {
    const next = event.nativeEvent.contentOffset.y > 96;
    setToolsCollapsed(current => current === next ? current : next);
  };

  const header = <View style={styles.headerContent}>
    <View style={styles.switcherRow}>
      <View style={styles.switcher}>
        <Pressable onPress={() => selectTab("requests")} style={[styles.switch, tab === "requests" && styles.switchActive]}><Text style={[styles.switchText, tab === "requests" && styles.switchTextActive]}>{t("requests")}</Text></Pressable>
        <Pressable onPress={() => selectTab("carry")} style={[styles.switch, tab === "carry" && styles.switchActive]}><Text style={[styles.switchText, tab === "carry" && styles.switchTextActive]}>{t("carrySpace")}</Text></Pressable>
      </View>
      <View style={styles.composeActions}>
        <Pressable accessibilityLabel="Post a send request" onPress={() => compose("request")} style={({ pressed }) => [styles.composeAction, pressed && styles.pressed]}><Ionicons name="add" size={18} color="#fff" /></Pressable>
        <Pressable accessibilityLabel="List carry space" onPress={() => compose("carry")} style={({ pressed }) => [styles.composeActionAlt, pressed && styles.pressed]}><Ionicons name="airplane-outline" size={17} color="#352f7f" /></Pressable>
      </View>
    </View>
    {!toolsCollapsed ? <>
      <View style={styles.searchRow}>
        <View style={[styles.searchWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="search-outline" size={18} color={palette.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={t("search")} placeholderTextColor={palette.muted} selectionColor={palette.primary} style={[styles.search, { color: palette.text }]} autoCorrect={false} returnKeyType="search" /></View>
        <Pressable accessibilityLabel="Choose product categories" onPress={toggleCategories} style={[styles.categoryIcon, categoryOpen && styles.categoryIconActive, category && styles.categoryIconSelected]}><Ionicons name={categoryOpen ? "close-outline" : "options-outline"} size={21} color={categoryOpen || category ? "#fff" : "#5e48d7"} /></Pressable>
      </View>
      {categoryOpen ? <View style={styles.categoryPanel}>
        <View style={styles.categoryPanelHead}><Text style={styles.categoryPanelTitle}>Filter by category</Text><Pressable onPress={() => selectCategory(null)}><Text style={styles.clearFilter}>Show all</Text></Pressable></View>
        <View style={styles.categoryGrid}><Pressable onPress={() => selectCategory(null)} style={[styles.categoryFilter, !category && styles.categoryFilterActive]}><Text style={[styles.categoryFilterText, !category && styles.categoryFilterTextActive]}>All categories</Text></Pressable>{PRODUCT_CATEGORIES.map(item => <Pressable key={item} onPress={() => selectCategory(item)} style={[styles.categoryFilter, category === item && styles.categoryFilterActive, { borderColor: categoryColor(item) }]}><Text style={[styles.categoryFilterText, category === item && styles.categoryFilterTextActive, { color: category === item ? "#fff" : categoryColor(item) }]}>{item}</Text></Pressable>)}</View>
        <Text style={styles.filterLabel}>Time</Text><View style={styles.categoryGrid}>{(["all", "today", "week"] as const).map(value => <Pressable key={value} onPress={() => setTimeBand(value)} style={[styles.categoryFilter, timeBand === value && styles.categoryFilterActive]}><Text style={[styles.categoryFilterText, timeBand === value && styles.categoryFilterTextActive]}>{value === "all" ? "Any time" : value === "today" ? "Today" : "This week"}</Text></Pressable>)}</View>
        <Text style={styles.filterLabel}>Price</Text><View style={styles.categoryGrid}>{(["all", "low", "mid", "high"] as const).map(value => <Pressable key={value} onPress={() => setPriceBand(value)} style={[styles.categoryFilter, priceBand === value && styles.categoryFilterActive]}><Text style={[styles.categoryFilterText, priceBand === value && styles.categoryFilterTextActive]}>{value === "all" ? "Any price" : value === "low" ? "≤ 1K" : value === "mid" ? "1K–10K" : "10K+"}</Text></Pressable>)}</View>
      </View> : null}
    </> : <Pressable onPress={() => setToolsCollapsed(false)} style={styles.compactTools}><Ionicons name="search-outline" size={16} color="#5e48d7" /><Text style={styles.compactToolsText}>{category || "Search and categories"}</Text><Ionicons name="chevron-up" size={16} color="#5e48d7" /></Pressable>}
    <View style={styles.feedLabel}><View><Text style={styles.feedEyebrow}>{tab === "requests" ? "LIVE REQUESTS" : "AVAILABLE CAPACITY"}</Text><Text style={styles.summary}>{filtered.length} matched post{filtered.length === 1 ? "" : "s"}{category ? ` · ${category}` : ""}</Text></View><View style={styles.livePulse}><View style={styles.pulseDot} /><Text style={styles.livePulseText}>LIVE</Text></View></View>
    {loading ? <NativeLoading compact label="Loading live BridgeX posts…" /> : null}
    {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Try again</Text></Pressable></View> : null}
  </View>;

  return <View style={[styles.page, { backgroundColor: palette.background }]}><FlatList data={loading ? [] : filtered} keyExtractor={post => post.id} onScroll={onScroll} scrollEventThrottle={16} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={palette.primary} />} contentContainerStyle={styles.list} ListHeaderComponent={header} ListEmptyComponent={!loading && !error ? <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={[styles.emptyIcon, { backgroundColor: palette.primarySoft }]}><Ionicons name="sparkles-outline" size={28} color={palette.primary} /></View><Text style={[styles.emptyTitle, { color: palette.text }]}>{t("noPosts")}</Text><Text style={[styles.emptyCopy, { color: palette.muted }]}>Try a route, choose another category, or be the first to publish a safe, well-described post.</Text></View> : null} renderItem={({ item }) => <PostCard post={item} onPress={() => onOpenPost(item)} />} /></View>;
}

function PostCard({ post, onPress }: { post: MarketplacePost; onPress: () => void }) {
  const image = post.mediaPaths.find(isNativeImagePath);
  const video = post.mediaPaths.find(isNativeVideoPath);
  const rating = Number(post.posterRating || 0);
  const reviews = Number(post.posterReviewCount || 0);
  const accent = categoryColor(post.category || post.categories?.[0] || post.kind);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { borderLeftColor: accent, borderLeftWidth: 5 }, pressed && styles.pressed]}>{image ? <PublicPostImage path={image} kind={post.kind} /> : video ? <PublicPostVideo path={video} /> : <View style={styles.mediaFallback}><Ionicons name={post.kind === "requests" ? "cube-outline" : "briefcase-outline"} size={32} color="#6f5cff" /><Text style={styles.mediaFallbackText}>{post.mediaPaths.length ? "Document attached" : "No media attached"}</Text></View>}<View style={styles.cardBody}><View style={styles.tagRow}><Text style={[styles.tag, post.kind === "carry" && styles.carryTag, { backgroundColor: `${accent}20`, color: accent }]}>{post.kind === "requests" ? "ITEM REQUEST" : "CARRY SPACE"}</Text><Text style={styles.live}>OPEN</Text></View><Text style={styles.cardTitle} numberOfLines={2}>{post.title}</Text>{post.category ? <Text style={[styles.category, { color: accent }]} numberOfLines={1}>{post.category}</Text> : null}<Text style={styles.route} numberOfLines={2}>{post.route}</Text><View style={styles.details}><View style={styles.detailChip}><Ionicons name="cube-outline" size={13} color="#5f6775" /><Text style={styles.detail}>{post.weight}</Text></View><View style={styles.detailChip}><Ionicons name="wallet-outline" size={13} color="#5f6775" /><Text style={styles.detail}>{post.currency} {post.price.toLocaleString()}</Text></View></View><View style={styles.posterRow}><View style={styles.avatar}><Text style={styles.avatarText}>{String(post.posterName || "B").slice(0, 1).toUpperCase()}</Text></View><View style={styles.posterMeta}><View style={styles.posterNameRow}><Text style={styles.posterName} numberOfLines={1}>{post.posterName || "BridgeX member"}</Text>{post.posterVerified ? <View style={styles.verifiedBadge}><Ionicons name="checkmark" size={10} color="#fff" /></View> : null}</View><View style={styles.reviewRow}><Ionicons name="star" size={12} color="#f3a71f" /><Text style={styles.reviewText}>{reviews ? `${rating.toFixed(1)} · ${reviews} review${reviews === 1 ? "" : "s"}` : "New member · no reviews yet"}</Text></View></View><View style={styles.open}><Text style={styles.openText}>Open post</Text><Ionicons name="arrow-forward" size={17} color="#5e48d7" /></View></View></View></Pressable>;
}

function categoryColor(value: string) { const key = value.toLowerCase(); if (/(electronic|mobile|laptop|camera)/.test(key)) return "#2563eb"; if (/(medicine|beauty|cosmetic|skincare)/.test(key)) return "#db2777"; if (/(business|document)/.test(key)) return "#7c3aed"; if (/(family|personal)/.test(key)) return "#d97706"; if (/(home|garment|decoration)/.test(key)) return "#059669"; return "#5e48d7"; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7f6ff" },
  list: { gap: 13, padding: 16, paddingBottom: 112 },
  headerContent: { gap: 12, paddingBottom: 4 },
  switcherRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between" },
  switcher: { backgroundColor: "#e8e6fa", borderRadius: 16, flexDirection: "row", padding: 4 },
  switch: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  switchActive: { backgroundColor: "#5e48d7" },
  switchText: { color: "#5f6577", fontSize: 11, fontWeight: "900" },
  switchTextActive: { color: "#fff" },
  composeActions: { flexDirection: "row", gap: 6 },
  composeAction: { alignItems: "center", backgroundColor: "#5e48d7", borderRadius: 13, height: 39, justifyContent: "center", width: 39 },
  composeActionAlt: { alignItems: "center", backgroundColor: "#efeaff", borderColor: "#cabff8", borderRadius: 13, borderWidth: 1, height: 39, justifyContent: "center", width: 39 },
  searchRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  searchWrap: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d8d4ee", borderRadius: 15, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, paddingHorizontal: 13 },
  search: { color: "#172126", flex: 1, fontSize: 14, paddingVertical: 12 },
  categoryIcon: { alignItems: "center", backgroundColor: "#f0edff", borderColor: "#cbbff8", borderRadius: 15, borderWidth: 1, height: 46, justifyContent: "center", width: 46 },
  categoryIconActive: { backgroundColor: "#5e48d7", borderColor: "#5e48d7" },
  categoryIconSelected: { backgroundColor: "#6f5cff", borderColor: "#6f5cff" },
  categoryPanel: { backgroundColor: "#fff", borderColor: "#ded8f5", borderRadius: 18, borderWidth: 1, padding: 13 },
  categoryPanelHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  categoryPanelTitle: { color: "#29233f", fontSize: 13, fontWeight: "900" },
  filterLabel: { color: "#625a86", fontSize: 11, fontWeight: "900", marginTop: 12 },
  clearFilter: { color: "#5e48d7", fontSize: 12, fontWeight: "900" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  categoryFilter: { backgroundColor: "#f7f5ff", borderColor: "#d7d1ef", borderRadius: 17, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  categoryFilterActive: { backgroundColor: "#5e48d7", borderColor: "#5e48d7" },
  categoryFilterText: { color: "#554d72", fontSize: 11, fontWeight: "800" },
  categoryFilterTextActive: { color: "#fff" },
  compactTools: { alignItems: "center", backgroundColor: "#efeaff", borderColor: "#d5caf8", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 7, paddingHorizontal: 13, paddingVertical: 10 },
  compactToolsText: { color: "#5e48d7", flex: 1, fontSize: 12, fontWeight: "900" },
  feedLabel: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  feedEyebrow: { color: "#6f5cff", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  summary: { color: "#58616f", fontSize: 12, fontWeight: "700", marginTop: 2 },
  livePulse: { alignItems: "center", backgroundColor: "#e7fbef", borderRadius: 20, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 5 },
  pulseDot: { backgroundColor: "#22a85c", borderRadius: 4, height: 7, width: 7 },
  livePulseText: { color: "#168442", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  card: { backgroundColor: "#fff", borderColor: "#e2def1", borderRadius: 21, borderWidth: 1, overflow: "hidden", shadowColor: "#31296a", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  image: { backgroundColor: "#eef0ff", height: 168, width: "100%" },
  mediaFallback: { alignItems: "center", backgroundColor: "#eeecff", gap: 5, height: 120, justifyContent: "center" },
  mediaFallbackText: { color: "#5d557e", fontSize: 12, fontWeight: "800" },
  cardBody: { padding: 15 },
  tagRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  tag: { backgroundColor: "#eeeaff", borderRadius: 30, color: "#5e48d7", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5 },
  carryTag: { backgroundColor: "#e5f8f1", color: "#157754" },
  live: { color: "#82909a", fontSize: 10, fontWeight: "900" },
  cardTitle: { color: "#1d2030", fontSize: 18, fontWeight: "900", letterSpacing: -0.35, marginTop: 11 },
  category: { color: "#94610f", fontSize: 11, fontWeight: "800", marginTop: 4 },
  route: { color: "#52616b", fontSize: 13, lineHeight: 19, marginTop: 10 },
  details: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 11 },
  detailChip: { alignItems: "center", backgroundColor: "#f6f7fb", borderRadius: 10, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  detail: { color: "#5e6871", fontSize: 11, fontWeight: "800" },
  posterRow: { alignItems: "center", borderTopColor: "#eceaf4", borderTopWidth: 1, flexDirection: "row", marginTop: 14, paddingTop: 12 },
  avatar: { alignItems: "center", backgroundColor: "#dcd6ff", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  avatarText: { color: "#5140bd", fontSize: 13, fontWeight: "900" },
  posterMeta: { flex: 1, marginLeft: 9 },
  posterNameRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  posterName: { color: "#2a2a38", fontSize: 12, fontWeight: "900", maxWidth: 145 },
  verifiedBadge: { alignItems: "center", backgroundColor: "#2a9bf3", borderRadius: 8, height: 16, justifyContent: "center", width: 16 },
  reviewRow: { alignItems: "center", flexDirection: "row", gap: 4, marginTop: 3 },
  reviewText: { color: "#69757b", fontSize: 10, fontWeight: "700" },
  open: { alignItems: "center", backgroundColor: "#f0edff", borderRadius: 11, flexDirection: "row", gap: 3, paddingHorizontal: 9, paddingVertical: 7 },
  openText: { color: "#5e48d7", fontSize: 11, fontWeight: "900" },
  error: { alignItems: "center", backgroundColor: "#fff0ee", borderRadius: 14, padding: 14 },
  errorText: { color: "#974333", fontSize: 13, fontWeight: "700", textAlign: "center" },
  retry: { color: "#5e48d7", fontSize: 13, fontWeight: "900", marginTop: 8 },
  empty: { alignItems: "center", backgroundColor: "#fff", borderColor: "#dcd7ed", borderRadius: 20, borderStyle: "dashed", borderWidth: 1, paddingHorizontal: 30, paddingVertical: 42 },
  emptyIcon: { alignItems: "center", backgroundColor: "#eeebff", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  emptyTitle: { color: "#29233f", fontSize: 18, fontWeight: "900", marginTop: 12 },
  emptyCopy: { color: "#69757b", fontSize: 13, lineHeight: 20, marginTop: 6, textAlign: "center" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
