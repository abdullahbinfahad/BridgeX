import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mobileApp = readFileSync(new URL("../../mobile/App.tsx", import.meta.url), "utf8");
const mobileConfig = readFileSync(new URL("../../mobile/app.json", import.meta.url), "utf8");
const androidManifest = readFileSync(new URL("../../mobile/android/app/src/main/AndroidManifest.xml", import.meta.url), "utf8");

describe("BridgeX Android WebView compatibility shell", () => {
  it("resizes around the Android keyboard and scrolls the focused web input into view", () => {
    expect(mobileConfig).toContain('"softwareKeyboardLayoutMode": "resize"');
    expect(androidManifest).toContain('android:windowSoftInputMode="adjustResize"');
    expect(mobileApp).toContain("scrollFocusedInputIntoView");
    expect(mobileApp).toContain("window.visualViewport.addEventListener");
  });

  it("opens the public homepage on every fresh launch while retaining safe drafts for in-process background recovery", () => {
    expect(mobileApp).toContain("@react-native-async-storage/async-storage");
    expect(mobileApp).toContain("WEB_STATE_KEY");
    expect(mobileApp).toContain("AppState.addEventListener");
    expect(mobileApp).toContain("__bridgexRestoreDraft");
    expect(mobileApp).toContain("type !== 'password' && type !== 'file'");
    expect(mobileApp).toContain("const initialUrl = BRIDGEX_URL");
    expect(mobileApp).not.toContain("setInitialUrl(saved.url)");
    expect(mobileApp).toContain("?app=android&build=11");
  });

  it("uses WebView history for the Android system Back control and enables Android gallery file access", () => {
    expect(mobileApp).toContain("BackHandler.addEventListener");
    expect(mobileApp).toContain("webView.current?.goBack()");
    expect(mobileApp).toContain("allowFileAccess");
    expect(mobileConfig).toContain('"READ_MEDIA_VISUAL_USER_SELECTED"');
    expect(androidManifest).toContain("android.permission.READ_MEDIA_VISUAL_USER_SELECTED");
  });
});
