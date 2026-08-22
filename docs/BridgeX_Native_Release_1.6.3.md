# BridgeX Native Release 1.6.3 (Build 20)

BridgeX 1.6.3 is the independent Android replacement release. Its native Android configuration is **version 1.6.3** with `versionCode` **20** and package `im.bridgex.marketplace`.

## Included member-facing improvements

The native Marketplace now has a compact category control beside search, richer post previews with member name, verification state, rating, and review count, and controls that collapse on scroll to keep the feed visible. Personal request and carry-space lists now open to actionable management and response views.

Payments now include dedicated record navigation, payment attention counts, authorized QR/instruction display, and the current settlement conversion presentation. Profile includes compressed avatar replacement, saved currency and language preferences, and light, dark, or system appearance choice. Payment, Workspace, and More route attention counts to the relevant destination cards rather than leaving them only on a navigation icon.

The production Supabase `bridgex_native_unread_counts()` function was updated with the secure payment-count response shape required by this build. It remains restricted to authenticated members and derives all counts from the caller’s own authorized records.

## Signed APK and verification

| Item | Verified result |
|---|---|
| Direct Android APK | [BridgeX 1.6.3 build 20 APK](https://expo.dev/artifacts/eas/wLOnGYR6xVoxQUtQYNhZomZZ2PEnf8-n0ZRnbpLNSiw.apk) |
| EAS build ID | `1eb41dd8-c582-46d6-9a52-cea8b2f1bfe9` |
| Source commit packaged | `8224b51ba31021ba421d0751ab2a70ceb12557e4` |
| Package identity reported by EAS | `im.bridgex.marketplace`, version `1.6.3`, build `20` |
| Artifact expiry | 2026-09-05 |

The completed APK was downloaded only for static archive inspection; it was not installed or executed. The embedded `assets/index.android.bundle` contains the updated runtime markers **“Choose product categories,” “Payment records,” “Profile details saved,” “Profile photo,” “Sign in to manage your profile,”** and **“Sign in to view your updates.”** It does not contain the old guest placeholder phrases **“Profile is ready next”** or **“Notifications is ready next.”**

Native TypeScript and native architecture checks passed. The shared web regression suite and production web build also passed before release documentation was written.
