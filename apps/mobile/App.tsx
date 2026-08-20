import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, BackHandler, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const BRIDGEX_ORIGIN = "https://bridgex.abdullahbinfahad.info";
const BRIDGEX_URL = `${BRIDGEX_ORIGIN}/?app=android&build=9`;
const SUPABASE_URL = "https://cyvaajdozstfltulnghp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Fe6enUGU2YKo3sgke3RvWw_ONg9eqhZ";
const HALF_CENTIMETER_DP = 160 / 2.54 / 2;
const LOADING_FAILSAFE_MS = 1800;
const WEB_STATE_KEY = "bridgex-webview-state-v3";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });

type BridgeXAuthMessage = { type: "BRIDGEX_AUTH"; userId: string; accessToken: string };
type BridgeXFeedbackMessage = { type: "BRIDGEX_FEEDBACK"; kind?: "tap" | "notice" | "success" | "warning" | "error" };
type BridgeXReadyMessage = { type: "BRIDGEX_READY" };
type BridgeXWebStateMessage = { type: "BRIDGEX_WEB_STATE"; url?: string; draft?: Record<string, string>; savedAt?: number };
type BridgeXWebMessage = BridgeXAuthMessage | BridgeXFeedbackMessage | BridgeXReadyMessage | BridgeXWebStateMessage;
type SavedWebState = { url: string; draft: Record<string, string>; savedAt: number };

const isBridgeXUrl = (url?: string) => Boolean(url && (url === BRIDGEX_ORIGIN || url.startsWith(`${BRIDGEX_ORIGIN}/`)));

const MOBILE_COMPATIBILITY_BRIDGE = `
  (function () {
    document.documentElement.dataset.bridgexAndroidWrapper = 'true';
    try { window.sessionStorage.setItem('bridgex-android-wrapper', 'true'); } catch (_) {}
    var hideBridgeXBack = function () {
      var style = document.getElementById('bridgex-android-back-control-style');
      if (!style) { style = document.createElement('style'); style.id = 'bridgex-android-back-control-style'; style.textContent = '.bridgex-global-back{display:none!important;visibility:hidden!important;pointer-events:none!important;}'; (document.head || document.documentElement).appendChild(style); }
      var control = document.querySelector('.bridgex-global-back');
      if (control) { control.setAttribute('aria-hidden', 'true'); control.style.display = 'none'; }
    };
    hideBridgeXBack();
    document.addEventListener('DOMContentLoaded', hideBridgeXBack);
    window.setInterval(hideBridgeXBack, 500);
    if (window.__bridgexMobileCompatibilityLoaded) return;
    window.__bridgexMobileCompatibilityLoaded = true;
    var timer = null;
    var sensitive = /password|passport|national|nid|identity|document/i;
    var inputs = function () { return Array.prototype.slice.call(document.querySelectorAll('input, textarea, select')); };
    var keyFor = function (element, index) { return [element.tagName, element.name || '', element.id || '', element.placeholder || '', index].join('|'); };
    var isDraftable = function (element) {
      var type = (element.type || '').toLowerCase();
      var hint = [element.name || '', element.id || '', element.placeholder || ''].join(' ');
      return type !== 'password' && type !== 'file' && !sensitive.test(hint);
    };
    var scrollFocusedInputIntoView = function () {
      var element = document.activeElement;
      if (!element || !/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)) return;
      window.setTimeout(function () { element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); }, 120);
    };
    var sendState = function () {
      var draft = {};
      inputs().forEach(function (element, index) {
        if (!isDraftable(element)) return;
        var value = String(element.value || '');
        if (value) draft[keyFor(element, index)] = value.slice(0, 4000);
      });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BRIDGEX_WEB_STATE', url: window.location.href, draft: draft, savedAt: Date.now() }));
    };
    var scheduleState = function () { window.clearTimeout(timer); timer = window.setTimeout(sendState, 450); };
    window.__bridgexRestoreDraft = function (snapshot) {
      if (!snapshot || snapshot.url !== window.location.href || !snapshot.draft) return;
      window.setTimeout(function () {
        inputs().forEach(function (element, index) {
          if (!isDraftable(element)) return;
          var value = snapshot.draft[keyFor(element, index)];
          if (typeof value !== 'string' || element.value === value) return;
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }, 180);
    };
    document.addEventListener('focusin', scrollFocusedInputIntoView, true);
    document.addEventListener('input', scheduleState, true);
    document.addEventListener('change', scheduleState, true);
    document.addEventListener('submit', sendState, true);
    window.addEventListener('beforeunload', sendState);
    window.addEventListener('popstate', sendState);
    window.addEventListener('resize', scrollFocusedInputIntoView);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', scrollFocusedInputIntoView);
    document.addEventListener('DOMContentLoaded', function () { sendState(); });
    window.setInterval(sendState, 8000);
  })();
  true;
`;

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("bridgex-updates", { name: "BridgeX updates", importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], lightColor: "#2d8d62" });
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.status === "granted" ? existing.status : (await Notifications.requestPermissionsAsync()).status;
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

function playNativeFeedback(kind: BridgeXFeedbackMessage["kind"]) {
  if (kind === "success") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (kind === "error") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  if (kind === "warning") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  return Haptics.impactAsync(kind === "notice" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
}

export default function App() {
  const webView = useRef<WebView>(null);
  const registeredUsers = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestWebState = useRef<SavedWebState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState("");
  const [restoring, setRestoring] = useState(true);
  const [initialUrl, setInitialUrl] = useState(BRIDGEX_URL);
  const [canGoBack, setCanGoBack] = useState(false);

  const finishLoading = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; setLoading(false); };
  const beginLoading = () => { setError(null); setLoading(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(finishLoading, LOADING_FAILSAFE_MS); };
  const retry = () => { beginLoading(); webView.current?.reload(); };
  const persistSnapshot = (snapshot: SavedWebState, immediately = false) => {
    latestWebState.current = snapshot;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    if (immediately) { void AsyncStorage.setItem(WEB_STATE_KEY, JSON.stringify(snapshot)); return; }
    persistTimer.current = setTimeout(() => { void AsyncStorage.setItem(WEB_STATE_KEY, JSON.stringify(snapshot)); }, 350);
  };
  const restoreDraft = (snapshot = latestWebState.current) => {
    if (!snapshot || !isBridgeXUrl(snapshot.url)) return;
    webView.current?.injectJavaScript(`window.__bridgexRestoreDraft && window.__bridgexRestoreDraft(${JSON.stringify(snapshot)}); true;`);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(WEB_STATE_KEY);
        const saved = raw ? JSON.parse(raw) as SavedWebState : null;
        if (saved && isBridgeXUrl(saved.url) && saved.draft && typeof saved.draft === "object") {
          latestWebState.current = saved;
          if (active) setInitialUrl(saved.url);
        }
      } catch { /* A corrupt local snapshot should never block BridgeX from opening. */ }
      if (active) { setRestoring(false); beginLoading(); }
    })();
    const responseListener = Notifications.addNotificationResponseReceivedListener(() => restoreDraft());
    return () => { active = false; if (timer.current) clearTimeout(timer.current); if (persistTimer.current) clearTimeout(persistTimer.current); responseListener.remove(); };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState => {
      if (nextState === "active") { restoreDraft(); return; }
      if (latestWebState.current) persistSnapshot(latestWebState.current, true);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webView.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const onMessage = (raw: string) => {
    try {
      const message = JSON.parse(raw) as BridgeXWebMessage;
      if (message.type === "BRIDGEX_READY") return finishLoading();
      if (message.type === "BRIDGEX_FEEDBACK") { void playNativeFeedback(message.kind).catch(() => undefined); return; }
      if (message.type === "BRIDGEX_WEB_STATE") {
        if (isBridgeXUrl(message.url)) persistSnapshot({ url: message.url!, draft: message.draft ?? {}, savedAt: message.savedAt ?? Date.now() });
        return;
      }
      if (message.type !== "BRIDGEX_AUTH" || !message.userId || !message.accessToken || registeredUsers.current.has(message.userId)) return;
      registeredUsers.current.add(message.userId);
      void saveDeviceToken(message).then(() => setPushStatus("Updates are enabled on this phone.")).catch(() => { registeredUsers.current.delete(message.userId); });
    } catch { /* Ignore normal page messages. */ }
  };

  const onNavigation = (event: { url: string; canGoBack: boolean }) => {
    finishLoading();
    setCanGoBack(event.canGoBack);
    if (isBridgeXUrl(event.url)) persistSnapshot({ url: event.url, draft: latestWebState.current?.url === event.url ? latestWebState.current.draft : {}, savedAt: Date.now() });
  };

  return <View style={styles.container}><StatusBar style="dark" /><View style={styles.topSpacer} />{restoring ? <View style={styles.loading}><ActivityIndicator color="#2d8d62" /><Text style={styles.loadingText}>Restoring BridgeX…</Text></View> : <WebView ref={webView} source={{ uri: initialUrl }} userAgent="BridgeXAndroid/9" style={styles.webView} onLoadStart={beginLoading} onLoadProgress={event => { if (event.nativeEvent.progress >= 0.05) finishLoading(); }} onLoadEnd={event => { onNavigation(event.nativeEvent); restoreDraft(); }} onNavigationStateChange={onNavigation} onMessage={event => onMessage(event.nativeEvent.data)} onError={event => { finishLoading(); setError(event.nativeEvent.description || `Error ${event.nativeEvent.code}`); }} onHttpError={event => { if (event.nativeEvent.statusCode >= 400) { finishLoading(); setError(`The service returned ${event.nativeEvent.statusCode}.`); } }} injectedJavaScriptBeforeContentLoaded={`window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BRIDGEX_READY' })); true;`} injectedJavaScript={MOBILE_COMPATIBILITY_BRIDGE} javaScriptEnabled domStorageEnabled geolocationEnabled allowsBackForwardNavigationGestures mediaPlaybackRequiresUserAction sharedCookiesEnabled thirdPartyCookiesEnabled cacheEnabled cacheMode="LOAD_DEFAULT" setSupportMultipleWindows={false} androidLayerType="hardware" allowFileAccess allowFileAccessFromFileURLs allowUniversalAccessFromFileURLs originWhitelist={["https://*"]} />}{loading && !error && !restoring && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color="#2d8d62" /><Text style={styles.loadingText}>Opening BridgeX…</Text></View>}{error && <View style={styles.error}><Text style={styles.errorTitle}>Connection unavailable</Text><Text style={styles.errorCopy}>BridgeX could not open the public BridgeX homepage. Check your connection and try again.</Text><Text style={styles.errorCode}>{error}</Text><Pressable onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>Retry</Text></Pressable></View>}{pushStatus ? <View style={styles.pushStatus}><Text style={styles.pushStatusText}>{pushStatus}</Text></View> : null}</View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#f7f5ef" }, topSpacer: { backgroundColor: "#f7f5ef", height: HALF_CENTIMETER_DP }, webView: { flex: 1, backgroundColor: "#f7f5ef" }, loading: { alignItems: "center", backgroundColor: "rgba(247,245,239,0.82)", bottom: 0, gap: 10, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 }, loadingText: { color: "#526063", fontSize: 13, fontWeight: "700" }, error: { alignItems: "center", backgroundColor: "#f7f5ef", bottom: 0, gap: 12, justifyContent: "center", left: 0, padding: 28, position: "absolute", right: 0, top: 0 }, errorTitle: { color: "#172126", fontSize: 21, fontWeight: "800" }, errorCopy: { color: "#647174", fontSize: 14, lineHeight: 21, maxWidth: 300, textAlign: "center" }, errorCode: { color: "#8c6860", fontSize: 11, maxWidth: 300, textAlign: "center" }, retry: { backgroundColor: "#172126", borderRadius: 12, marginTop: 4, paddingHorizontal: 18, paddingVertical: 12 }, retryText: { color: "#f7f5ef", fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] }, pushStatus: { backgroundColor: "rgba(23,33,38,0.94)", bottom: 16, left: 16, paddingHorizontal: 12, paddingVertical: 9, position: "absolute", right: 16 }, pushStatusText: { color: "#f7f5ef", fontSize: 12, fontWeight: "700", textAlign: "center" } });
