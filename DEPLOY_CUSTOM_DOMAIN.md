# Deploy BridgeX From GitHub to Your Own Domain

> **GitHub stores source code; it does not run the BridgeX server.** Deploy this repository to a Node-capable host, configure your own Supabase project, and connect a domain that you control.

## 1. Create a web service

1. Fork or clone the BridgeX repository into your own GitHub organization.
2. Choose a Node-capable host such as Render, Fly.io, Railway, a container platform, or your own server.
3. Point the service build at `apps/web` and use the deployment configuration appropriate to your provider. The included `render.yaml` is an example, not a transfer of any existing service.
4. Copy `apps/web/.env.example` to a private deployment environment and replace every placeholder with values from services you control.
5. Deploy and verify that the health check and authenticated/public routes return successfully.

## 2. Connect a custom domain

1. In the host’s custom-domain settings, add your own domain, for example `app.example.com`.
2. Create the DNS record shown by the host at your DNS provider.
3. Wait for TLS/HTTPS to be active before accepting user sign-ins or uploads.
4. Configure the exact HTTPS origin in your authentication provider, Supabase redirect allow-list, and any allowed-origin/CORS rules.
5. Test the public marketplace, sign-in return path, mobile deep link, and password reset on the final domain.

## 3. Configure mobile and desktop clients

For the Expo mobile client, update only public client configuration for your own Supabase project and build with your own Expo account and signing credentials. For the desktop wrapper, set `BRIDGEX_WEB_URL` to your HTTPS deployment before packaging. Do not embed passwords, service-role keys, payment secrets, or signing identities in any client application.

## Authentication note

The public source does not include active Google, Apple, Facebook, WeChat, or Alipay credentials. Create and approve provider applications under accounts you control, then store their secrets in the host environment. See [`SOCIAL_LOGIN_SETUP_STATUS.md`](./SOCIAL_LOGIN_SETUP_STATUS.md) for a safe setup sequence.
