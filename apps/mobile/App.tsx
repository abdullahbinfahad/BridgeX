import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const BRIDGEX_URL = "https://bridgex.abdullahbinfahad.info/marketplace";
const SUPABASE_URL = "https://cyvaajdozstfltulnghp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Fe6enUGU2YKo3sgke3RvWw_ONg9eqhZ";
const ONE_CENTIMETER_DP = 160 / 2.54;

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });
type BridgeXAuthMessage = { type: "BRIDGEX_AUTH"; userId: string; accessToken: string };

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("bridgex-updates", { name: "BridgeX updates", importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], lightColor: "#2d8d62" });
  const existing = await Notifications.getPermissionsAsync(); let status = existing.status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") throw new Error("Notification permission was not granted.");
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("The BridgeX Expo project ID is unavailable.");
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

async function saveDeviceToken(message: BridgeXAuthMessage) {
  const token = await registerForPushNotificationsAsync();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/device_push_tokens?on_conflict=expo_push_token`, { method: "POST", headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${message.accessToken}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: message.userId, expo_push_token: token, platform: "android", active: true, updated_at: new Date().toISOString() }) });
  if (!response.ok) throw new Error(`Device registration failed (${response.status}).`);
}

export default function App() {
  const webView = useRef<WebView>(null); const registeredUsers = useRef(new Set<string>()); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [pushStatus, setPushStatus] = useState("");
  const retry = () => { setError(null); setLoading(true); webView.current?.reload(); };
  useEffect(() => { const responseListener = Notifications.addNotificationResponseReceivedListener(() => webView.current?.reload()); return () => responseListener.remove(); }, []);
  const onMessage = (raw: string) => { try { const message = JSON.parse(raw) as BridgeXAuthMessage; if (message.type !== "BRIDGEX_AUTH" || !message.userId || !message.accessToken || registeredUsers.current.has(message.userId)) return; registeredUsers.current.add(message.userId); void saveDeviceToken(message).then(() => setPushStatus("Updates are enabled on this phone.")).catch(error => { registeredUsers.current.delete(message.userId); setPushStatus(error instanceof Error ? error.message : "Updates could not be enabled yet."); }); } catch { /* Ignore non-BridgeX messages. */ } };
  return <View style={styles.container}><StatusBar style="dark" /><View style={styles.topSpacer} /><WebView ref={webView} source={{ uri: BRIDGEX_URL }} style={styles.webView} onLoadStart={() => { setLoading(true); setError(null); }} onLoadEnd={() => setLoading(false)} onMessage={event => onMessage(event.nativeEvent.data)} onError={(event) => { setLoading(false); setError(event.nativeEvent.description || `Error ${event.nativeEvent.code}`); }} onHttpError={(event) => { if (event.nativeEvent.statusCode >= 500) { setLoading(false); setError(`The service returned ${event.nativeEvent.statusCode}. Please retry.`); } }} javaScriptEnabled domStorageEnabled geolocationEnabled allowsBackForwardNavigationGestures mediaPlaybackRequiresUserAction sharedCookiesEnabled thirdPartyCookiesEnabled cacheEnabled cacheMode="LOAD_DEFAULT" setSupportMultipleWindows={false} originWhitelist={["https://*", "http://*"]} />{loading && !error && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color="#2d8d62" /><Text style={styles.loadingText}>Loading BridgeX…</Text></View>}{error && <View style={styles.error}><Text style={styles.errorTitle}>Connection unavailable</Text><Text style={styles.errorCopy}>BridgeX could not open this page. Check your internet connection and try again.</Text><Text style={styles.errorCode}>{error}</Text><Pressable onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>Retry</Text></Pressable></View>}{pushStatus ? <View style={styles.pushStatus}><Text style={styles.pushStatusText}>{pushStatus}</Text></View> : null}</View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#ffffff" }, topSpacer: { backgroundColor: "#ffffff", height: ONE_CENTIMETER_DP }, webView: { flex: 1, backgroundColor: "#f7f5ef" }, loading: { alignItems: "center", backgroundColor: "rgba(247,245,239,0.82)", bottom: 0, gap: 10, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 }, loadingText: { color: "#526063", fontSize: 13, fontWeight: "700" }, error: { alignItems: "center", backgroundColor: "#f7f5ef", bottom: 0, gap: 12, justifyContent: "center", left: 0, padding: 28, position: "absolute", right: 0, top: 0 }, errorTitle: { color: "#172126", fontSize: 21, fontWeight: "800" }, errorCopy: { color: "#647174", fontSize: 14, lineHeight: 21, maxWidth: 300, textAlign: "center" }, errorCode: { color: "#8c6860", fontSize: 11, maxWidth: 300, textAlign: "center" }, retry: { backgroundColor: "#172126", borderRadius: 12, marginTop: 4, paddingHorizontal: 18, paddingVertical: 12 }, retryText: { color: "#f7f5ef", fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] }, pushStatus: { backgroundColor: "rgba(23,33,38,0.94)", bottom: 16, left: 16, paddingHorizontal: 12, paddingVertical: 9, position: "absolute", right: 16 }, pushStatusText: { color: "#f7f5ef", fontSize: 12, fontWeight: "700", textAlign: "center" } });
