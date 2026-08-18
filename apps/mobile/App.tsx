import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const DEFAULT_BRIDGEX_URL = "https://bridgex-q2h5.onrender.com/access";
const configuredBridgeXUrl = process.env.EXPO_PUBLIC_BRIDGEX_URL?.trim();
const BRIDGEX_URL = configuredBridgeXUrl && /^https:\/\/[a-z0-9.-]+/i.test(configuredBridgeXUrl)
  ? configuredBridgeXUrl
  : DEFAULT_BRIDGEX_URL;

export default function App() {
  const webView = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retry = () => { setError(null); setLoading(true); webView.current?.reload(); };

  return <View style={styles.container}>
    <StatusBar style="dark" backgroundColor="#f7f5ef" translucent={false} />
    <WebView
      ref={webView}
      source={{ uri: BRIDGEX_URL }}
      style={styles.webView}
      onLoadStart={() => { setLoading(true); setError(null); }}
      onLoadEnd={() => setLoading(false)}
      onError={event => { setLoading(false); setError(String(event.nativeEvent.code)); }}
      javaScriptEnabled
      domStorageEnabled
      geolocationEnabled
      allowsBackForwardNavigationGestures
      mediaPlaybackRequiresUserAction
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      setSupportMultipleWindows={false}
      originWhitelist={["https://*", "http://*"]}
    />
    {loading && !error && <View style={styles.loading}><ActivityIndicator color="#2d8d62" /><Text style={styles.loadingText}>Loading BridgeX…</Text></View>}
    {error && <View style={styles.error}><Text style={styles.errorTitle}>Connection unavailable</Text><Text style={styles.errorCopy}>BridgeX could not load the marketplace. Check your internet connection, then try again.</Text><Pressable onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>Reload BridgeX</Text></Pressable></View>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5ef" },
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
