import * as WebBrowser from "expo-web-browser";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BRIDGEX_DEEP_LINK } from "../config";
import { useBridgeXAppearance } from "../lib/appearance";
import { LANGUAGE_OPTIONS } from "../lib/accountLanguage";
import { translateAccount, useNativeLanguage } from "../lib/i18n";
import { supabase } from "../lib/supabase";

type Props = { onGuest: () => void; onLanguageChange: (language: string) => void };
type Mode = "sign-in" | "sign-up" | "reset";

function readAuthCallback(url: string) {
  const query = url.includes("#") ? url.slice(url.indexOf("#") + 1) : url.slice(url.indexOf("?") + 1);
  const values = new URLSearchParams(query);
  return { access_token: values.get("access_token"), refresh_token: values.get("refresh_token"), code: values.get("code") };
}

export function AuthScreen({ onGuest, onLanguageChange }: Props) {
  const palette = useBridgeXAppearance();
  const { language, isRtl } = useNativeLanguage();
  const account = (key: Parameters<typeof translateAccount>[1]) => translateAccount(language, key);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try { await work(); }
    catch (error: any) { Alert.alert("BridgeX", error?.message || "We could not complete that action. Please try again."); }
    finally { setBusy(false); }
  };

  const signIn = () => run(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  });
  const signUp = () => run(async () => {
    if (name.trim().length < 2) throw new Error("Enter your full name to create a BridgeX account.");
    const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: BRIDGEX_DEEP_LINK } });
    if (error) throw error;
    Alert.alert("Check your email", account("emailConfirmation"));
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
    const result = await WebBrowser.openAuthSessionAsync(data.url, BRIDGEX_DEEP_LINK, { showInRecents: false, preferEphemeralSession: true });
    if (result.type !== "success") {
      if (result.type === "cancel" || result.type === "dismiss") return;
      throw new Error("Google sign-in did not return to BridgeX. Please try again.");
    }
    const callback = readAuthCallback(result.url);
    const sessionResult = callback.code
      ? await supabase.auth.exchangeCodeForSession(callback.code)
      : callback.access_token && callback.refresh_token
        ? await supabase.auth.setSession({ access_token: callback.access_token, refresh_token: callback.refresh_token })
        : { error: new Error("Google sign-in finished without a secure session. Check that the BridgeX mobile redirect URL is allowed in Supabase Auth.") };
    if (sessionResult.error) throw sessionResult.error;
  });

  const title = mode === "sign-up" ? account("createSecureAccount") : mode === "reset" ? "Reset your password" : account("accountAccess");
  const action = mode === "sign-up" ? account("createAccount") : mode === "reset" ? "Send reset email" : account("signIn");
  const submit = mode === "sign-up" ? signUp : mode === "reset" ? resetPassword : signIn;
  const fieldProps = { placeholderTextColor: palette.muted, selectionColor: palette.primary };
  const inputStyle = [styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, textAlign: isRtl ? "right" as const : "left" as const }];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0} style={[styles.page, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.authScroll} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>BRIDGEX</Text>
          <Text style={styles.brand}>{language === "zh-CN" ? "发布。匹配。\n安全携带。" : "Post it.\nMatch it.\nCarry it safely."}</Text>
          <Text style={styles.heroCopy}>A native marketplace for lawful goods-carrying requests and available travel capacity.</Text>
        </View>
        <View style={styles.panel}>
          <Pressable accessibilityRole="button" accessibilityLabel={account("chooseLanguage")} accessibilityState={{ expanded: languageOpen }} onPress={() => setLanguageOpen(open => !open)} style={[styles.languageControl, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Ionicons name="language-outline" size={19} color={palette.primary} />
            <Text style={[styles.languageLabel, { color: palette.text }]}>{LANGUAGE_OPTIONS.find(option => option.code === language)?.nativeLabel || "English"}</Text>
            <Ionicons name={languageOpen ? "chevron-up" : "chevron-down"} size={16} color={palette.muted} />
          </Pressable>
          {languageOpen && <View style={[styles.languageList, { backgroundColor: palette.surface, borderColor: palette.border }]}>{LANGUAGE_OPTIONS.map(option => <Pressable key={option.code} accessibilityRole="button" accessibilityState={{ selected: language === option.code }} onPress={() => { onLanguageChange(option.code); setLanguageOpen(false); }} style={[styles.languageOption, { borderBottomColor: palette.border }]}><Text style={[styles.languageOptionText, { color: palette.text }]}>{option.nativeLabel}</Text>{language === option.code && <Ionicons name="checkmark" size={18} color={palette.primary} />}</Pressable>)}</View>}
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.copy, { color: palette.muted }]}>{mode === "sign-up" ? "Use an email address you can verify. Your account stays active while identity review is optional." : mode === "reset" ? "We will email a secure reset link to your registered address." : "Use your BridgeX email and password, or continue securely with Google."}</Text>
          {mode === "sign-up" && <TextInput {...fieldProps} accessibilityLabel={account("displayName")} style={inputStyle} placeholder={account("displayName")} value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" />}
          <TextInput {...fieldProps} accessibilityLabel={account("emailAddress")} style={inputStyle} placeholder={account("emailAddress")} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" returnKeyType={mode === "reset" ? "done" : "next"} />
          {mode !== "reset" && <View style={[styles.passwordField, { backgroundColor: palette.surface, borderColor: palette.border }]}><TextInput {...fieldProps} accessibilityLabel={account("password")} style={[styles.passwordInput, { color: palette.text, textAlign: isRtl ? "right" : "left" }]} placeholder={account("password")} value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} textContentType={mode === "sign-up" ? "newPassword" : "password"} returnKeyType="done" onSubmitEditing={() => void submit()} /><Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? "Hide password" : "Show password"} onPress={() => setPasswordVisible(current => !current)} style={styles.passwordToggle}><Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={20} color={palette.primary} /><Text style={[styles.passwordToggleText, { color: palette.primary }]}>{passwordVisible ? "Hide" : "Show"}</Text></Pressable></View>}
          <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.primary, { backgroundColor: palette.mode === "dark" ? "#4835ab" : palette.primary }, (pressed || busy) && styles.pressed]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{action}</Text>}</Pressable>
          {mode !== "reset" && <Pressable disabled={busy} onPress={signInWithGoogle} style={({ pressed }) => [styles.google, { backgroundColor: palette.surface, borderColor: palette.border }, (pressed || busy) && styles.pressed]}><Text style={[styles.googleText, { color: palette.text }]}>{account("continueWithGoogle")}</Text></Pressable>}
          <View style={styles.links}>{mode !== "sign-in" && <Pressable onPress={() => setMode("sign-in")}><Text style={[styles.link, { color: palette.primary }]}>{account("signIn")}</Text></Pressable>}{mode === "sign-in" && <><Pressable onPress={() => setMode("sign-up")}><Text style={[styles.link, { color: palette.primary }]}>{account("createAccount")}</Text></Pressable><Pressable onPress={() => setMode("reset")}><Text style={[styles.link, { color: palette.primary }]}>Forgot password?</Text></Pressable></>}</View>
          <Pressable onPress={onGuest} style={styles.guest}><Text style={[styles.guestText, { color: palette.muted }]}>{account("browseAsGuest")}</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, authScroll: { flexGrow: 1, paddingBottom: 28 },
  hero: { backgroundColor: "#172126", flex: 0.42, justifyContent: "flex-end", minHeight: 278, padding: 28, paddingBottom: 34 },
  eyebrow: { color: "#a8e5c3", fontSize: 11, fontWeight: "800", letterSpacing: 2.2 },
  brand: { color: "#f7f5ef", fontFamily: "serif", fontSize: 38, fontWeight: "800", letterSpacing: -1.5, lineHeight: 40, marginTop: 11 },
  heroCopy: { color: "#c6d4ce", fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 330 },
  panel: { flex: 0.58, justifyContent: "center", padding: 24 },
  languageControl: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 44, paddingHorizontal: 12, marginBottom: 12 },
  languageLabel: { flex: 1, fontSize: 14, fontWeight: "700" },
  languageList: { borderRadius: 12, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
  languageOption: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 42, paddingHorizontal: 14 },
  languageOptionText: { flex: 1, fontSize: 14 },
  title: { fontSize: 27, fontWeight: "800", letterSpacing: -0.7 },
  copy: { fontSize: 13, lineHeight: 20, marginBottom: 18, marginTop: 8 },
  input: { borderRadius: 13, borderWidth: 1, fontSize: 15, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 13 },
  passwordField: { alignItems: "center", borderRadius: 13, borderWidth: 1, flexDirection: "row", marginBottom: 10 },
  passwordInput: { flex: 1, fontSize: 15, paddingHorizontal: 14, paddingVertical: 13 },
  passwordToggle: { alignItems: "center", flexDirection: "row", gap: 3, paddingHorizontal: 13, paddingVertical: 12 },
  passwordToggleText: { fontSize: 12, fontWeight: "900" },
  primary: { alignItems: "center", borderRadius: 13, justifyContent: "center", marginTop: 4, minHeight: 50 },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  google: { alignItems: "center", borderRadius: 13, borderWidth: 1, justifyContent: "center", marginTop: 10, minHeight: 50 },
  googleText: { fontSize: 15, fontWeight: "800" },
  links: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center", marginTop: 16 },
  link: { fontSize: 13, fontWeight: "800" },
  guest: { alignItems: "center", paddingVertical: 17 },
  guestText: { fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});
