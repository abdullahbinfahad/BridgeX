# Deploy BridgeX From GitHub to Your Own Domain

> **GitHub stores the BridgeX source code. It does not run the Node.js backend.** Deploy the repository to a Node-capable host, then point `bridgex.abdullahbinfahad.info` to that host.

## 1. Create the web service

1. Open [Render](https://render.com/) and create a new **Blueprint** service.
2. Connect the GitHub repository: `abdullahbinfahad/BridgeX`.
3. Render detects `render.yaml` and builds the web service from `apps/web/Dockerfile`.
4. In the Render service environment settings, enter every required value from `apps/web/.env.example`. Do not place real secrets in GitHub.
5. Deploy. Wait until the service health check returns `200`.

## 2. Connect your domain

1. In Render, open the BridgeX service and choose **Settings → Custom Domains**.
2. Add `bridgex.abdullahbinfahad.info`.
3. Render displays the exact DNS record. At the DNS provider for `abdullahbinfahad.info`, add that exact CNAME or A record.
4. Wait for Render to confirm HTTPS. Then test:

```text
https://bridgex.abdullahbinfahad.info/access
```

## 3. Update the Android app

When the custom domain returns a valid HTTPS page, set the value shown in `apps/mobile/ANDROID_ENDPOINT_TEMPLATE.txt` as an EAS production environment variable, then run:

```bash
cd apps/mobile
npx eas-cli@latest build --platform android --profile production
```

The production APK will then open your own domain, not the free BridgeX address.

## Important authentication note

The current web app uses a managed OAuth setup. For an external host, configure an authentication provider with `https://bridgex.abdullahbinfahad.info` as an approved callback/redirect URL. Direct Google sign-in and email-password sign-in need the corresponding provider credentials before they can be enabled safely.
