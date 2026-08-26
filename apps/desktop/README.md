# BridgeX Desktop Wrapper

This Electron project packages a BridgeX web deployment for Windows, macOS, and Linux. It is intentionally a minimal desktop shell: all business logic, authentication, storage, payment review, and data authorization remain in the web/Supabase stack.

Set `BRIDGEX_WEB_URL` to your HTTPS BridgeX deployment when packaging. Do not hard-code production credentials, storage keys, or service-role keys in this project. Native code signing for Windows and macOS is a separate owner-controlled release responsibility.
