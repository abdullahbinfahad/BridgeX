import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const DEFAULT_BRIDGEX_URL = "https://bridgexmp-fcp7rl7v.manus.space/access";
const configuredBridgeXUrl = process.env.EXPO_PUBLIC_BRIDGEX_URL?.trim();
const BRIDGEX_URL = configuredBridgeXUrl && /^https:\/\/[a-z0-9.-]+/i.test(configuredBridgeXUrl)
  ? configuredBridgeXUrl
  : DEFAULT_BRIDGEX_URL;

export default function App() {
  const webView = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  return <SafeAreaView style={styles.container}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <View><Text style={styles.brand}>BridgeX</Text><Text style={styles.caption}>Carry marketplace</Text></View>
      <View style={styles.actions}>
        <Pressable disabled={!canGoBack} onPress={() => webView.current?.goBack()} style={({ pressed }) => [styles.action, !canGoBack && styles.disabled, pressed && styles.pressed]}><Text style={styles.actionText}>Back</Text></Pressable>
        <Pressable onPress={() => webView.current?.reload()} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionText}>Refresh</Text></Pressable>
      </View>
    </View>
    <WebView
      ref={webView}
      source={{ uri: BRIDGEX_URL }}
      style={styles.webView}
      onLoadStart={() => setLoading(true)}
      onLoadEnd={() => setLoading(false)}
      onNavigationStateChange={state => setCanGoBack(state.canGoBack)}
      onError={() => Alert.alert("Connection unavailable", "BridgeX could not reach the marketplace service. Check your internet connection and try again.")}
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
    {loading && <View style={styles.loading}><ActivityIndicator color="#2d8d62" /><Text style={styles.loadingText}>Loading BridgeX…</Text></View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f5ef" },
  header: { alignItems: "center", backgroundColor: "#fffdf8", borderBottomColor: "#e2e3dc", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 10 },
  brand: { color: "#172126", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  caption: { color: "#647174", fontSize: 10, fontWeight: "600", marginTop: 1, textTransform: "uppercase" },
  actions: { flexDirection: "row", gap: 8 },
  action: { backgroundColor: "#e7f4ea", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  actionText: { color: "#176447", fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  webView: { flex: 1, backgroundColor: "#f7f5ef" },
  loading: { alignItems: "center", backgroundColor: "rgba(247,245,239,0.95)", bottom: 0, gap: 10, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 56 },
  loadingText: { color: "#526063", fontSize: 13, fontWeight: "700" },
});
