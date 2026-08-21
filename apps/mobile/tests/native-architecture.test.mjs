import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const entry = read("App.tsx");
const shell = read("src/NativeApp.tsx");
const secureStorage = read("src/lib/secureStorage.ts");
const cache = read("src/lib/cache.ts");
const api = read("src/lib/api.ts");
const session = read("src/hooks/useBridgeXSession.ts");
const profile = read("src/screens/ProfileScreen.tsx");
const payments = read("src/screens/PaymentsScreen.tsx");
const packageJson = read("package.json");

assert.match(entry, /NativeApp/);
assert.doesNotMatch(entry, /WebView|react-native-webview/);
assert.doesNotMatch(shell, /WebView|https:\/\/bridgex\.abdullahbinfahad\.info/);
assert.match(secureStorage, /SecureStore/);
assert.match(cache, /AsyncStorage/);
assert.match(session, /flushSafeActions/);
assert.match(api, /createNativeOffer/);
assert.match(api, /upsertNativeListingInterest/);
assert.match(api, /submitNativePaymentProof/);
assert.match(api, /moderateNativeMember/);
assert.match(profile, /uploadNativeVerificationDocument/);
assert.match(payments, /uploadNativePaymentProof/);
assert.doesNotMatch(packageJson, /react-native-webview/);

console.log("BridgeX independent native architecture checks passed.");
