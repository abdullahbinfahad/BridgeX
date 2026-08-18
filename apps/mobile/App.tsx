import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const DEFAULT_BRIDGEX_URL = "https://bridgex.abdullahbinfahad.info/marketplace?guest=1";
// Android dp uses a 160-dpi baseline: 160 / 2.54 is approximately one physical centimetre.
const ONE_CENTIMETER_DP = 160 / 2.54;
// A fixed public marketplace URL prevents an old build-time environment value from reopening the access page and trapping guests in onboarding.
const BRIDGEX_URL = DEFAULT_BRIDGEX_URL;

function toGuestMarketplaceUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.pathname = "/marketplace";
    parsed.search = "?guest=1";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return DEFAULT_BRIDGEX_URL;
  }
}

export default function App() {
  const webView = useRef<WebView>(null);
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [webUri, setWebUri] = useState(BRIDGEX_URL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingGuestFallback, setUsingGuestFallback] = useState(BRIDGEX_URL === DEFAULT_BRIDGEX_URL);
  const guestFallbackUrl = useMemo(() => toGuestMarketplaceUrl(BRIDGEX_URL), []);

  const clearLoadingTimeout = () => {
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
      loadingTimeout.current = null;
    }
  };

  const finishLoading = () => {
    clearLoadingTimeout();
    setLoading(false);
  };

  const retry = () => {
    setError(null);
    setLoading(true);
    setUsingGuestFallback(true);
    setWebUri(`${guestFallbackUrl}&retry=${Date.now()}`);
  };

  useEffect(() => () => clearLoadingTimeout(), []);

  return <View style={styles.container}>
    <StatusBar style="dark" />
    <View style={styles.topSpacer} />
    <WebView
      key={webUri}
      ref={webView}
      source={{ uri: webUri }}
      style={styles.webView}
      onLoadStart={() => {
        clearLoadingTimeout();
        setLoading(true);
        setError(null);
        loadingTimeout.current = setTimeout(finishLoading, 1500);
      }}
      onLoadEnd={finishLoading}
      onLoadProgress={(event) => {
        if (event.nativeEvent.progress >= 0.12) finishLoading();
      }}
      onError={(event) => {
        clearLoadingTimeout();
        if (!webUri.startsWith(guestFallbackUrl)) {
          setUsingGuestFallback(true);
          setWebUri(guestFallbackUrl);
          return;
        }
        setLoading(false);
        setError(String(event.nativeEvent.code));
      }}
      javaScriptEnabled
      domStorageEnabled
      geolocationEnabled
      allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      cacheEnabled
      cacheMode="LOAD_DEFAULT"
      setSupportMultipleWindows={false}
      originWhitelist={["https://*", "http://*"]}
    />
    {loading && !error && <View style={styles.loading}><ActivityIndicator color="#2d8d62" /><Text style={styles.loadingText}>{usingGuestFallback ? "Opening BridgeX marketplace…" : "Loading BridgeX…"}</Text></View>}
    {error && <View style={styles.error}><Text style={styles.errorTitle}>Connection unavailable</Text><Text style={styles.errorCopy}>BridgeX could not load the marketplace. Check your internet connection, then try again.</Text><Pressable onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>Open guest marketplace</Text></Pressable></View>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  topSpacer: { backgroundColor: "#ffffff", height: ONE_CENTIMETER_DP },
  webView: { flex: 1, backgroundColor: "#f7f5ef" },
  loading: { alignItems: "center", backgroundColor: "rgba(247,245,239,0.95)", bottom: 0, gap: 10, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 },
  loadingText: { color: "#526063", fontSize: 13, fontWeight: "700" },
  error: { alignItems: "center", backgroundColor: "#f7f5ef", bottom: 0, gap: 12, justifyContent: "center", left: 0, padding: 28, position: "absolute", right: 0, top: 0 },
  errorTitle: { color: "#172126", fontSize: 21, fontWeight: "800" },
  errorCopy: { color: "#647174", fontSize: 14, lineHeight: 21, maxWidth: 300, textAlign: "center" },
  retry: { backgroundColor: "#172126", borderRadius: 12, marginTop: 4, paddingHorizontal: 18, paddingVertical: 12 },
  retryText: { color: "#f7f5ef", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
