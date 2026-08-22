# BridgeX Native Release 1.6.2 (Build 19)

BridgeX 1.6.2 is a targeted corrective release for defects confirmed from a production Android device. It is configured as **version 1.6.2** with Android `versionCode` **19**.

## Sign-in and guest routing

Supabase Auth now permits the exact independent-app callback `bridgex://auth/callback`. The installed Android app already handles this callback and exchanges the returned authorization code into the secure native session. Google authentication still uses Google’s trusted browser page, but it can now return to BridgeX rather than leaving the member signed in only in the browser.

Unauthenticated Profile and Updates routes no longer render a placeholder panel. They instead explain that the area is private and provide an immediate sign-in action, while guest marketplace browsing remains available.

## Protected payment and marketplace clarity

The native **Accept & pay** call now sends the required current terms-version argument to `start_bridgex_payment(text, uuid, text)`. This matches the protected server function and resolves the earlier schema-cache message caused by a stale two-argument client call. Protected payment, ownership, exact-address, and one-active-traveler constraints remain server-enforced.

Marketplace category controls now use larger, higher-contrast, taller accessible chips with visible selected states. Cards distinguish a post with no attachment from an image/video that is still loading or cannot be rendered. Posts with real private media continue to use short-lived signed URLs.

## Download labels

The footer now presents the retained legacy entry exactly as **Android app · version 1.0.11**, without an automatic update notice, and keeps the independent native Android APK as a separate clearly labelled download.

## Validation and artifacts

Native TypeScript, native architecture checks, web tests, and the web production build passed before Android submission. The signed build-19 artifacts are listed below.

| Deliverable | Completed artifact | Availability |
|---|---|---|
| Independent Android APK | [BridgeX 1.6.2 build 19 APK](https://expo.dev/artifacts/eas/gvKYcGm-EOEkMHrYlfXecz3myOsJoCBtOWHkPh3KAsQ.apk) | Expires 2026-09-05 |
| Google Play App Bundle | [BridgeX 1.6.2 build 19 AAB](https://expo.dev/artifacts/eas/qumqkxh36p-6qOJxaQOAZBnihjjsEH8uvZAS2IpCjBE.aab) | Upload to Google Play Console before a Play Store rollout |

The APK was built from source commit `37d7f42` for Expo project `459e7ae1-9dc7-4318-b642-814abe9ace20`.
