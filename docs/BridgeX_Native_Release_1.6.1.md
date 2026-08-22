# BridgeX Native Release 1.6.1 (Build 18)

BridgeX 1.6.1 improves the independent Android client without weakening protected-order, message, payment, or storage controls. The release is configured as **version 1.6.1** with Android `versionCode` **18**.

## Updates, badges, and Android notifications

Updates now load the newest 30 records first and append older 30-record pages only when the member reaches the end of the list. New incoming updates and messages merge into the existing list rather than resetting loaded history. Secure server-side unread totals drive exact badges for the BridgeX logo, Updates, Messages, Workspace, and More.

The Android client registers a signed-in device token and opens a relevant native destination when a member responds to a device notification. Android determines whether it presents a notification while an app is backgrounded or the screen is locked; BridgeX does not bypass operating-system notification permissions or device privacy settings.

## Sign-in, media, and discovery

Google sign-in now completes the secure provider handoff through the configured BridgeX deep link and exchanges the returned code into the native Supabase session. Google necessarily opens a trusted provider browser for authentication, but successful sign-in now returns to the independent app rather than leaving the member in a browser session. Password fields include an accessible Show/Hide control.

`request-media` is a private storage bucket. The native client now creates short-lived signed URLs for post images and videos rather than attempting unusable public URLs. Marketplace cards and post details render images with safe retries and show real video playback controls where a post includes an uploaded video. Category controls have stronger contrast, larger labels, an explicit filter heading, and selected-state feedback.

## Workspace, responses, and payments

Workspace now includes focused **Manage posts** and **Offers & interests** pages. Members can edit or delete only eligible open posts, see incoming responses grouped under the correct post, decline a response, and begin the permitted protected payment flow. Selecting a response opens its specific payment record immediately, so the member can complete the remaining payment action.

The payment-evidence RPC now checks an offer or interest’s current protected state before applying a proof. A stale or competing selection receives a clear safe error instead of an unhandled `offer_one_active_traveler_per_request` unique-constraint message. The one-active-traveler-per-request database integrity rule remains in force.

## Web footer labels

The public footer distinguishes the retained **Android web shell · 1.0.11 — open in browser** path from the newer **Android app — independent native** APK. Automatic in-app update prompts are disabled for the retained web-shell path. The browser link opens the public web experience; the independent-native entry points to the verified build-18 APK.

## Validation and artifacts

Native TypeScript, native architecture checks, web tests, and the web production build passed before Android submission. The completed signed Android artifacts are listed below.

| Deliverable | Completed artifact | Availability |
|---|---|---|
| Independent Android APK | [BridgeX 1.6.1 build 18 APK](https://expo.dev/artifacts/eas/WBEqsix8wvwOHdovgS6j15EsdzajwEztCxMPLSj7nqg.apk) | Expires 2026-09-05 |
| Google Play App Bundle | [BridgeX 1.6.1 build 18 AAB](https://expo.dev/artifacts/eas/DRpUHkBZC8sDA3yL3C2BgfvbCTW2WC4xby4JR1bgUAU.aab) | Upload this bundle in the Google Play Console before a Play Store rollout |

The APK was produced from source commit `1255ab8` for Expo project `459e7ae1-9dc7-4318-b642-814abe9ace20`.
