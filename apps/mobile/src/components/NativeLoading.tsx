import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

type Props = { label?: string; compact?: boolean };

export function NativeLoading({ label = "Loading BridgeX…", compact = false }: Props) {
  const route = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const journey = Animated.loop(Animated.sequence([
      Animated.timing(route, { toValue: 1, duration: 1350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(route, { toValue: 0, duration: 1350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const luggage = Animated.loop(Animated.sequence([
      Animated.timing(lift, { toValue: -5, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    journey.start();
    luggage.start();
    return () => { journey.stop(); luggage.stop(); };
  }, [lift, route]);

  return <View style={[styles.wrap, compact && styles.compact]} accessibilityRole="progressbar" accessibilityLabel={label}>
    <View style={styles.scene}>
      <View style={styles.route}><Animated.View style={[styles.plane, { transform: [{ translateX: route.interpolate({ inputRange: [0, 1], outputRange: [-47, 47] }) }] }]}><Text style={styles.planeText}>✈</Text></Animated.View></View>
      <Animated.View style={[styles.luggage, { transform: [{ translateY: lift }] }]}><Text style={styles.luggageText}>▣</Text></Animated.View>
    </View>
    <Text style={styles.brand}>BRIDGEX</Text>
    <Text style={styles.label}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 7, justifyContent: "center", padding: 24 },
  compact: { minHeight: 175 },
  scene: { alignItems: "center", height: 58, justifyContent: "center", width: 136 },
  route: { backgroundColor: "#d7ebe0", borderRadius: 999, height: 3, overflow: "hidden", width: 116 },
  plane: { alignItems: "center", height: 30, justifyContent: "center", position: "absolute", top: -24, width: 30 },
  planeText: { color: "#2d8d62", fontSize: 25 },
  luggage: { alignItems: "center", backgroundColor: "#172126", borderRadius: 7, bottom: 0, height: 24, justifyContent: "center", position: "absolute", width: 29 },
  luggageText: { color: "#a8e5c3", fontSize: 16, fontWeight: "900", marginTop: -1 },
  brand: { color: "#2d8d62", fontSize: 10, fontWeight: "900", letterSpacing: 2.2 },
  label: { color: "#59686a", fontSize: 13, fontWeight: "800" },
});
