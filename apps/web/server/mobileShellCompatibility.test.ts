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
});
