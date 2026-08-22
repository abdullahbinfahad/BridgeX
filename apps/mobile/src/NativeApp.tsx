import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Appearance, BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
import { WorkspaceRecordsScreen, type WorkspaceSection } from "./screens/WorkspaceRecordsScreen";
import { ManagePostsScreen } from "./screens/ManagePostsScreen";
import { WorkspaceResponsesScreen } from "./screens/WorkspaceResponsesScreen";
import type { PaymentFilter } from "./screens/PaymentsScreen";
import type { NativeNotificationDestination } from "./lib/api";
import { useBridgeXNotifications } from "./hooks/useBridgeXNotifications";
import { loadThemePreference, resolveBridgeXPalette, saveThemePreference, type BridgeXThemePreference } from "./lib/appearance";
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
  const [workspaceSection, setWorkspaceSection] = useState<WorkspaceSection>("active_orders");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("pending");
  const [openedPaymentId, setOpenedPaymentId] = useState<string | undefined>();
  const [themePreference, setThemePreference] = useState<BridgeXThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());
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
  const openWorkspaceSection = (section: WorkspaceSection) => { setWorkspaceSection(section); navigate("workspace_records"); };
  const openPaymentList = (filter: PaymentFilter) => { setOpenedPaymentId(undefined); setPaymentFilter(filter); navigate("payment_list"); };
  const openPaymentRecord = (paymentId: string) => { setPaymentFilter("pending"); setOpenedPaymentId(paymentId); navigate("payment_list"); };
  const openNotificationDestination = useCallback((destination: NativeNotificationDestination) => {
    if (destination.route === "workspace_records") { setWorkspaceSection(destination.section); navigate("workspace_records"); return; }
    if (destination.route === "payments" && destination.filter) { setPaymentFilter(destination.filter); navigate("payment_list"); return; }
    if (destination.route === "admin" && !isAdmin) { navigate("workspace"); return; }
    navigate(destination.route);
  }, [isAdmin]);
  const { counts: unreadCounts, refresh: refreshUnreadCounts } = useBridgeXNotifications(session?.user.id, openNotificationDestination);

  useEffect(() => {
    void loadThemePreference().then(setThemePreference);
    const subscription = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => goBack());
    return () => subscription.remove();
  });
  const updateTheme = (next: BridgeXThemePreference) => { setThemePreference(next); void saveThemePreference(next); };
  const palette = resolveBridgeXPalette(themePreference, systemScheme);

  if (loading) return <SafeAreaView style={[styles.loading, { backgroundColor: palette.background }]}><StatusBar style={palette.mode === "dark" ? "light" : "dark"} /><View style={[styles.topBlank, { backgroundColor: palette.background }]} /><NativeLoading label="Preparing BridgeX…" /></SafeAreaView>;
  if (!session && !guest) return <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}><StatusBar style={palette.mode === "dark" ? "light" : "dark"} /><View style={[styles.topBlank, { backgroundColor: palette.background }]} /><AuthScreen onGuest={() => setGuest(true)} /></SafeAreaView>;

  const displayName = profile?.full_name || session?.user.user_metadata?.full_name || session?.user.user_metadata?.name || "BridgeX member";
  const openPost = (post: MarketplacePost) => { setSelectedPost(post); navigate("post"); };
  const openInfo = (section: NativeInfoSection) => { setInfoSection(section); navigate("info"); };
  const content = route === "profile" ? session ? <ProfileScreen userId={session.user.id} profile={profile} themePreference={themePreference} onThemeChange={updateTheme} onSaved={() => void refreshProfile()} onSignOut={() => void signOut()} onOpenAdmin={() => navigate("admin")} /> : <SignedOutPrompt title="Sign in to manage your profile" copy="Guest browsing is open. Sign in to view or update your secure BridgeX account." onSignIn={() => setGuest(false)} /> : route === "admin" && session ? <AdminScreen role={profile?.role} /> : route === "notifications" ? session ? <NotificationsScreen userId={session.user.id} onOpenDestination={openNotificationDestination} onUnreadChange={refreshUnreadCounts} /> : <SignedOutPrompt title="Sign in to view your updates" copy="Personal notifications are private to your BridgeX account. Browse marketplace posts as a guest." onSignIn={() => setGuest(false)} /> : route === "payments" && session ? <PaymentsScreen userId={session.user.id} unreadCount={unreadCounts.payments} onOpenFilter={openPaymentList} /> : route === "payment_list" && session ? <PaymentsScreen userId={session.user.id} unreadCount={unreadCounts.payments} filter={paymentFilter} initialPaymentId={openedPaymentId} onBack={goBack} /> : route === "more" ? <MoreScreen signedIn={Boolean(session)} role={profile?.role} onProfile={() => session ? navigate("profile") : setGuest(false)} onPayments={() => session ? navigate("payments") : setGuest(false)} onAdmin={() => navigate("admin")} onInfo={openInfo} /> : route === "info" ? <InfoScreen section={infoSection} onBack={goBack} /> : route === "member" && selectedPost ? <MemberProfileScreen ownerId={selectedPost.ownerId} name={selectedPost.posterName} verified={selectedPost.posterVerified} rating={selectedPost.posterRating} reviewCount={selectedPost.posterReviewCount} onBack={goBack} onOpenPost={openPost} /> : route === "respond" && selectedPost && session ? <ResponseScreen post={selectedPost} userId={session.user.id} profile={profile} onBack={goBack} onSuccess={() => navigate("workspace")} onProfile={() => navigate("profile")} /> : route === "post" && selectedPost ? <PostDetailScreen post={selectedPost} signedIn={Boolean(session)} onBack={goBack} onRespond={() => session ? navigate("respond") : setGuest(false)} onOpenMember={() => navigate("member")} /> : route === "marketplace" || route === "home" ? <MarketplaceScreen onOpenPost={openPost} onCreateRequest={() => openComposer("request")} onCreateCarry={() => openComposer("carry")} /> : route === "create" ? session ? <ComposeScreen userId={session.user.id} initialMode={composeMode} defaultCurrency={profile?.preferred_currency || "BDT"} onPublished={() => navigate("marketplace")} /> : <SignedOutPrompt title="Sign in before posting" copy="Guest browsing is open. Sign in to create a protected request or carry-space listing." onSignIn={() => setGuest(false)} /> : route === "workspace" ? session ? <WorkspaceScreen userId={session.user.id} unreadCount={unreadCounts.workspace} onBrowseMarketplace={() => navigate("marketplace")} onOpenMessages={() => navigate("messages")} onOpenSection={openWorkspaceSection} onManagePosts={() => navigate("manage_posts")} onOpenResponses={() => navigate("workspace_responses")} /> : <SignedOutPrompt title="Sign in to open your workspace" copy="Your posts, offers, protected orders, and payment activity are private to your BridgeX account." onSignIn={() => setGuest(false)} /> : route === "workspace_records" && session ? <WorkspaceRecordsScreen userId={session.user.id} section={workspaceSection} onBack={goBack} onOpenMessages={() => navigate("messages")} onManagePosts={() => navigate("manage_posts")} onOpenResponses={() => navigate("workspace_responses")} /> : route === "manage_posts" && session ? <ManagePostsScreen userId={session.user.id} onBack={goBack} /> : route === "workspace_responses" && session ? <WorkspaceResponsesScreen userId={session.user.id} onBack={goBack} onPaymentStarted={openPaymentRecord} /> : route === "messages" ? session ? <MessagesScreen userId={session.user.id} /> : <SignedOutPrompt title="Sign in to access protected messages" copy="Only matched members and authorized administrators can access protected BridgeX deal conversations." onSignIn={() => setGuest(false)} /> : <SignedOutPrompt title="Sign in to continue" copy="Marketplace browsing is available to guests. Private BridgeX account areas require a secure sign-in." onSignIn={() => setGuest(false)} />;

  const hideTabs = ["post", "respond", "profile", "member", "info", "admin", "create", "workspace_records", "manage_posts", "workspace_responses", "payment_list"].includes(route);
  const headerTitle = route === "post" ? "Post details" : route === "marketplace" ? "Marketplace" : route === "notifications" ? "Updates" : route === "workspace_records" || route === "manage_posts" || route === "workspace_responses" ? "Workspace" : route === "payment_list" ? "Payments" : route === "more" ? "More" : route === "info" ? "BridgeX" : route[0].toUpperCase() + route.slice(1);
  const badgeFor = (tab: typeof tabs[number]["route"]) => tab === "notifications" ? unreadCounts.updates : tab === "messages" ? unreadCounts.messages : tab === "workspace" ? unreadCounts.workspace : tab === "more" ? unreadCounts.more : 0;
  return <GestureHandlerRootView style={styles.gestureRoot}><SafeAreaView style={[styles.root, { backgroundColor: palette.background }]}><StatusBar style={palette.mode === "dark" ? "light" : "dark"} /><View style={[styles.topBlank, { backgroundColor: palette.background }]} /><OfflineBanner visible={!online} /><View style={[styles.header, { backgroundColor: palette.background }]}><View><View style={styles.brandRow}><Text style={styles.eyebrow}>BRIDGEX</Text>{unreadCounts.updates > 0 ? <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCounts.updates}</Text></View> : null}</View><Text style={styles.headerTitle}>{headerTitle}</Text></View><View style={styles.headerActions}>{isAdmin ? <Pressable accessibilityLabel="Open administrator control" onPress={() => tap("admin")} style={({ pressed }) => [styles.adminShortcut, pressed && styles.iconPressed]}><Ionicons name="shield-checkmark-outline" size={19} color="#9a6c0e" /></Pressable> : null}{session ? <Pressable accessibilityLabel="Open profile" onPress={() => tap("profile")} style={({ pressed }) => [styles.account, pressed && styles.iconPressed]}><Text style={styles.accountText}>{String(displayName).slice(0, 1).toUpperCase()}</Text></Pressable> : <Pressable onPress={() => setGuest(false)} style={styles.signIn}><Text style={styles.signInText}>Sign in</Text></Pressable>}</View></View>{content}{!hideTabs ? <View style={[styles.tabs, { backgroundColor: palette.mode === "dark" ? "#211f35" : "#fff", borderTopColor: palette.border }]}>{tabs.map(tab => { const badge = badgeFor(tab.route); return <Pressable key={tab.route} onPress={() => tap(tab.route)} style={({ pressed }) => [styles.tab, route === tab.route && styles.tabActive, pressed && styles.tabPressed]}><View style={styles.tabIconWrap}><Ionicons name={tab.icon} size={20} color={route === tab.route ? "#176447" : "#718082"} />{badge > 0 ? <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{badge}</Text></View> : null}</View><Text style={[styles.tabText, route === tab.route && styles.tabTextActive]}>{tab.label}</Text></Pressable>; })}</View> : null}</SafeAreaView></GestureHandlerRootView>;
}

function SignedOutPrompt({ title, copy, onSignIn }: { title: string; copy: string; onSignIn: () => void }) { return <View style={styles.body}><Text style={styles.heroTitle}>{title}</Text><Text style={styles.heroCopy}>{copy}</Text><Pressable onPress={onSignIn} style={styles.primaryAction}><Text style={styles.primaryActionText}>Sign in or create account</Text></Pressable></View>; }

const styles = StyleSheet.create({ gestureRoot: { flex: 1 }, root: { flex: 1, backgroundColor: "#f7f5ef" }, loading: { backgroundColor: "#f7f5ef", flex: 1 }, topBlank: { backgroundColor: "#f7f5ef", height: 18 }, header: { alignItems: "center", backgroundColor: "#f7f5ef", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10 }, brandRow: { alignItems: "center", flexDirection: "row", gap: 6 }, eyebrow: { color: "#2d8d62", fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, headerBadge: { alignItems: "center", backgroundColor: "#c94d3d", borderRadius: 9, justifyContent: "center", minWidth: 18, paddingHorizontal: 4, paddingVertical: 1 }, headerBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" }, headerTitle: { color: "#172126", fontSize: 24, fontWeight: "800", letterSpacing: -0.7, marginTop: 2 }, headerActions: { alignItems: "center", flexDirection: "row", gap: 8 }, account: { alignItems: "center", backgroundColor: "#172126", borderRadius: 20, height: 38, justifyContent: "center", width: 38 }, accountText: { color: "#fff", fontSize: 15, fontWeight: "900" }, adminShortcut: { alignItems: "center", backgroundColor: "#fff4d8", borderColor: "#ead49b", borderRadius: 14, borderWidth: 1, height: 34, justifyContent: "center", width: 34 }, iconPressed: { opacity: 0.72, transform: [{ scale: 0.94 }] }, signIn: { backgroundColor: "#172126", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, signInText: { color: "#fff", fontSize: 13, fontWeight: "800" }, body: { flex: 1, padding: 20 }, heroTitle: { color: "#172126", fontFamily: "serif", fontSize: 31, fontWeight: "800", letterSpacing: -1, lineHeight: 35, maxWidth: 310 }, heroCopy: { color: "#59686a", fontSize: 15, lineHeight: 22, marginTop: 13 }, primaryAction: { alignItems: "center", backgroundColor: "#172126", borderRadius: 13, marginTop: 21, paddingVertical: 14 }, primaryActionText: { color: "#fff", fontSize: 14, fontWeight: "900" }, statusCard: { backgroundColor: "#e5f1e7", borderColor: "#c8dfcd", borderRadius: 18, borderWidth: 1, marginTop: 24, padding: 18 }, statusTitle: { color: "#176447", fontSize: 15, fontWeight: "900" }, statusCopy: { color: "#3e6650", fontSize: 13, lineHeight: 20, marginTop: 6 }, tabs: { alignItems: "center", backgroundColor: "#fff", borderTopColor: "#dfe4db", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", paddingBottom: 10, paddingTop: 8 }, tab: { alignItems: "center", borderRadius: 12, minWidth: 56, paddingHorizontal: 5, paddingVertical: 6 }, tabActive: { backgroundColor: "#e5f1e7" }, tabPressed: { opacity: 0.72, transform: [{ scale: 0.96 }] }, tabIconWrap: { position: "relative" }, tabBadge: { alignItems: "center", backgroundColor: "#c94d3d", borderColor: "#fff", borderRadius: 10, borderWidth: 1, justifyContent: "center", minWidth: 17, paddingHorizontal: 3, paddingVertical: 1, position: "absolute", right: -13, top: -8 }, tabBadgeText: { color: "#fff", fontSize: 8, fontWeight: "900" }, tabText: { color: "#718082", fontSize: 9, fontWeight: "800", marginTop: 2 }, tabTextActive: { color: "#176447" } });
