# BridgeX Google Play Release Guide

**Application ID:** `im.bridgex.marketplace`  
**Public website:** <https://bridgex.abdullahbinfahad.info/>  
**Privacy policy:** <https://bridgex.abdullahbinfahad.info/privacy>  
**Primary support route:** <https://bridgex.abdullahbinfahad.info/contact>

## 1. Release artifact

Google Play accepts the Android App Bundle (`.aab`) release flow. BridgeX keeps its APK profile for direct device distribution, while the `play` EAS profile is reserved for a signed App Bundle. A Play upload must use a monotonically increasing Android `versionCode`; never upload an artifact whose code is lower than or equal to the prior Play release.

> Google Play's App Signing workflow separates the private **upload key** held by the publisher from the **app signing key** held by Google. The account owner configures Play App Signing; Google then signs the device-specific APKs delivered from an uploaded App Bundle.[1][2]

## 2. Before building

| Item | Required action | BridgeX status |
|---|---|---|
| Play Console account | Complete account/identity tasks and accept Play App Signing terms | Publisher action required |
| Device verification | For a new personal Play account, complete the mobile-app device-verification task in Play Console | Publisher action required |
| Package name | Reserve and create the Play app under `im.bridgex.marketplace` | Must match the AAB exactly |
| Signing | Use Play App Signing. Keep upload-key credentials and EAS credentials private; never commit a `.jks`, password, or service key | Configuration ready; publisher setup required |
| Android artifact | Build an `.aab` using the `play` profile | Build step required |
| Testing | Install the Play-generated build through Internal testing before requesting production rollout | Required operational gate |

## 3. Build the Play artifact

From the repository root, run the following command after the release configuration is pushed:

```bash
cd apps/mobile
npx eas-cli@latest build --platform android --profile play
```

Download the resulting **`.aab`** from the EAS build page. Do not upload the direct-distribution APK to Google Play.

### 3.1 BridgeX release configuration

The source is prepared with BridgeX version **1.0.6** and Android `versionCode` **6**. The existing `preview` and `production` EAS profiles continue to build APKs for direct distribution; the new `play` profile builds an **Android App Bundle** only.

For EAS builds, EAS injects the managed upload-key values at build time. For a local Gradle release build, create an untracked `apps/mobile/android/gradle.properties` entry set with these four values; do not place any password or keystore in source control:

```properties
BRIDGEX_RELEASE_STORE_FILE=/absolute/path/to/bridgex-upload.jks
BRIDGEX_RELEASE_STORE_PASSWORD=replace-with-secret
BRIDGEX_RELEASE_KEY_ALIAS=bridgex-upload
BRIDGEX_RELEASE_KEY_PASSWORD=replace-with-secret
```

The repository ignores `.jks`, `.keystore`, AAB, and local signing-property files to reduce accidental credential exposure. A direct local `release` build will intentionally fail until one of the secure signing methods is provided; it must never silently fall back to the Android debug certificate.

## 4. Play Console sequence

1. Open [Google Play Console](https://play.google.com/console/) and create **BridgeX** with app type **App**, free or paid choice, and the matching default language.
2. Enter the package-supported contact information and the public privacy-policy URL above.
3. Enroll in **Play App Signing** as the account owner. Prefer Google's generated app-signing key unless cross-store signing requirements require a publisher-provided key.[2]
4. Upload the EAS **App Bundle** to **Internal testing** first. Add real test accounts and verify sign-in, post browsing, account menu, payment proof upload, image upload, notification permissions, and WebView refresh behavior.
5. Complete all **App content** declarations, including Data safety, privacy policy, ads declaration, content rating, target audience, and any additional permissions/declarations Play Console requires.
6. Complete the main store listing: application name, short description, full description, app icon, feature graphic, screenshots, category, contact email, and privacy policy.
7. Resolve every pre-review warning, submit the internal/closed test release, then create the production release only after testing has passed.

## 5. Data safety declaration worksheet

BridgeX uses authentication, profile/contact information, posts and media, protected payment evidence, private verification documents, messages, device notification capability, and optional location permissions. The exact Data safety answers must be completed by the publisher after reviewing the live code, Supabase configuration, Firebase configuration, and every SDK. Do **not** declare a category as uncollected merely because a form is optional.

| Data category to review | Likely platform purpose | Publisher must confirm before submitting |
|---|---|---|
| Name, email, phone, profile details | Account setup, authentication, protected matching, support | Whether collected, whether required, and whether shared |
| Exact addresses and location | Pickup/delivery and safety workflows | Whether location permission is actually requested and used |
| Photos, videos, ID documents, payment proof | Posts, verification, payment review | Retention, access controls, encryption in transit, deletion request path |
| Messages and support requests | Protected communication and safety review | Retention and authorized administrator access |
| App activity and diagnostics | Reliability and abuse prevention, if any SDK collects it | All SDK disclosure statements |

Google requires every published app, including apps on open or closed testing tracks, to complete the Data safety form and link a privacy policy. The publisher is responsible for complete and accurate disclosures, including data handled by third-party SDKs.[1]

## 6. Store-listing draft

**App name:** BridgeX  
**Short description:** Send goods with trusted travelers worldwide.  
**Category:** Travel & Local or Shopping — choose the best category after reviewing Play Console options.  
**Support email:** `abdullahbinfahad.abf@gmail.com`  
**Website:** <https://bridgex.abdullahbinfahad.info/>

**Full description draft:**

BridgeX is a global goods-carrying marketplace for people who need to send items and travelers with available luggage or cargo capacity. Browse delivery requests and carry space, create posts, compare responses, and manage protected order updates in one account. Member verification, private matching details, messaging, payment proof submission, and order status tools are available only within the relevant protected workflow.

BridgeX does not permit illegal, dangerous, restricted, or inaccurately described items. Members remain responsible for applicable customs, carrier, airline, import, export, and destination requirements.

## 7. Mandatory publisher decisions

The following actions require the Play Console account owner and cannot be completed by the source repository alone:

| Action | Reason |
|---|---|
| Pay or confirm Play Console registration and identity verification | Personal financial and identity action |
| Complete device verification | Requires the account owner's Android device and Play Console mobile app |
| Upload an AAB, submit declarations, or roll out a release | External publication action with legal/policy consequences |
| Confirm Data safety statements | Only the publisher can attest to actual data processing and SDK practices |

## References

[1]: [Google Play Console Help — Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)

[2]: [Google Play Console Help — Use Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en)

[3]: [Android Developers — Sign your app](https://developer.android.com/studio/publish/app-signing)

[4]: [Google Play Console Help — Device verification requirements for new developer accounts](https://support.google.com/googleplay/android-developer/answer/14316361?hl=en)
