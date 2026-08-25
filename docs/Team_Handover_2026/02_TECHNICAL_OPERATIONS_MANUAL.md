# BridgeX Technical Operations Manual

## 1. Architecture at a glance

BridgeX is a multi-client marketplace. The responsive web application lives under `apps/web`; the independent React Native/Expo application lives under `apps/mobile`; the database, authentication, storage, realtime behavior, and SQL/RPC business controls are implemented in Supabase; the web deployment is described by `render.yaml`; and Android/iOS release profiles are maintained in `apps/mobile/eas.json`.

| Layer | Current implementation | Operational owner |
|---|---|---|
| Public web | React, Vite, Tailwind, Wouter, Supabase client | Web developer |
| Native app | Expo, React Native, TypeScript, Android native directory | Mobile developer |
| Identity | Supabase Auth with email and configured OAuth paths | Backend developer |
| Data/business rules | Supabase Postgres, migrations, RPC functions, RLS | Backend developer |
| Private media | Supabase Storage and signed URLs | Backend developer |
| Web hosting | Render configuration | Deployment owner |
| Mobile builds | Expo/EAS project and remote credentials | Mobile lead |

## 2. Repository map

| Path | What it contains | Change rule |
|---|---|---|
| `apps/web/client/src` | Public UI, dashboard, admin pages, language and feedback components | Add tests for user-visible rules |
| `apps/web/server` | Web tests and server-side helpers | Do not bypass role checks |
| `apps/mobile/src` | Native shell, screens, API layer, hooks, media/appearance/i18n utilities | Run native compiler and architecture checks |
| `apps/mobile/android` | Android package identity, manifest, Gradle release metadata | Bump version deliberately; preserve signing relationship |
| `apps/mobile/eas.json` | EAS profiles for APK, AAB, and iOS | Use production credential process only |
| `supabase/migrations` | Ordered schema, RLS, RPC, and data-rule history | Never edit applied migration files; add a new idempotent migration |
| `docs` | Release notes, policy content, handover materials | Keep implementation claims accurate |
| `render.yaml` | Web service deployment definition | Validate before host changes |

## 3. Security model

Security depends on defense in depth. Client-side navigation is only an experience layer. Supabase RLS, role-aware RPC functions, private Storage buckets, signed URLs, and carefully scoped service credentials enforce the actual boundary.

Administrators can review platform data only through authorized administrator roles and protected routes. Do not put user passwords into profiles, exports, messages, or administrator pages. Supabase password hashes cannot and should not be recovered. Account resets must use the approved authentication reset process.

### Permission rules

| Actor | May do | Must not do |
|---|---|---|
| Guest | Read only public/open marketplace content | Post, offer, interest, message, view private addresses/documents/orders |
| Member | Manage own profile and eligible posts; participate in matched private flows | Access other members’ private records |
| Administrator | Review operational records permitted by policy | Export private documents or messages without operational need |
| Super administrator | Manage authorized administrators and platform controls | Bypass audit trail or expose secrets |

## 4. Database and migration process

The repository currently contains an ordered Supabase migration history. Before adding a field or rule, search existing migrations and application queries. Create a new timestamped migration; include the schema change, indexes where justified, RLS policy/function changes, and a narrow verification query. Apply migrations first in a non-production project when available, then through an authorized change window.

Never solve a permission error by changing a table to public or removing RLS globally. Find the exact actor, table, policy, RPC, and operation. Use a purpose-specific policy or a `SECURITY DEFINER` function only after validating inputs, ownership/role checks, search path, and logging.

## 5. Media and privacy operations

Request, payment, report, and verification media are sensitive. Store only metadata and object paths in Postgres; files belong in Storage. Use private buckets and signed URLs with short lifetimes for review. When a retention policy permits deletion, delete the Storage object through the Storage API first, then remove/mark the database record according to the relevant workflow. Do not run direct SQL deletion against storage metadata tables.

## 6. Web deployment and runtime performance

The Render service can experience a cold start after inactivity on a free/sleeping instance. Web code can improve perceived performance through caching, code splitting, skeletons, and small initial bundles, but it cannot make a sleeping host respond before the host wakes. Monitor first-request latency separately from normal navigation latency. Use an always-on deployment option only after cost/traffic review.

## 7. Android and iOS releases

The Android package and version fields exist in both Expo configuration and the checked-in Android project; the Gradle identifiers are definitive when an Android directory exists. Match `app.json` and Gradle version changes. Build APKs for direct/internal distribution and AABs for Google Play. Inspect the generated artifact archive before sharing it.

iOS build profiles are configured, but an actual IPA/TestFlight release requires an Apple Developer account, signing access, App Store Connect setup, privacy metadata, and a successful EAS iOS build. Do not promise an iPhone install link without those credentials and a completed build.

## 8. Monitoring and maintenance

At minimum, monitor build outcomes, Render deployment logs, Supabase auth failures, RLS errors, Storage upload failures, order/payment state errors, notification delivery failures, and latency. Keep an incident log containing timestamp, impacted feature, user impact, root cause, fix commit, validation result, and follow-up task.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Storage access control"
[3]: https://docs.expo.dev/build/introduction/ "Expo Application Services builds"
[4]: https://render.com/docs "Render documentation"
