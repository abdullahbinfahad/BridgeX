# BridgeX Deployment Validation — 20 August 2026

The Render BridgeX service reports **commit `6bb12e7`** (`Fix reviews, SEO, and delivery animations`) as the last successfully deployed commit. Render marked the service as live after an automatic deployment lasting approximately one minute and twenty-one seconds.

The live public homepage served the updated title, **“BridgeX — Send Goods from China with Trusted Travelers,”** and displayed the deployed carry-marketplace hero. Local validation of the same commit completed with **55 passing tests**, no TypeScript errors, and a successful production web build.

The Windows wrapper now has an NSIS target configured and its portable package was generated. NSIS validation could not complete in this Linux sandbox because Wine lacked the required 32-bit runtime; a Windows-native or fully provisioned Wine x64 release environment remains necessary before publishing the installer executable.

The final live reliability update, commit `1948724`, was visually checked in the browser. The homepage now displays a visible dashed route, parcel, luggage, and plane scene behind its content; the signed-in account shell completed hydration after refresh rather than remaining blank or permanently loading.

The subsequent menu-and-loader update, commit `31d6d8d`, was also checked on the live domain. The signed-in account shell completed hydration after a fresh page load without showing the reported realtime subscription exception; the update removes the menu-open state from the realtime subscription lifecycle so opening the account menu no longer re-registers a subscribed callback.

The definitive polling-fallback release, commit `64ad08b`, was verified on the live domain by opening the signed-in account menu. It contains no `postgres_changes` callback registration in this menu path and opened successfully after deployment.

The payment-route and Google Play preparation release, commit `829ae23`, was pushed to `main` on 2026-08-20. The first public verification request reached the Render free-tier wake-up screen while the service was allocating an instance. After startup, the live BridgeX homepage completed its delivery-themed loading state and displayed the signed-in public shell and live marketplace content successfully.

The first Play build was superseded because the native Android directory still declared version `1.0.5` / code `5`. Commit `d4f6f79` synchronizes native and Expo release metadata to **BridgeX 1.0.6 / code 6**. Expo build `abaa029e-83df-40cd-96bc-ceecebd56bbf` was then created with profile `play`, verified to show version `1.0.6 (6)`, and successfully completed. Its Android App Bundle artifact is available at <https://expo.dev/artifacts/eas/-jRhZR2pIRv3DldvcnTIAp2C2i7ySOn2Au5-VLoo0dg.aab>.

The individual-notification and payment-conversion release, commit `2f5fb5e`, was pushed to `main`. The public homepage loaded successfully after the Render deployment window. The authenticated `/admin/exchange-rates` route reached the branded administrator loading state before its rate query completed. The production migration was independently verified: the payment conversion snapshot columns, exchange-rate table, and authenticated read policy are present.

The production `/notifications` page was checked twice in a signed-in session before the latest navigation-and-profile update had propagated through Render. It correctly hydrated the existing notification history and exposed payment, order, verification, support, and administrator records. The pre-existing page title confirms the Render instance was still serving its earlier bundle. Commit `097a7c0` adds the Messages **Show all** link, paginated full-history treatment, corrected Workspace-root Back destination, and new profile-completion guidance; those visual changes require a second post-deploy verification once Render finishes its automatic build.
