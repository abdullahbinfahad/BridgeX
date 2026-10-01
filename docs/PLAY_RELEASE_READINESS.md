# BridgeX Android 1.6.5 — Google Play release handoff

**Status (1 October 2026):** Android source and Play AAB/APK builds are being prepared. **Not publicly released.** The previous website design and routes have not been changed as part of this release work.

## Build identity

| Item | Value |
| --- | --- |
| Store name | BridgeX |
| Android package | `im.bridgex.marketplace` (Play Console availability checked) |
| Native app version | `1.6.5` |
| Android version code | `22` |
| Expo | SDK 57, Android compile/target API 36 |
| Release format | Signed **AAB** from EAS `play` profile; separate installable **APK** from `preview` profile |
| Signing | Existing EAS-managed Android keystore; do **not** replace the keystore before deciding the Play App Signing upload-key strategy |

## Implemented for this candidate

- Guest-first public marketplace on app launch; private actions still require sign-in and administrator sections check the member role.
- Persisted native language preference, localized account entry controls, improved readable login/marketplace theme colors, guest-mode navigation checks.
- Native account and associated-data **deletion request** entry in the profile, including restricted accounts. It creates an authenticated `privacy_request` support enquiry; it **does not immediately delete data**. Administrators must verify identity and fulfill requests according to legal retention requirements. Users may also submit a web request through the existing [BridgeX privacy contact form](https://bridgex.abdullahbinfahad.info/contact?topic=privacy).
- Removed unused precise/coarse-location and broad `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` declarations from the native manifest and Expo config. Check the *merged* release manifest in the finished AAB before declaring the final permission inventory.
- SDK 57 package patch updates and the required `expo-font` peer dependency.

## Evidence and limits

- `npx tsc --noEmit`, `npm run test:native`, Expo dependency compatibility, and an Android Hermes bundle export pass. Expo Doctor passes **20/21** checks; the remaining advisory states that the project has tracked native folders and therefore Expo config properties are not automatically synchronized. Android version and permissions were adjusted in the tracked native project as well.
- Automated source and bundle checks are **not** installation, device-compatibility, payment-flow, RLS, policy, or end-to-end acceptance tests. Test a Play-installed build on several actual Android devices and capture a Play pre-launch report before production rollout.
- The native Admin screen still has read-only sections for support enquiries/chats and opens their web detail pages for private evidence and replies; do not claim complete web/admin feature parity.
- The native localization catalog does not cover every hard-coded profile, posting, payment, and administrator sentence. The sign-in and primary navigation improvements are not a full 11-language localization audit.
- The current public privacy policy is broad; account deletion requests require a documented operational process, appropriate data erasure, and truthful disclosure of any statutory retention. The existing web contact form names deletion review, but a dedicated, unambiguous deletion-request page would reduce review risk without redesigning the website.
- Native dependency audit currently reports **11 moderate, 0 high, 0 critical** advisories in production dependencies (many are CLI/tooling transitive packages). Triage advisories before calling the app security-audited; do not use a breaking `npm audit fix --force` blindly.

## Proposed Play Console draft (not submitted)

| Field | Proposed value |
| --- | --- |
| Name | BridgeX |
| Package | `im.bridgex.marketplace` |
| Default language | English (United States) |
| Type | App |
| App pricing | Free to install; the service may involve separately disclosed delivery payments |
| Short description | Connect with people carrying goods on routes near you. |
| Full description | BridgeX is a peer-to-peer marketplace for eligible item delivery. Browse requests and available carry space, compare routes and proposals, and coordinate protected order details with matched members. The app includes profile and identity review, order updates, member messaging, safety reporting, and administrator-reviewed payment records. Members must describe items accurately and follow applicable customs, transport, and local rules. Service availability and transaction terms depend on the route and the parties involved. |
| Privacy policy | https://bridgex.abdullahbinfahad.info/privacy |
| Account deletion web resource | https://bridgex.abdullahbinfahad.info/contact?topic=privacy (dedicated page recommended) |
| Support contact | abdullahbinfahad.abf@gmail.com |

## Console gates before any public release

1. **Account creation declarations:** The Console's Create app form requires confirmations that the app meets Developer Program Policies, acceptance of **Play App Signing Terms**, and a first-person **US export-law compliance attestation**. These are owner/legal attestations, not routine technical fields; do not check them on the owner's behalf before reviewing their exact wording.
2. **Data safety and content:** Declare actual collection of account/contact data, identity documents, photos/videos, message and support content, payment evidence, and transaction records; disclose purposes, sharing, retention, transport/storage protections, and deletion request paths accurately. Also complete ads, target audience, content rating, access instructions, and any relevant financial-features declaration. Provide test credentials for private features **without publishing them in a repository**.
3. **Testing prerequisite:** Play Console shows a **personal account with no previous apps**. If it was created after 13 November 2023, Google requires a closed test with at least **12 continuously opted-in testers for 14 days** before requesting production access. The account's creation date and production-access status still need verification after app creation; do not assume eligibility.
4. **Build review:** Verify the uploaded signed AAB's Android target API >=36, package ID, version code, signing certificate/upload key, 64-bit support, manifest permissions, size and pre-launch results. Google Play accepts **AAB** for new apps, not a standalone APK upload.
5. **Android developer verification:** Console currently invites the owner to register the app package name and signing key for certified-device installation. Confirm the uploaded app's signing key strategy before registration; the Console identity tab uses the existing developer account identity.
6. **Business/legal review:** Confirm the accuracy of payment/escrow, prohibited-item, safety, and insurance language with qualified counsel; Play Billing rules differ for physical delivery services versus digital purchases. Do not assert settlement or guarantees absent verified provider agreements and operational controls.
7. **Release action:** Prepare an internal/closed testing track and storefront assets. Public rollout and the legal attestations above require explicit owner review of the finished listing and bundle.

## Official references

- [Google Play Android target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en) — API 36 for new submissions from 31 August 2026.
- [Android App Bundle guide](https://developer.android.com/guide/app-bundle) — Play publishing format.
- [Expo SDK reference](https://docs.expo.dev/versions/latest/) — SDK 57 targets API 36.
- [Google Play account deletion rules](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).
- [Google Play closed testing for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
- [Google Play restricted photo/video permission guidance](https://support.google.com/googleplay/android-developer/answer/16935362?hl=en).
- [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en).
