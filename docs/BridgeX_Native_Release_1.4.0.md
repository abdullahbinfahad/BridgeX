# BridgeX Native Android Release 1.4.0

**Version:** 1.4.0  
**Android build:** 15  
**Release status:** Validated source prepared for signed APK and Google Play Android App Bundle generation.

## Release focus

This release refines the independent native BridgeX application around practical Android use. It reserves an intentionally empty BridgeX-colored top system area, modernizes the bottom navigation using native platform iconography, moves request and carry-space creation into Marketplace, and provides Updates as a direct bottom-navigation destination.

The release removes manual schedule-string entry in native posting and response forms. Members now choose dates and times using Android-native pickers. Authentication, composition, and response forms use keyboard-avoidance layouts so an active field remains visible while the on-screen keyboard is open. The web application also includes a global focus-reveal safeguard for mobile-browser input fields.

## Additional changes

The Android loader now mirrors the BridgeX web delivery scene with a route, plane, package, and luggage. The Workspace no longer contains a redundant Post button. Authorized administrators see a clearly labeled, role-gated control entry in the header and More hub; this entry is not rendered for standard members or guests.

All updated native TypeScript checks, independent-native architecture checks, web regression tests, and production web bundle checks passed before the signed artifacts were requested.

## Signed artifacts

| Artifact | Direct download | Build page |
|---|---|---|
| Android APK for direct distribution | https://expo.dev/artifacts/eas/wd0I0lEt6WSxDGHye9k0qhzVsFsKSSJuqnUAgzjG5ik.apk | https://expo.dev/accounts/abdullahbinfahadbridexs-team/projects/bridgex/builds/6cd85dcd-1c2a-4efc-9a49-f59de3a32141 |
| Google Play Android App Bundle | https://expo.dev/artifacts/eas/TNz4gF2B2YDyPMfObv7eS65j63-D1Xp2992clBJdJnk.aab | https://expo.dev/accounts/abdullahbinfahadbridexs-team/projects/bridgex/builds/368e8c4b-d737-4677-b731-62af6f0664aa |

The APK is valid until **2026-09-05**. The public website footer is updated to the signed 1.4.0 APK.
