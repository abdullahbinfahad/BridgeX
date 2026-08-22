import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BRIDGEX_DEEP_LINK } from "../config";
import { supabase } from "../lib/supabase";

type Props = { onGuest: () => void };
type Mode = "sign-in" | "sign-up" | "reset";

function readTokens(url: string) {
  const query = url.includes("#") ? url.slice(url.indexOf("#") + 1) : url.slice(url.indexOf("?") + 1);
  const values = new URLSearchParams(query);
  const access_token = values.get("access_token");
  const refresh_token = values.get("refresh_token");
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

export function AuthScreen({ onGuest }: Props) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try { await work(); } catch (error: any) { Alert.alert("BridgeX", error?.message || "We could not complete that action. Please try again."); } finally { setBusy(false); }
  };

  const signIn = () => run(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  });

  const signUp = () => run(async () => {
    if (name.trim().length < 2) throw new Error("Enter your full name to create a BridgeX account.");
    const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: BRIDGEX_DEEP_LINK } });
    if (error) throw error;
    Alert.alert("Check your email", "Confirm your email address, then return to BridgeX to sign in securely.");
    setMode("sign-in");
  });

  const resetPassword = () => run(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: BRIDGEX_DEEP_LINK });
    if (error) throw error;
    Alert.alert("Reset email sent", "Open the secure link in your email, then return to BridgeX to choose a new password.");
  });

  const signInWithGoogle = () => run(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: BRIDGEX_DEEP_LINK, skipBrowserRedirect: true } });
    if (error || !data.url) throw error || new Error("Google sign-in could not start.");
    const result = await WebBrowser.openAuthSessionAsync(data.url, BRIDGEX_DEEP_LINK);
    if (result.type !== "success") return;
    const tokens = readTokens(result.url);
    if (!tokens) throw new Error("Google sign-in finished without a secure session. Check that the BridgeX mobile redirect URL is allowed in Supabase Auth.");
    const { error: sessionError } = await supabase.auth.setSession(tokens);
    if (sessionError) throw sessionError;
  });

  const title = mode === "sign-up" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome to BridgeX";
  const action = mode === "sign-up" ? "Create account" : mode === "reset" ? "Send reset email" : "Sign in";
  const submit = mode === "sign-up" ? signUp : mode === "reset" ? resetPassword : signIn;

  const fieldProps = { placeholderTextColor: "#657377", selectionColor: "#2d8d62" };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0} style={styles.page}><ScrollView contentContainerStyle={styles.authScroll} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={styles.hero}><Text style={styles.eyebrow}>BRIDGEX</Text><Text style={styles.brand}>Post it.{"\n"}Match it.{"\n"}Carry it safely.</Text><Text style={styles.heroCopy}>A native marketplace for lawful goods-carrying requests and available travel capacity.</Text></View><View style={styles.panel}><Text style={styles.title}>{title}</Text><Text style={styles.copy}>{mode === "sign-up" ? "Use an email address you can verify. Your account stays active while identity review is optional." : mode === "reset" ? "We will email a secure reset link to your registered address." : "Use your BridgeX email and password, or continue securely with Google."}</Text>{mode === "sign-up" && <TextInput {...fieldProps} style={styles.input} placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" />}<TextInput {...fieldProps} style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" returnKeyType={mode === "reset" ? "done" : "next"} />{mode !== "reset" && <TextInput {...fieldProps} style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType={mode === "sign-up" ? "newPassword" : "password"} returnKeyType="done" onSubmitEditing={() => void submit()} />}<Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{action}</Text>}</Pressable>{mode !== "reset" && <Pressable disabled={busy} onPress={signInWithGoogle} style={({ pressed }) => [styles.google, (pressed || busy) && styles.pressed]}><Text style={styles.googleText}>Continue with Google</Text></Pressable>}<View style={styles.links}>{mode !== "sign-in" && <Pressable onPress={() => setMode("sign-in")}><Text style={styles.link}>Already have an account? Sign in</Text></Pressable>}{mode === "sign-in" && <><Pressable onPress={() => setMode("sign-up")}><Text style={styles.link}>Create an account</Text></Pressable><Pressable onPress={() => setMode("reset")}><Text style={styles.link}>Forgot password?</Text></Pressable></>}</View><Pressable onPress={onGuest} style={styles.guest}><Text style={styles.guestText}>Browse marketplace as a guest</Text></Pressable></View></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#f7f5ef" }, authScroll: { flexGrow: 1, paddingBottom: 28 }, hero: { backgroundColor: "#172126", flex: 0.42, justifyContent: "flex-end", minHeight: 278, padding: 28, paddingBottom: 34 }, eyebrow: { color: "#a8e5c3", fontSize: 11, fontWeight: "800", letterSpacing: 2.2 }, brand: { color: "#f7f5ef", fontFamily: "serif", fontSize: 38, fontWeight: "800", letterSpacing: -1.5, lineHeight: 40, marginTop: 11 }, heroCopy: { color: "#c6d4ce", fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 330 }, panel: { flex: 0.58, justifyContent: "center", padding: 24 }, title: { color: "#172126", fontSize: 27, fontWeight: "800", letterSpacing: -0.7 }, copy: { color: "#617073", fontSize: 13, lineHeight: 20, marginBottom: 18, marginTop: 8 }, input: { backgroundColor: "#ffffff", borderColor: "#b6c3b7", borderRadius: 13, borderWidth: 1, color: "#172126", fontSize: 15, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 13 }, primary: { alignItems: "center", backgroundColor: "#2d8d62", borderRadius: 13, justifyContent: "center", marginTop: 4, minHeight: 50 }, primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" }, google: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d6ddd4", borderRadius: 13, borderWidth: 1, justifyContent: "center", marginTop: 10, minHeight: 50 }, googleText: { color: "#172126", fontSize: 15, fontWeight: "800" }, links: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center", marginTop: 16 }, link: { color: "#247b55", fontSize: 13, fontWeight: "800" }, guest: { alignItems: "center", paddingVertical: 17 }, guestText: { color: "#657377", fontSize: 13, fontWeight: "700", textDecorationLine: "underline" }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] } });
