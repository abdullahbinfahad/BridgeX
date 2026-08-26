# BridgeX Native 1.6.4 Release Readiness

This record describes **prepared source**, not a completed distribution artifact. The independent mobile application remains in the existing Expo project `459e7ae1-9dc7-4318-b642-814abe9ace20`, owned by `abdullahbinfahadbridexs-team`, with Android package and iOS bundle identifier `im.bridgex.marketplace`.

| Target | Prepared configuration | Build profile | Current truth |
|---|---|---|---|
| Android internal APK | Version `1.6.4`, `versionCode 21` | `production` | Source is prepared; no Build 21 APK is claimed until the remote build completes and is archive-inspected. |
| Google Play | Version `1.6.4`, `versionCode 21` | `play` | The profile produces an Android App Bundle; Play Console enrollment and release review remain external steps. |
| iOS internal testing | Bundle ID `im.bridgex.marketplace` | `ios-preview` | Source configuration is present; a signed Apple Developer build is required before an IPA/TestFlight artifact may be claimed. |
| iOS store | Bundle ID `im.bridgex.marketplace` | `ios-production` | Store distribution requires the owner’s Apple Developer signing and App Store review. |

## Required build gate

When the Android build allowance is available and the owner requests the build, use the existing mobile directory and project identity:

```bash
cd apps/mobile
npx eas-cli@latest build --profile production --platform android
```

The release checklist is deliberately strict. Confirm that the submitted source commit is recorded by the build, download the resulting APK, inspect its package identifier and version metadata, and run the native regression suite before giving a public download link. The prior verified Build 20 remains a historical artifact only; it must not be described as containing the prepared 1.6.4 source changes.

## Pre-build source validation

```bash
cd apps/mobile
npx tsc --noEmit
node tests/native-architecture.test.mjs
```

For the web companion application, run the regression suite and production build from `apps/web` before release. A bundle-size warning may remain; it is a performance follow-up rather than a release-artifact claim.
