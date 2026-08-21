# BridgeX for HarmonyOS

This native HarmonyOS Stage-model wrapper is written in ArkTS. It opens BridgeX at `https://bridgex.abdullahbinfahad.info/?app=harmonyos&build=1` inside the HarmonyOS Web component and uses the existing BridgeX web application for authentication, data, messaging, and protected-order workflows.

## Build a signed `.hap`

1. Install **DevEco Studio** with the HarmonyOS SDK.
2. Open this `apps/harmonyos` folder as an existing DevEco Studio project.
3. Configure a debug signature for device testing, or create a release profile through AppGallery Connect.
4. Choose **Build > Build Hap(s)/APP(s) > Build Hap(s)**.
5. Find the resulting signed `.hap` under `entry/build/default/outputs/default/`.

## Distribution status

The source package is complete and build-ready. A real installable HAP must be signed with the owner’s Huawei Developer profile in DevEco Studio; this Linux build workspace does not include Huawei’s DevEco SDK or a Huawei signing certificate. The source download is therefore provided for immediate signing and AppGallery submission.

The configured application bundle name is `info.abdullahbinfahad.bridgex`. Reserve the same package name in AppGallery Connect before creating the release profile.
