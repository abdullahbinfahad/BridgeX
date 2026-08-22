# BridgeX Native Android Release 1.4.0

**Version:** 1.4.0  
**Android build:** 15  
**Release status:** Validated source prepared for signed APK and Google Play Android App Bundle generation.

## Release focus

This release refines the independent native BridgeX application around practical Android use. It reserves an intentionally empty BridgeX-colored top system area, modernizes the bottom navigation using native platform iconography, moves request and carry-space creation into Marketplace, and provides Updates as a direct bottom-navigation destination.

The release removes manual schedule-string entry in native posting and response forms. Members now choose dates and times using Android-native pickers. Authentication, composition, and response forms use keyboard-avoidance layouts so an active field remains visible while the on-screen keyboard is open. The web application also includes a global focus-reveal safeguard for mobile-browser input fields.

## Additional changes

The Android loader now mirrors the BridgeX web delivery scene with a route, plane, package, and luggage. The Workspace no longer contains a redundant Post button. Authorized administrators see a clearly labeled, role-gated control entry in the header and More hub; this entry is not rendered for standard members or guests.

All updated native TypeScript checks, independent-native architecture checks, web regression tests, and production web bundle checks must pass before the signed artifacts are requested.
