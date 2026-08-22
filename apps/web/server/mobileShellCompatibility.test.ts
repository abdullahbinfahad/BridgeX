import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mobileApp = readFileSync(new URL("../../mobile/App.tsx", import.meta.url), "utf8");
const nativeApp = readFileSync(new URL("../../mobile/src/NativeApp.tsx", import.meta.url), "utf8");
const authScreen = readFileSync(new URL("../../mobile/src/components/AuthScreen.tsx", import.meta.url), "utf8");
const cache = readFileSync(new URL("../../mobile/src/lib/cache.ts", import.meta.url), "utf8");
const secureStorage = readFileSync(new URL("../../mobile/src/lib/secureStorage.ts", import.meta.url), "utf8");
const sessionHook = readFileSync(new URL("../../mobile/src/hooks/useBridgeXSession.ts", import.meta.url), "utf8");
const mobileConfig = readFileSync(new URL("../../mobile/app.json", import.meta.url), "utf8");
const androidManifest = readFileSync(new URL("../../mobile/android/app/src/main/AndroidManifest.xml", import.meta.url), "utf8");
const marketplaceScreen = readFileSync(new URL("../../mobile/src/screens/MarketplaceScreen.tsx", import.meta.url), "utf8");
const workspaceScreen = readFileSync(new URL("../../mobile/src/screens/WorkspaceScreen.tsx", import.meta.url), "utf8");
const composeScreen = readFileSync(new URL("../../mobile/src/screens/ComposeScreen.tsx", import.meta.url), "utf8");
const responseScreen = readFileSync(new URL("../../mobile/src/screens/ResponseScreen.tsx", import.meta.url), "utf8");
const moreScreen = readFileSync(new URL("../../mobile/src/screens/MoreScreen.tsx", import.meta.url), "utf8");
const dateTimeField = readFileSync(new URL("../../mobile/src/components/NativeDateTimeField.tsx", import.meta.url), "utf8");

describe("BridgeX independent Android native shell", () => {
  it("resizes around the Android keyboard and renders native authentication instead of a browser wrapper", () => {
    expect(mobileConfig).toContain('"softwareKeyboardLayoutMode": "resize"');
    expect(androidManifest).toContain('android:windowSoftInputMode="adjustResize"');
    expect(mobileApp).toContain("NativeApp");
    expect(authScreen).toContain("TextInput");
    expect(nativeApp).not.toContain("WebView");
    expect(mobileApp).not.toContain("react-native-webview");
  });

  it("starts as a native public marketplace and restores secure session state with an offline-safe cache", () => {
    expect(nativeApp).toContain('useState<AppRoute>("marketplace")');
    expect(nativeApp).toContain("MarketplaceScreen");
    expect(nativeApp).toContain("ComposeScreen");
    expect(nativeApp).toContain("WorkspaceScreen");
    expect(cache).toContain("AsyncStorage");
    expect(cache).toContain("APP_CACHE_PREFIX");
    expect(secureStorage).toContain("SecureStore");
    expect(sessionHook).toContain("flushSafeActions");
    expect(sessionHook).toContain("notification-read");
  });

  it("uses native media permissions and preserves the Android system navigation model without WebView history", () => {
    expect(mobileConfig).toContain('"android.permission.READ_MEDIA_VISUAL_USER_SELECTED"');
    expect(androidManifest).toContain("android.permission.READ_MEDIA_VISUAL_USER_SELECTED");
    expect(mobileConfig).toContain('"expo-image-picker"');
    expect(nativeApp).not.toContain("webView.current?.goBack()");
    expect(nativeApp).not.toContain("allowFileAccess");
  });

  it("keeps an empty BridgeX-colored system area and exposes modern native navigation with Updates", () => {
    expect(nativeApp).toContain('topBlank: { backgroundColor: "#f7f5ef", height: 18 }');
    expect(nativeApp).toContain('label: "Updates", icon: "notifications-outline"');
    expect(nativeApp).toContain('Ionicons name={tab.icon}');
    expect(nativeApp).toContain('shield-checkmark-outline');
  });

  it("keeps post creation in Marketplace and removes redundant Workspace posting controls", () => {
    expect(marketplaceScreen).toContain("onCreateRequest");
    expect(marketplaceScreen).toContain("onCreateCarry");
    expect(marketplaceScreen).toContain("Request");
    expect(marketplaceScreen).toContain("Carry");
    expect(workspaceScreen).toContain("onBrowseMarketplace");
    expect(workspaceScreen).not.toContain("postButton");
  });

  it("uses native date-time selection and keyboard-safe form containers instead of manual schedule typing", () => {
    expect(dateTimeField).toContain("@react-native-community/datetimepicker");
    expect(dateTimeField).toContain('mode="date"');
    expect(dateTimeField).toContain('mode="time"');
    expect(composeScreen).toContain("KeyboardAvoidingView");
    expect(responseScreen).toContain("KeyboardAvoidingView");
    expect(authScreen).toContain("KeyboardAvoidingView");
  });

  it("keeps administrator controls discoverable only to authorized accounts", () => {
    expect(moreScreen).toContain('role === "admin" || role === "super_admin"');
    expect(moreScreen).toContain("Administrator control");
  });
});
