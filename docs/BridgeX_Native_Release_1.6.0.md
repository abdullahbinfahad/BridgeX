# BridgeX Native Release 1.6.0 (Build 17)

This release organizes the independent Android experience around focused member records, safer request management, actionable updates, and reliable mobile input handling. The version is configured as **1.6.0** with Android `versionCode` **17**.

## Member workflow improvements

The member workspace now opens focused lists for active protected orders, personal item requests, carry space, and completed records rather than placing every record inline on the overview. Personal item requests support a confirmation-based left-swipe removal action. This action is implemented as a server-side archive operation: it closes the public request, hides it from the member’s list, and rejects removal while a protected order is still active. It does not delete protected-order history.

Payments now begin with focused status cards. Pending, verifying, verified, and received payment records each open their own list, and a member can open an individual payment record to complete the next permitted action.

## Native reliability and discovery

Native Updates now mark a record read and route to the relevant workspace area, payment status list, protected messages, profile, administrator area, or marketplace based on its recorded notification metadata. Public post media paths are normalized before rendering, image cards retry once with a cache-safe URL, and unavailable media shows an explicit fallback instead of blank content. Video or document attachments are clearly identified without being passed to the image renderer.

Messages use Android `height` keyboard avoidance, a keyboard-aware conversation list, and a protected composer with additional Android bottom clearance. Authentication retains its keyboard-aware scroll layout with stable mobile touch targets. The marketplace now combines full-text search with a non-intrusive horizontal product-category filter and haptic selection feedback.

## Mobile web and distribution

The public Contact page now uses compact mobile spacing, 48-pixel-equivalent controls, readable field typography, keyboard-accessible focus treatment, and an updated platform-safety message. The footer presents two accurate choices: **Web app — open in browser**, linking to the public website, and **Android app — independent native**, which will be updated to the completed build-17 APK after EAS artifacts finish successfully.

## Validation

Before release, the repository must pass native TypeScript, native architecture regression checks, web unit tests, and the web production build. APK and Play Store AAB artifacts are produced only after those checks pass. Artifact URLs are added after the completed build identifiers are returned by Expo.
