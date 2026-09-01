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


## Direct APK build attempt — 1 September 2026

A production-profile Android build was submitted to the existing Expo project `459e7ae1-9dc7-4318-b642-814abe9ace20` under build ID `3941deba-846c-422f-95bf-9839c688d2c3`. Expo reports package `im.bridgex.marketplace`, SDK `57.0.0`, app version `1.6.4`, Android build `21`, and status `IN_QUEUE`. The build page is https://expo.dev/accounts/abdullahbinfahadbridexs-team/projects/bridgex/builds/3941deba-846c-422f-95bf-9839c688d2c3. No artifact URL exists yet; do not publish or claim a Build 21 APK until status is complete and the APK is archive-inspected.

The separate legacy Web-Scrapped APK URL supplied by the owner and validated by a lightweight HTTP test is https://expo.dev/artifacts/eas/gvKYcGm-EOEkMHrYlfXecz3myOsJoCBtOWHkPh3KAsQ.apk. It is labeled as version 1.0.11 and is not the new native Build 21 artifact.
