# BridgeX for macOS

This project packages the public BridgeX application in a sandboxed Electron desktop window. It loads only `https://bridgex.abdullahbinfahad.info` inside the application. External links open in the user’s normal browser.

## Build

```bash
npm install
npm run package:mac:x64
npm run package:mac:arm64
```

The build creates separate ZIP downloads for Intel (`x64`) and Apple Silicon (`arm64`) Macs. These unsigned ZIP packages can be shared for testing. A public production release should be signed with an Apple Developer ID and notarized on macOS before broad distribution.

## Security boundary

The WebContents configuration uses `contextIsolation`, disables Node integration, enables the Electron sandbox, and does not expose a preload bridge. The desktop package does not contain BridgeX passwords or Supabase credentials.
