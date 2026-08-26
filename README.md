# BridgeX

> **An open-source, community-first marketplace for arranging lawful goods-carrying requests and spare travel or cargo capacity.**

[![License: MIT](https://img.shields.io/badge/License-MIT-2ea44f.svg)](./LICENSE)
[![Web](https://img.shields.io/badge/Web-React%20%2B%20Vite-3178c6.svg)](./apps/web)
[![Mobile](https://img.shields.io/badge/Mobile-Expo%20React%20Native-6f5cff.svg)](./apps/mobile)
[![Backend](https://img.shields.io/badge/Backend-Supabase-3ecf8e.svg)](./supabase)

BridgeX helps senders publish requests and travelers or cargo providers publish available carrying capacity. The software includes public discovery, protected member spaces, private deal messaging, verification review, payment-evidence workflows, moderation, and role-gated administration.

BridgeX is **not** a carrier, customs broker, payment institution, or legal adviser. Deployers are responsible for local law, customs rules, prohibited-item policies, privacy requirements, payment-provider terms, and operational review before using it with real people or goods.

## What is in this repository

| Area | Source location | Purpose |
|---|---|---|
| Web platform | [`apps/web`](./apps/web) | React, Vite, TypeScript, Tailwind, Express, and Supabase-connected marketplace experience. |
| Native mobile app | [`apps/mobile`](./apps/mobile) | Independent Expo/React Native application for Android and iOS source builds. It is not a WebView shell. |
| Desktop wrapper | [`apps/desktop`](./apps/desktop) | Electron source for Windows, macOS, and Linux desktop packages that load a self-hosted BridgeX web deployment. |
| Database and security | [`supabase`](./supabase) | SQL migrations, RLS policies, protected RPC contracts, and storage conventions. |
| Deployment | [`render.yaml`](./render.yaml) and [`docs/SELF_HOSTING.md`](./docs/SELF_HOSTING.md) | Self-hosting and deployment guidance. |
| Operations | [`docs`](./docs) | Architecture, release, handover, safety, backup, and migration documentation. |

## Key capabilities

BridgeX currently contains public request and carry-listing discovery, member profiles, identity-verification submission and review, protected offer/interest flows, private matched-deal messages, payment-evidence review, notification feeds, ratings, reports, member controls, and administrator tooling. The codebase supports language preferences, light/dark/system appearance preferences, mobile media handling, and release configuration for Android and iOS.

> **Release accuracy:** Source version `1.6.4` / Android `versionCode 21` is prepared in this repository. It is not evidence of a completed APK or iOS build. See [`docs/BridgeX_Native_Release_1.6.4_Readiness.md`](./docs/BridgeX_Native_Release_1.6.4_Readiness.md) for the build gate.

## Quick start

### 1. Clone and review configuration

```bash
git clone https://github.com/abdullahbinfahad/BridgeX.git
cd BridgeX
cp apps/web/.env.example apps/web/.env
```

Do not commit `.env` files. Configure your own database, authentication, and storage values. The mobile app intentionally contains only a **public Supabase client URL and publishable client key**; service-role keys, payment-provider secrets, Apple credentials, and Android signing keys must never be stored in the app or repository.

### 2. Run the web application

```bash
cd apps/web
pnpm install
pnpm test
pnpm dev
```

The web application is designed to run with the Supabase migrations in [`supabase/migrations`](./supabase/migrations). Apply migrations to **your own** project after reviewing their RLS and RPC implications.

### 3. Run the native application

```bash
cd apps/mobile
pnpm install
npx tsc --noEmit
node tests/native-architecture.test.mjs
pnpm start
```

Use your own Expo account, signing credentials, push-notification credentials, and Supabase environment. The existing project identity in this repository belongs to the current maintainers and is not transferred automatically by this license.

### 4. Build the desktop wrapper

```bash
cd apps/desktop
pnpm install
BRIDGEX_WEB_URL=http://localhost:3000 pnpm dev
pnpm package:win
pnpm package:mac
```

The desktop wrapper is intentionally thin: it loads a BridgeX web deployment under a strict Electron configuration. It does not duplicate server-side authentication, payment, or database logic.

## Development and safety rules

| Requirement | Why it matters |
|---|---|
| Keep RLS and protected RPC checks authoritative | A hidden button or frontend route is not security. |
| Keep user documents, messages, payment proofs, and contact data private | These records require owner/admin authorization and appropriate legal safeguards. |
| Do not seed fictional reviews, ratings, or testimonials | User-generated information must be genuine. |
| Run tests before a release | Use both the web suite and native architecture checks. |
| Treat database migrations as reviewed changes | A migration may alter permissions, retention, or user data. |

For contribution procedures, see [`CONTRIBUTING.md`](./CONTRIBUTING.md). For responsible vulnerability reporting, see [`SECURITY.md`](./SECURITY.md). For deployment and migration guidance, see [`docs/SELF_HOSTING.md`](./docs/SELF_HOSTING.md) and the longer handover documentation under [`docs`](./docs).

## Platform status

| Platform | Source availability | Artifact status |
|---|---|---|
| Web | Full source in `apps/web` | Self-host using the provided guidance. |
| Android | Full Expo/React Native source in `apps/mobile` | Build with your own Expo signing/account after validation. |
| iOS | Full Expo/React Native source and EAS profiles | Requires Apple Developer signing and a successful build. |
| Windows | Electron wrapper source in `apps/desktop` | Package from a Windows build environment. |
| macOS | Electron wrapper source in `apps/desktop` | Package from a macOS build environment for signed distribution. |
| HarmonyOS | Platform guidance only | A separate HarmonyOS runtime implementation is not currently included. |

## License

BridgeX source code is available under the [MIT License](./LICENSE). External services, payment providers, logos, app-store accounts, domains, user data, and private production credentials are **not** conveyed by the license.

## Maintainers

BridgeX is maintained by the community. Open an issue or pull request with a clear problem statement, test evidence, and a privacy-safe reproduction path.
