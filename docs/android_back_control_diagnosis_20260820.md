# Android Back-Control Diagnosis — 2026-08-20

The browser control is hidden only when the web page detects `BridgeXAndroid/<build>` in the WebView user agent. The current source wrapper identifies itself as `BridgeXAndroid/8` and loads the site with `?app=android&build=8`; browser use continues to render the control.

An already-installed Android APK preserves its older native WebView user agent until the member installs the newly built APK. A browser-only web deployment cannot change the user agent emitted by an older installed wrapper. The corrective release must therefore remove the control using a durable Android marker and be rebuilt and installed as a new Android version.
