# BridgeX Native Android Release 1.5.0

**Version:** 1.5.0  
**Android build:** 16  
**Release focus:** Protected communication reliability, completed-service feedback, and cache-first marketplace freshness.

## Included fixes

This release routes native protected deal messages through a participant-checked database function rather than exposing the direct row-level security insert path to clients. The function verifies the signed-in member, message length, match status, and sender/traveler participation before it creates the message. It supports active, completed, and disputed protected conversations while still excluding canceled or unrelated matches.

The release also corrects the member-notification policy used by offer and carry-interest submission flows. A member may now notify only the legitimate post owner or a legitimate counterpart response, and the policy does not grant broad notification access.

Native sender and traveler public profiles now show the existing completed-order rating summary and permitted public review comments. Marketplace cards are cache-first in both native and web clients: recent cards render first, then current public requests or carry listings refresh quietly when the network responds or a permitted Realtime event arrives.

## Validation

Native TypeScript checks, native architecture regression checks, web regression tests, and the production web bundle must pass before the signed APK and Android App Bundle are requested.
