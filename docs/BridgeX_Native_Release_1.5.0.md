# BridgeX Native Android Release 1.5.0

**Version:** 1.5.0  
**Android build:** 16  
**Release focus:** Protected communication reliability, completed-service feedback, and cache-first marketplace freshness.

## Included fixes

This release routes native protected deal messages through a participant-checked database function rather than exposing the direct row-level security insert path to clients. The function verifies the signed-in member, message length, match status, and sender/traveler participation before it creates the message. It supports active, completed, and disputed protected conversations while still excluding canceled or unrelated matches.

The release also corrects the member-notification policy used by offer and carry-interest submission flows. A member may now notify only the legitimate post owner or a legitimate counterpart response, and the policy does not grant broad notification access.

Native sender and traveler public profiles now show the existing completed-order rating summary and permitted public review comments. Marketplace cards are cache-first in both native and web clients: recent cards render first, then current public requests or carry listings refresh quietly when the network responds or a permitted Realtime event arrives.

## Validation

Native TypeScript checks, native architecture regression checks, web regression tests, and the production web bundle passed before the signed APK and Android App Bundle were requested.

## Signed artifacts

| Artifact | Direct download | Build page |
|---|---|---|
| Android APK for direct distribution | https://expo.dev/artifacts/eas/_Zbcq6iIMBttyPUQ69vYhBgtV1yPUpiAdrr27NXRYMY.apk | https://expo.dev/accounts/abdullahbinfahadbridexs-team/projects/bridgex/builds/decf8d67-10f8-48e9-86d7-abb96d3ad9d5 |
| Google Play Android App Bundle | https://expo.dev/artifacts/eas/2hxfbP4wrfG8uyRNZp3D7l7FPCPjY2dLRkxPZ-mbURw.aab | https://expo.dev/accounts/abdullahbinfahadbridexs-team/projects/bridgex/builds/c3d59a21-f7d2-4142-a75c-5b83c2472c18 |

The signed APK remains available until **2026-09-05**. The public website footer now targets the Android 1.5.0 APK.
