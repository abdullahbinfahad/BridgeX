# BridgeX Team Task Sheet and Release Workflow

## Team operating model

BridgeX should use a small cross-functional routine rather than allowing one developer to change data rules, UI, and production configuration without review. Every work item needs an owner, a reviewer, acceptance criteria, a rollback plan, and a release note.

| Role | Core responsibility | Must not do alone |
|---|---|---|
| Product lead | Pilot scope, requirements, acceptance decisions, policy language | Edit production database or secrets |
| Web developer | React/Vite user experience, responsive web flows, route guards | Alter Supabase RLS without review |
| Mobile developer | Expo/React Native screens, Android/iOS builds, deep links, offline behavior | Change signing credentials or production data alone |
| Backend/data developer | Supabase migrations, RPCs, RLS, storage access, observability | Deploy unreviewed destructive SQL |
| Administrator/operations lead | Verification, reports, support, payment-proof review | View/export private data outside role need |
| QA tester | Regression scripts, device/browser checks, release evidence | Change source or production data in testing |

## Daily and weekly cadence

Each developer should start from the latest `main` branch, create a short-lived branch, make one coherent change, run the required tests, open a pull request, and record the user-visible change. If GitHub pull requests are not used, the same review must occur through a documented peer check before merging.

| Cadence | Required work |
|---|---|
| Daily | Review errors, user reports, failed jobs, security alerts, and blocked verification/payment items |
| Weekly | Review metrics, support themes, incident log, database backup confirmation, dependency/security notices |
| Monthly | Restore-test a backup in a non-production environment, review administrator access, rotate credentials when appropriate |
| Before every release | Run web tests/build, native TypeScript/tests, role/access checks, migration review, APK/AAB/IPA identity check, rollback confirmation |

## Release checklist

1. Confirm the requirement and acceptance criteria in writing.
2. Inspect affected frontend, mobile, database, and policy code before editing.
3. Add or update a regression test for the reported defect or new rule.
4. Run `pnpm test` and `pnpm build` in `apps/web`.
5. Run `npx tsc --noEmit` and `node tests/native-architecture.test.mjs` in `apps/mobile`.
6. Review `git diff --check`; confirm no credentials, private evidence, exports, or generated build artifacts were staged.
7. Commit with a specific message, push to `main` only after review, and keep the commit hash in release notes.
8. Submit an EAS build from the approved source. Download the artifact without executing it; inspect package/version/build metadata and key bundle strings.
9. Test signed-out browsing, member flows, administrator permissions, media access, messaging, and upgrade/rollback paths on representative devices.
10. Publish an honest release note and direct artifact link only after steps 1–9 pass.

## Current prioritized backlog

| Priority | Work item | Owner | Done when |
|---|---|---|---|
| P0 | Enforce RLS and admin route authorization | Backend + QA | Signed-out/non-admin access is blocked and tested |
| P0 | Complete admin mobile routes only for existing protected backend actions | Mobile + backend | Every control has a working authorized action or is not shown |
| P0 | Payment-proof and media upload reliability | Mobile/web + backend | Upload metadata, signed URLs, and reviewer display work on Android and web |
| P1 | Full language and appearance coverage | Web + mobile | Text changes meaningfully after language selection; light/dark/system contrast passes review |
| P1 | Marketplace post lifecycle | Backend + web + mobile | Accepted requests leave public feed but remain private to participants/admins |
| P1 | Render performance and caching | Web + deployment | Cold-start limitation documented; repeat navigation avoids unnecessary full refetches |
| P2 | iOS signing and TestFlight preparation | Mobile lead | Apple account, bundle identifier, build profile, privacy metadata, and TestFlight build verified |
| P2 | Observability and backups | Technical lead | Error tracking, backup schedule, restore drill, and on-call contacts documented |

## Incident playbook

| Incident | First action | Do not do | Escalation |
|---|---|---|---|
| Suspected data exposure | Restrict affected access, preserve logs, notify technical lead | Delete logs or silently change data | Security lead and legal counsel |
| RLS/permission error | Capture user role, route, RPC/table, and exact error | Relax all policies to make it work | Backend developer |
| Payment-proof mismatch | Hold status, preserve evidence metadata, review policy | Mark paid based on unsupported claim | Payment reviewer |
| App crash or loading loop | Capture app version, device, route, console/log data | Publish an untested hotfix | Mobile lead |
| Render cold start | Explain hosting state honestly and measure impact | Claim website code can remove host sleep | Deployment owner |

## Definition of done

A feature is done only when its behavior is implemented, tested, reviewed, documented, released through the correct channel, and has a rollback path. A screen or button that only looks complete is not done.
