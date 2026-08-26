# BridgeX Self-Hosting Guide

This guide is for maintainers deploying their own BridgeX instance. It does not transfer the existing production domain, Expo project, app-store accounts, payment accounts, user data, or service credentials.

## Architecture

The current system has three deployable parts: `apps/web` for the browser platform and API server, `apps/mobile` for the Expo client, and Supabase for Postgres, Auth, Storage, Realtime, RLS policies, and protected RPCs. The desktop wrapper in `apps/desktop` points to a web deployment rather than opening a database directly.

## Deployment sequence

1. Create a new Supabase project that you control. Apply the reviewed SQL migrations in chronological order from `supabase/migrations`.
2. Configure private storage buckets and RLS before allowing uploads. Do not make verification, payment-proof, request-media, or profile-document buckets public.
3. Create a web environment from `apps/web/.env.example`; replace every placeholder with your own deployment values.
4. Build and deploy `apps/web`. Configure HTTPS, your own OAuth redirect URLs, and domain-specific allowed origins.
5. Update the native mobile public configuration with your own Supabase client URL and publishable key. Do not add a service-role key to the app.
6. Run `npx tsc --noEmit` and `node tests/native-architecture.test.mjs` in `apps/mobile`, then build with your own Expo project and signing identity.
7. Configure an external monitoring, backup, and incident-response process before onboarding real users.

## Production migration rule

Never migrate production by copying passwords, private documents, payment proofs, message bodies, or raw user exports into a public repository. Use an encrypted transfer channel, a written data-processing plan, tested backups, a staged cutover, and a rollback point. See the migration runbook under `docs/Team_Handover_2026` for the operational sequence.
