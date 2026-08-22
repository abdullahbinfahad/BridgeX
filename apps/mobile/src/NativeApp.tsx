import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
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
import type { AppRoute, NativeInfoSection, MarketplacePost } from "./types";

type ComposeMode = "request" | "carry";
const tabs = [
  { route: "marketplace", label: "Marketplace", icon: "compass-outline" },
  { route: "workspace", label: "Workspace", icon: "briefcase-outline" },
  { route: "messages", label: "Messages", icon: "chatbubbles-outline" },
  { route: "notifications", label: "Updates", icon: "notifications-outline" },
  { route: "more", label: "More", icon: "grid-outline" },
] as const;

export default function NativeApp() {
  const { session, profile, loading, online, refreshProfile, signOut } = useBridgeXSession();
  const [guest, setGuest] = useState(false);
  const [route, setRoute] = useState<AppRoute>("marketplace");
  const [selectedPost, setSelectedPost] = useState<MarketplacePost | null>(null);
  const [infoSection, setInfoSection] = useState<NativeInfoSection>("about");
  const [composeMode, setComposeMode] = useState<ComposeMode>("request");
  const routeHistory = useRef<AppRoute[]>([]);
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

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
  const tap = (next: AppRoute) => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigate(next); };
  const openComposer = (mode: ComposeMode) => { setComposeMode(mode); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigate("create"); };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => goBack());
    return () => subscription.remove();
  });

  if (loading) return <SafeAreaView style={styles.loading}><StatusBar style="dark" /><View style={styles.topBlank} /><NativeLoading label="Preparing BridgeX…" /></SafeAreaView>;
  if (!session && !guest) return <SafeAreaView style={styles.root}><StatusBar style="dark" /><View style={styles.topBlank} /><AuthScreen onGuest={() => setGuest(true)} /></SafeAreaView>;

  const displayName = profile?.full_name || session?.user.user_metadata?.full_name || session?.user.user_metadata?.name || "BridgeX member";
  const openPost = (post: MarketplacePost) => { setSelectedPost(post); navigate("post"); };
  const openInfo = (section: NativeInfoSection) => { setInfoSection(section); navigate("info"); };
  const content = route === "profile" && session ? <ProfileScreen userId={session.user.id} profile={profile} onSaved={() => void refreshProfile()} onSignOut={() => void signOut()} onOpenAdmin={() => navigate("admin")} /> : route === "admin" && session ? <AdminScreen role={profile?.role} /> : route === "notifications" && session ? <NotificationsScreen userId={session.user.id} /> : route === "payments" && session ? <PaymentsScreen userId={session.user.id} /> : route === "more" ? <MoreScreen signedIn={Boolean(session)} role={profile?.role} onProfile={() => session ? navigate("profile") : setGuest(false)} onPayments={() => session ? navigate("payments") : setGuest(false)} onAdmin={() => navigate("admin")} onInfo={openInfo} /> : route === "info" ? <InfoScreen section={infoSection} onBack={goBack} /> : route === "member" && selectedPost ? <MemberProfileScreen ownerId={selectedPost.ownerId} name={selectedPost.posterName} verified={selectedPost.posterVerified} rating={selectedPost.posterRating} reviewCount={selectedPost.posterReviewCount} onBack={goBack} onOpenPost={openPost} /> : route === "respond" && selectedPost && session ? <ResponseScreen post={selectedPost} userId={session.user.id} profile={profile} onBack={goBack} onSuccess={() => navigate("workspace")} onProfile={() => navigate("profile")} /> : route === "post" && selectedPost ? <PostDetailScreen post={selectedPost} signedIn={Boolean(session)} onBack={goBack} onRespond={() => session ? navigate("respond") : setGuest(false)} onOpenMember={() => navigate("member")} /> : route === "marketplace" || route === "home" ? <MarketplaceScreen onOpenPost={openPost} onCreateRequest={() => openComposer("request")} onCreateCarry={() => openComposer("carry")} /> : route === "create" ? session ? <ComposeScreen userId={session.user.id} initialMode={composeMode} onPublished={() => navigate("marketplace")} /> : <SignedOutPrompt title="Sign in before posting" copy="Guest browsing is open. Sign in to create a protected request or carry-space listing." onSignIn={() => setGuest(false)} /> : route === "workspace" ? session ? <WorkspaceScreen userId={session.user.id} onBrowseMarketplace={() => navigate("marketplace")} onOpenMessages={() => navigate("messages")} /> : <SignedOutPrompt title="Sign in to open your workspace" copy="Your posts, offers, protected orders, and payment activity are private to your BridgeX account." onSignIn={() => setGuest(false)} /> : route === "messages" ? session ? <MessagesScreen userId={session.user.id} /> : <SignedOutPrompt title="Sign in to access protected messages" copy="Only matched members and authorized administrators can access protected BridgeX deal conversations." onSignIn={() => setGuest(false)} /> : <View style={styles.body}><Text style={styles.heroTitle}>{`${route[0].toUpperCase() + route.slice(1)} is ready next.`}</Text><Text style={styles.heroCopy}>This independent native screen uses the secured BridgeX API for marketplace browsing, publishing, protected orders, deal messages, responses, profile, verification, updates, payments, and authorized moderation.</Text><View style={styles.statusCard}><Text style={styles.statusTitle}>{online ? "Connected securely" : "Offline-safe mode"}</Text><Text style={styles.statusCopy}>{online ? "Live account information and public posts can refresh from the BridgeX API." : "Cached public posts and account information remain available. Sensitive financial or match-changing actions are never queued offline."}</Text></View></View>;

  const hideTabs = ["post", "respond", "profile", "member", "info", "admin", "create"].includes(route);
  return <SafeAreaView style={styles.root}><StatusBar style="dark" /><View style={styles.topBlank} /><OfflineBanner visible={!online} /><View style={styles.header}><View><Text style={styles.eyebrow}>BRIDGEX</Text><Text style={styles.headerTitle}>{route === "post" ? "Post details" : route === "marketplace" ? "Marketplace" : route === "notifications" ? "Updates" : route === "more" ? "More" : route === "info" ? "BridgeX" : route[0].toUpperCase() + route.slice(1)}</Text></View><View style={styles.headerActions}>{isAdmin ? <Pressable accessibilityLabel="Open administrator control" onPress={() => tap("admin")} style={({ pressed }) => [styles.adminShortcut, pressed && styles.iconPressed]}><Ionicons name="shield-checkmark-outline" size={19} color="#9a6c0e" /></Pressable> : null}{session ? <Pressable accessibilityLabel="Open profile" onPress={() => tap("profile")} style={({ pressed }) => [styles.account, pressed && styles.iconPressed]}><Text style={styles.accountText}>{String(displayName).slice(0, 1).toUpperCase()}</Text></Pressable> : <Pressable onPress={() => setGuest(false)} style={styles.signIn}><Text style={styles.signInText}>Sign in</Text></Pressable>}</View></View>{content}{!hideTabs ? <View style={styles.tabs}>{tabs.map(tab => <Pressable key={tab.route} onPress={() => tap(tab.route)} style={({ pressed }) => [styles.tab, route === tab.route && styles.tabActive, pressed && styles.tabPressed]}><Ionicons name={tab.icon} size={20} color={route === tab.route ? "#176447" : "#718082"} /><Text style={[styles.tabText, route === tab.route && styles.tabTextActive]}>{tab.label}</Text></Pressable>)}</View> : null}</SafeAreaView>;
}

function SignedOutPrompt({ title, copy, onSignIn }: { title: string; copy: string; onSignIn: () => void }) { return <View style={styles.body}><Text style={styles.heroTitle}>{title}</Text><Text style={styles.heroCopy}>{copy}</Text><Pressable onPress={onSignIn} style={styles.primaryAction}><Text style={styles.primaryActionText}>Sign in or create account</Text></Pressable></View>; }

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: "#f7f5ef" }, loading: { backgroundColor: "#f7f5ef", flex: 1 }, topBlank: { backgroundColor: "#f7f5ef", height: 18 }, header: { alignItems: "center", backgroundColor: "#f7f5ef", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10 }, eyebrow: { color: "#2d8d62", fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, headerTitle: { color: "#172126", fontSize: 24, fontWeight: "800", letterSpacing: -0.7, marginTop: 2 }, headerActions: { alignItems: "center", flexDirection: "row", gap: 8 }, account: { alignItems: "center", backgroundColor: "#172126", borderRadius: 20, height: 38, justifyContent: "center", width: 38 }, accountText: { color: "#fff", fontSize: 15, fontWeight: "900" }, adminShortcut: { alignItems: "center", backgroundColor: "#fff4d8", borderColor: "#ead49b", borderRadius: 14, borderWidth: 1, height: 34, justifyContent: "center", width: 34 }, iconPressed: { opacity: 0.72, transform: [{ scale: 0.94 }] }, signIn: { backgroundColor: "#172126", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, signInText: { color: "#fff", fontSize: 13, fontWeight: "800" }, body: { flex: 1, padding: 20 }, heroTitle: { color: "#172126", fontFamily: "serif", fontSize: 31, fontWeight: "800", letterSpacing: -1, lineHeight: 35, maxWidth: 310 }, heroCopy: { color: "#59686a", fontSize: 15, lineHeight: 22, marginTop: 13 }, primaryAction: { alignItems: "center", backgroundColor: "#172126", borderRadius: 13, marginTop: 21, paddingVertical: 14 }, primaryActionText: { color: "#fff", fontSize: 14, fontWeight: "900" }, statusCard: { backgroundColor: "#e5f1e7", borderColor: "#c8dfcd", borderRadius: 18, borderWidth: 1, marginTop: 24, padding: 18 }, statusTitle: { color: "#176447", fontSize: 15, fontWeight: "900" }, statusCopy: { color: "#3e6650", fontSize: 13, lineHeight: 20, marginTop: 6 }, tabs: { alignItems: "center", backgroundColor: "#fff", borderTopColor: "#dfe4db", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", paddingBottom: 10, paddingTop: 8 }, tab: { alignItems: "center", borderRadius: 12, minWidth: 56, paddingHorizontal: 5, paddingVertical: 6 }, tabActive: { backgroundColor: "#e5f1e7" }, tabPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] }, tabText: { color: "#718082", fontSize: 9, fontWeight: "800", marginTop: 2 }, tabTextActive: { color: "#176447" } });
