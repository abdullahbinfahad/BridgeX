import { StyleSheet, Text, View } from "react-native";

export function OfflineBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <View style={styles.banner}><Text style={styles.text}>Offline mode · showing safely cached BridgeX information</Text></View>;
}

const styles = StyleSheet.create({ banner: { alignItems: "center", backgroundColor: "#8a6613", paddingHorizontal: 14, paddingVertical: 7 }, text: { color: "#fff9e8", fontSize: 12, fontWeight: "800", textAlign: "center" } });
