# BridgeX Deployment Validation — 20 August 2026

The Render BridgeX service reports **commit `6bb12e7`** (`Fix reviews, SEO, and delivery animations`) as the last successfully deployed commit. Render marked the service as live after an automatic deployment lasting approximately one minute and twenty-one seconds.

The live public homepage served the updated title, **“BridgeX — Send Goods from China with Trusted Travelers,”** and displayed the deployed carry-marketplace hero. Local validation of the same commit completed with **55 passing tests**, no TypeScript errors, and a successful production web build.

The Windows wrapper now has an NSIS target configured and its portable package was generated. NSIS validation could not complete in this Linux sandbox because Wine lacked the required 32-bit runtime; a Windows-native or fully provisioned Wine x64 release environment remains necessary before publishing the installer executable.

The final live reliability update, commit `1948724`, was visually checked in the browser. The homepage now displays a visible dashed route, parcel, luggage, and plane scene behind its content; the signed-in account shell completed hydration after refresh rather than remaining blank or permanently loading.

The subsequent menu-and-loader update, commit `31d6d8d`, was also checked on the live domain. The signed-in account shell completed hydration after a fresh page load without showing the reported realtime subscription exception; the update removes the menu-open state from the realtime subscription lifecycle so opening the account menu no longer re-registers a subscribed callback.
