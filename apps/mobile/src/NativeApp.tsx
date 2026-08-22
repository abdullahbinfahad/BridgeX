import { useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthScreen } from "./components/AuthScreen";
import { OfflineBanner } from "./components/OfflineBanner";
import { NativeLoading } from "./components/NativeLoading";
import { useBridgeXSession } from "./hooks/useBridgeXSession";
import { MarketplaceScreen } from "./screens/MarketplaceScreen";
import { ComposeScreen } from "./screens/ComposeScreen";
import { PostDetailScreen } from "./screens/PostDetailScreen";
import { WorkspaceScreen } from "./screens/WorkspaceScreen";
import { MessagesScreen } from "./screens/MessagesScreen";
import { ResponseScreen } from "./screens/ResponseScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { PaymentsScreen } from "./screens/PaymentsScreen";
import { AdminScreen } from "./screens/AdminScreen";
import { MemberProfileScreen } from "./screens/MemberProfileScreen";
import { MoreScreen } from "./screens/MoreScreen";
import { InfoScreen } from "./screens/InfoScreen";
import type { AppRoute, NativeInfoSection } from "./types";
import type { MarketplacePost } from "./types";

export default function NativeApp() {
  const { session, profile, loading, online, refreshProfile, signOut } = useBridgeXSession();
  const [guest, setGuest] = useState(false);
  const [route, setRoute] = useState<AppRoute>("marketplace");
  const [selectedPost, setSelectedPost] = useState<MarketplacePost | null>(null);
  const [infoSection, setInfoSection] = useState<NativeInfoSection>("about");
  const routeHistory = useRef<AppRoute[]>([]);

  const navigate = (next: AppRoute) => {
    setRoute(current => {
      if (current !== next) routeHistory.current = [...routeHistory.current, current].slice(-24);
      return next;
    });
  };
  const goBack = () => {
    const previous = routeHistory.current.pop();
    if (previous) { setRoute(previous); return true; }
    if (route !== "marketplace") { setRoute("marketplace"); return true; }
    return false;
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => goBack());
    return () => subscription.remove();
  });

  if (loading) return <SafeAreaView style={styles.loading}><StatusBar style="dark" /><NativeLoading label="Preparing BridgeX…" /></SafeAreaView>;
  if (!session && !guest) return <SafeAreaView style={styles.root}><StatusBar style="dark" /><AuthScreen onGuest={() => setGuest(true)} /></SafeAreaView>;

  const displayName = profile?.full_name || session?.user.user_metadata?.full_name || session?.user.user_metadata?.name || "BridgeX member";
  const openPost = (post: MarketplacePost) => { setSelectedPost(post); navigate("post"); };
  const openInfo = (section: NativeInfoSection) => { setInfoSection(section); navigate("info"); };
  const content = route === "profile" && session ? <ProfileScreen userId={session.user.id} profile={profile} onSaved={() => void refreshProfile()} onSignOut={() => void signOut()} onOpenAdmin={() => navigate("admin")} /> : route === "admin" && session ? <AdminScreen role={profile?.role} /> : route === "notifications" && session ? <NotificationsScreen userId={session.user.id} /> : route === "payments" && session ? <PaymentsScreen userId={session.user.id} /> : route === "more" ? <MoreScreen signedIn={Boolean(session)} onProfile={() => session ? navigate("profile") : setGuest(false)} onUpdates={() => session ? navigate("notifications") : setGuest(false)} onPayments={() => session ? navigate("payments") : setGuest(false)} onInfo={openInfo} /> : route === "info" ? <InfoScreen section={infoSection} onBack={goBack} /> : route === "member" && selectedPost ? <MemberProfileScreen ownerId={selectedPost.ownerId} name={selectedPost.posterName} verified={selectedPost.posterVerified} rating={selectedPost.posterRating} reviewCount={selectedPost.posterReviewCount} onBack={goBack} onOpenPost={openPost} /> : route === "respond" && selectedPost && session ? <ResponseScreen post={selectedPost} userId={session.user.id} profile={profile} onBack={goBack} onSuccess={() => navigate("workspace")} onProfile={() => navigate("profile")} /> : route === "post" && selectedPost ? <PostDetailScreen post={selectedPost} signedIn={Boolean(session)} onBack={goBack} onRespond={() => session ? navigate("respond") : setGuest(false)} onOpenMember={() => navigate("member")} /> : route === "marketplace" || route === "home" ? <MarketplaceScreen onOpenPost={openPost} /> : route === "create" ? session ? <ComposeScreen userId={session.user.id} onPublished={() => navigate("marketplace")} /> : <View style={styles.body}><Text style={styles.heroTitle}>Sign in before posting</Text><Text style={styles.heroCopy}>Guest browsing is open. Sign in to create a protected request or carry-space listing.</Text><Pressable onPress={() => setGuest(false)} style={styles.primaryAction}><Text style={styles.primaryActionText}>Sign in or create account</Text></Pressable></View> : route === "workspace" ? session ? <WorkspaceScreen userId={session.user.id} onCreate={() => navigate("create")} onOpenMessages={() => navigate("messages")} /> : <View style={styles.body}><Text style={styles.heroTitle}>Sign in to open your workspace</Text><Text style={styles.heroCopy}>Your posts, offers, protected orders, and payment activity are private to your BridgeX account.</Text><Pressable onPress={() => setGuest(false)} style={styles.primaryAction}><Text style={styles.primaryActionText}>Sign in or create account</Text></Pressable></View> : route === "messages" ? session ? <MessagesScreen userId={session.user.id} /> : <View style={styles.body}><Text style={styles.heroTitle}>Sign in to access protected messages</Text><Text style={styles.heroCopy}>Only matched members and authorized administrators can access protected BridgeX deal conversations.</Text><Pressable onPress={() => setGuest(false)} style={styles.primaryAction}><Text style={styles.primaryActionText}>Sign in or create account</Text></Pressable></View> : <View style={styles.body}><Text style={styles.heroTitle}>{`${route[0].toUpperCase() + route.slice(1)} is ready next.`}</Text><Text style={styles.heroCopy}>This independent native screen is being connected to the protected BridgeX API. Marketplace browsing, native post creation, protected workspace, private deal messages, response forms, profile, verification, account updates, payments, and role-gated member moderation are now available.</Text><View style={styles.statusCard}><Text style={styles.statusTitle}>{online ? "Connected securely" : "Offline-safe mode"}</Text><Text style={styles.statusCopy}>{online ? "Live account information and public posts can refresh from the BridgeX API." : "Cached public posts and account information remain available. Sensitive financial or match-changing actions are never queued offline."}</Text></View></View>;
  return <SafeAreaView style={styles.root}><StatusBar style="dark" /><OfflineBanner visible={!online} /><View style={styles.header}><View><Text style={styles.eyebrow}>BRIDGEX</Text><Text style={styles.headerTitle}>{route === "post" ? "Post details" : route === "marketplace" ? "Marketplace" : route === "more" ? "More" : route === "info" ? "BridgeX" : route[0].toUpperCase() + route.slice(1)}</Text></View>{session ? <Pressable onPress={() => navigate("profile")} style={styles.account}><Text style={styles.accountText}>{String(displayName).slice(0, 1).toUpperCase()}</Text></Pressable> : <Pressable onPress={() => setGuest(false)} style={styles.signIn}><Text style={styles.signInText}>Sign in</Text></Pressable>}</View>{content}{route !== "post" && route !== "respond" && route !== "profile" && route !== "member" && route !== "info" && route !== "admin" && <View style={styles.tabs}>{(["marketplace", "create", "workspace", "messages", "more"] as AppRoute[]).map(tab => <Pressable key={tab} onPress={() => navigate(tab)} style={({ pressed }) => [styles.tab, route === tab && styles.tabActive, pressed && styles.tabPressed]}><Text style={styles.tabIcon}>{tab === "marketplace" ? "⌂" : tab === "create" ? "+" : tab === "workspace" ? "▦" : tab === "messages" ? "◌" : "⋯"}</Text><Text style={[styles.tabText, route === tab && styles.tabTextActive]}>{tab === "create" ? "Post" : tab === "more" ? "More" : tab[0].toUpperCase() + tab.slice(1)}</Text></Pressable>)}</View>}</SafeAreaView>;
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: "#f7f5ef" }, loading: { alignItems: "center", backgroundColor: "#f7f5ef", flex: 1, justifyContent: "center" }, header: { alignItems: "center", backgroundColor: "#f7f5ef", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 }, eyebrow: { color: "#2d8d62", fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, headerTitle: { color: "#172126", fontSize: 24, fontWeight: "800", letterSpacing: -0.7, marginTop: 2 }, account: { alignItems: "center", backgroundColor: "#172126", borderRadius: 20, height: 38, justifyContent: "center", width: 38 }, accountText: { color: "#fff", fontSize: 15, fontWeight: "900" }, signIn: { backgroundColor: "#172126", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, signInText: { color: "#fff", fontSize: 13, fontWeight: "800" }, body: { flex: 1, padding: 20 }, heroTitle: { color: "#172126", fontFamily: "serif", fontSize: 31, fontWeight: "800", letterSpacing: -1, lineHeight: 35, maxWidth: 310 }, heroCopy: { color: "#59686a", fontSize: 15, lineHeight: 22, marginTop: 13 }, primaryAction: { alignItems: "center", backgroundColor: "#172126", borderRadius: 13, marginTop: 21, paddingVertical: 14 }, primaryActionText: { color: "#fff", fontSize: 14, fontWeight: "900" }, statusCard: { backgroundColor: "#e5f1e7", borderColor: "#c8dfcd", borderRadius: 18, borderWidth: 1, marginTop: 24, padding: 18 }, statusTitle: { color: "#176447", fontSize: 15, fontWeight: "900" }, statusCopy: { color: "#3e6650", fontSize: 13, lineHeight: 20, marginTop: 6 }, tabs: { alignItems: "center", backgroundColor: "#fff", borderTopColor: "#dfe4db", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", paddingBottom: 10, paddingTop: 8 }, tab: { alignItems: "center", borderRadius: 10, minWidth: 47, paddingHorizontal: 5, paddingVertical: 6 }, tabActive: { backgroundColor: "#e5f1e7" }, tabPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] }, tabIcon: { color: "#2d8d62", fontSize: 15, fontWeight: "900", lineHeight: 17 }, tabText: { color: "#718082", fontSize: 9, fontWeight: "800", marginTop: 1 }, tabTextActive: { color: "#176447" } });
