# BridgeX Scaling, Backup, and Migration Runbook

## 1. Growth model: scale in stages

Do not redesign infrastructure for one million users before the platform has validated safe demand. Scale when measurements prove the current design is under pressure.

| Stage | Practical signal | Engineering focus | Operations focus |
|---|---|---|---|
| Pilot | One community, low order volume, direct team review possible | Product correctness, RLS, backups, analytics | Verify policies, user education, response workflow |
| Early growth | Repeated routes, support queue, rising media traffic | Pagination, indexes, caching, background processing | Defined moderator schedules and incident register |
| Regional scale | Multiple communities, higher concurrency, more support cases | Queueing, observability, rate limits, CDN/object storage controls | Formal roles, audit procedures, escalation SLA |
| Multi-region/global | Jurisdiction-specific routes and policies | Regional architecture, data residency review, qualified providers | Legal counsel, risk committee, partner due diligence |

## 2. Performance priorities

Measure before optimizing. Record browser/mobile first contentful display, database query latency, API error rate, storage signed-url latency, notification delivery latency, Render wake-up time, and app crash-free sessions.

The current web build warns about a large initial JavaScript chunk. The web developer should profile bundle imports and apply route-level dynamic imports for heavy dashboard/admin modules. Marketplace queries should stay paginated and request only needed columns; media should be lazy-loaded and served via signed URLs rather than embedded in database rows.

## 3. Supabase scaling checklist

1. Keep RLS enabled on private tables; performance tuning must not remove authorization checks.
2. Add indexes only after inspecting actual query patterns and `EXPLAIN` output.
3. Paginate posts, messages, notifications, reports, and audit records. Do not load entire tables into a browser/mobile screen.
4. Separate public display data from sensitive profile, verification, contact, and payment evidence data.
5. Use private Storage buckets for evidence and signed URLs for time-limited access.
6. Monitor database connection usage, slow queries, auth rates, Storage egress, and failed Edge/RPC operations.
7. Maintain migration history in Git and test migrations in a staging environment when practical.

## 4. Backup policy

Create two backup streams: **source/deployment backup** and **live data backup**. A Git repository alone is not a database backup; a Supabase export alone is not a complete application handover.

| Asset | Backup method | Frequency | Verification |
|---|---|---|---|
| Git source and docs | Protected GitHub repository plus tagged releases | Every merged change | Clone in a clean directory and run checks |
| Supabase schema | Migration history plus schema dump | Every schema change | Apply to empty staging project |
| Supabase data | Authorized database export | Daily/weekly based on live activity | Restore sampled data to isolated environment |
| Storage objects | Bucket export/replication with path manifest | Daily/weekly based on uploads | Verify object count and sample retrieval |
| Environment configuration | Encrypted credential vault; `.env.example` in Git | On change | Quarterly access review |
| Android/iOS artifacts | Retain official APK/AAB/IPA copies and hashes | Every release | Archive inspection and device install test |

Backups are snapshots, not live synchronization. For a live service, record the exact timestamp, database export method, Storage object manifest, source commit hash, app versions, and any data migrations that occurred after the snapshot.

## 5. Moving the web service away from Render

The web app can move to a different Node-compatible host if its environment configuration and deployment behavior are reproduced. Treat the migration as a staged cutover.

1. Inventory Render environment variables without copying their values into source control.
2. Build and test the web service from the exact approved Git commit in the target environment.
3. Configure the target’s secret manager with equivalent values; verify OAuth redirect URLs and allowed origins.
4. Attach a temporary staging domain and run signed-out, member, admin, uploads, and error-path checks.
5. Lower DNS TTL before cutover, then update the custom-domain record only after staging passes.
6. Monitor error rates and database writes during cutover; keep Render rollback available until stability is confirmed.
7. Update Supabase Auth URL Configuration, external OAuth provider callback settings, and CORS/origin settings where applicable.

## 6. Moving from Supabase to another backend

Supabase is not just a database in this project; it currently supplies Auth, Postgres, RLS, Storage, realtime behavior, and RPC functions. A move requires replacing each capability deliberately.

| Current capability | Target replacement examples | Migration requirement |
|---|---|---|
| Postgres tables | Managed PostgreSQL | Schema, indexes, constraints, migrations, and data validation |
| RLS | API authorization/service layer | Reimplement every policy before client cutover |
| Supabase Auth | Auth0, Clerk, Keycloak, Cognito, custom OIDC | Account migration, reset flows, OAuth redirect migration |
| Storage | S3-compatible object store | Copy objects, preserve path mapping, rebuild signed URL service |
| RPC functions | API service/server functions | Test all inputs, roles, transaction boundaries, and status transitions |
| Realtime | WebSocket/queue service | Rebuild subscriptions and unread-count behavior |

### Supabase migration sequence

1. Freeze feature/schema changes for a defined window.
2. Export schema and data through an authorized account; create checksums and a timestamped manifest.
3. Export Storage objects and a metadata/path manifest without exposing private object URLs.
4. Build the target schema, authorization service, APIs, and Storage signing service in staging.
5. Perform a rehearsal import; compare table row counts, referential integrity, object counts, and representative user flows.
6. Perform the final delta migration during the scheduled cutover window.
7. Switch web/mobile API configuration only after role, auth, uploads, messages, payments, and administrator controls pass end-to-end testing.
8. Keep Supabase read-only/rollback access for an agreed retention period, subject to policy and cost.

## 7. Data portability and buyer handover

A buyer needs a reproducible build and an authorized data transfer, not a zip file containing leaked secrets. The transfer should contain source, migrations, a sanitized environment template, a data-export procedure, object manifests, build configuration, deployment instructions, and a credential-transfer checklist. Actual secrets and personal data must move through a secure legal and technical process after access is authorized.

## References

[1]: https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects "Supabase migration guidance"
[2]: https://supabase.com/docs/guides/database/overview "Supabase database documentation"
[3]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html "AWS S3 presigned URLs"
[4]: https://render.com/docs/deploys "Render deploy documentation"
