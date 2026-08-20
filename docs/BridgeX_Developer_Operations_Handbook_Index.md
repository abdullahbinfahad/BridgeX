# BridgeX Developer Operations Handbook — Publication Index

**Purpose:** This index governs the long-form BridgeX technical handbook requested for engineers, QA staff, administrators, moderators, release managers, and support operators. It turns the existing core manual into a **maintainable 600-page publication program**, rather than a one-time document filled with duplicated content.

> The source of truth remains the repository, Supabase migrations, deployed configuration, and verified operational evidence. Documentation explains those sources; it never overrides their permission, privacy, or release controls.

## 1. Publication architecture

| Volume | Target pages | Primary audience | Evidence required before publication |
|---|---:|---|---|
| I. Product and domain foundation | 60 | Product, support, new engineers | User journey maps, terminology, policy-boundary review |
| II. Frontend architecture | 80 | Frontend and UI/UX engineers | Route inventory, component diagrams, responsive screenshots |
| III. Supabase data model | 100 | Backend engineers and DBAs | Table/relationship map, RLS evidence, migration-to-schema reconciliation |
| IV. Payments and payouts | 80 | Backend, operations, payment reviewers | State diagrams, proof/payout actions, audited migration references |
| V. Messaging, notifications, and reviews | 60 | Frontend, backend, moderators | Participant-access tests, notification routing, review eligibility evidence |
| VI. Administration and support | 60 | Administrators, moderators, support | Verification/payment queues, incident and escalation playbooks |
| VII. Mobile, deployment, and observability | 60 | Mobile, DevOps, release managers | EAS/Play release runbooks, Render deploy checks, rollback evidence |
| VIII. Troubleshooting and security appendices | 100 | All technical roles | Symptom catalogue, secure remediation, test and deployment proofs |
| **Total** | **600** | **Cross-functional** | **No duplicated filler content** |

## 2. Canonical source map

| Subject | Primary source | Supporting source | Maintenance trigger |
|---|---|---|---|
| Public routing and fallback states | `apps/web/client/src/App.tsx` | `ErrorBoundary.tsx`, `DeliveryLoader.tsx` | A route, lazy import, or recovery behavior changes |
| Public navigation and unread routing | `apps/web/client/src/components/bridgex/PublicLayout.tsx` | `DashboardLayout.tsx` | Menu destination, notification classification, or mobile behavior changes |
| Member workspace | `apps/web/client/src/pages/Workspace.tsx` | `DashboardLayout.tsx` | Orders, offers, interests, settings, or list-management behavior changes |
| Payment records and payout actions | `apps/web/client/src/pages/PaymentHistory.tsx` | `AdminPaymentReview.tsx` | A payment state, proof action, payout state, or route changes |
| Security rules and state transitions | `supabase/migrations/*.sql` | RPC/function definitions in the applied migration | Any schema, RLS, trigger, bucket, or RPC change |
| Android distribution | `apps/mobile/app.json` and `apps/mobile/eas.json` | `apps/mobile/android/app/build.gradle` | App version, permissions, signing, store track, or build profile changes |
| Regression evidence | `apps/web/server/*.test.ts` | Production build output and deployment validation records | Any user-visible state or authorization rule changes |

## 3. Payment and payout route catalogue

The handbook must document the payment flow as separate, actionable routes. Screenshots and test evidence must use these paths rather than relying on query-string panels.

| Route | User purpose | Available action | Relevant source |
|---|---|---|---|
| `/dashboard/payments` | Payment overview and recent records | Open a status category or a record | `PaymentHistory.tsx` |
| `/dashboard/payments/pending` | Payment records that need member action | Open a record and submit a proof | `PaymentHistory.tsx` |
| `/dashboard/payments/verifying` | Submitted payment evidence awaiting review | Open the record and read the current state | `PaymentHistory.tsx` |
| `/dashboard/payments/verified` | Payment records that opened a protected match | Open the record and continue to protected chat | `PaymentHistory.tsx` |
| `/dashboard/payments/received` | Confirmed traveler payouts | Open the linked payout record | `PaymentHistory.tsx` |
| `/dashboard/payments/record/:paymentId` | Individual protected payment | Submit proof when pending/rejected; review final state otherwise | `PaymentHistory.tsx` |
| `/dashboard/payouts` | Traveler payout list and private payout setup | Open payout record; save payout account | `PaymentHistory.tsx` |
| `/dashboard/payouts/record/:payoutId` | Individual traveler payout | Confirm receipt after an administrator marks it sent | `PaymentHistory.tsx` |

## 4. Required chapter template

Every handbook chapter, component page, migration entry, and runbook must use this structure so that future contributors can find the right source and remedy quickly.

| Section | Required content |
|---|---|
| Scope | What the feature does, who uses it, and explicit non-goals |
| Source map | Exact repository files, migration names, tables, buckets, RPCs, and route paths |
| User flow | Preconditions, ordinary steps, state changes, and postconditions |
| Permission model | Guest/member/admin/super-admin behavior and private-data boundaries |
| Failure catalogue | **Problem → likely cause → exact place to check → diagnosis → safe solution → verification → prevention** |
| Test evidence | Unit, regression, integration, and manual smoke checks that must pass |
| Visual reference | Screenshot/diagram identifier, caption, date, viewport/device, and redaction status |
| Change notes | Migration, commit, release/version, author, reviewer, and rollback consideration |

## 5. Visual-reference standard

Screenshots must never expose production passwords, raw access tokens, ID documents, payment proof, addresses, or unredacted chat content. Use a stable identifier instead of embedding unclear screenshots without context.

```text
Figure VII.4.2 — Google Play internal-testing release screen
[IMAGE: MOBILE-PLAY-INTERNAL-TEST-001]
① Selected release track
② Uploaded App Bundle version code
③ Tester cohort
④ Pre-release warnings
⑤ Rollout control
```

For each visual, the handbook repository should retain either an approved redacted image or a deterministic diagram source. When a visual is replaced, update every cross-reference that points to its identifier.

## 6. Mobile and Google Play supplement

The required release procedure is maintained in [Google Play Release Guide](Google_Play_Release_Guide.md). It covers the separate `play` EAS App Bundle profile, application ID `im.bridgex.marketplace`, version-code discipline, Play App Signing boundaries, store listing draft, Data safety worksheet, and the account-owner steps that cannot be automated.

The handbook's mobile volume must explain the following distinction clearly:

| Distribution | Artifact | Intended use | Signing boundary |
|---|---|---|---|
| Direct download | APK | Existing Android distribution link | EAS/direct-distribution release profile |
| Google Play | AAB | Internal testing, closed/open testing, production rollout | Play App Signing plus protected upload credentials |

## 7. Documentation maintenance workflow

1. Add the implementation change to `apps/web/todo.md` before coding.
2. Add or update regression coverage and apply a forward-only migration when the data model changes.
3. Update the matching handbook chapter, route table, and failure catalogue in the same pull request or release commit.
4. Create/redact screenshots or regenerate diagrams when a user-visible flow changes.
5. Run web type checking, unit tests, production build, and targeted live smoke checks.
6. Record the commit, deployment identifier, test result, and any unresolved limitations in the chapter's change notes.
7. Do not claim an external release, payment transaction, Play policy approval, or data-safety declaration has occurred until an authorized account owner has completed and verified it.

## 8. Immediate next authoring batch

The next handbook batch should expand the existing core manual in this order:

1. **Volume IV:** Add payment-detail route screenshots, proof-submission state table, rejection/retry guidance, payout-detail confirmation, and administrator review evidence.
2. **Volume VII:** Add Android WebView architecture, EAS build profiles, upload-key handling, Play Console internal-test checklist, and direct APK versus AAB comparison.
3. **Volume V:** Add account-menu polling rationale, the historical callback-after-subscribe symptom, diagnostic steps, safe recovery, and regression-test evidence.
4. **Volume VIII:** Add the blank-refresh recovery procedure, route-chunk cache recovery, back-navigation rules, and a versioned mobile troubleshooting matrix.

## Related documents

- [BridgeX Developer Manual — Core](BridgeX_Developer_Manual_Core.md)
- [BridgeX Product Audit](BridgeX_Product_Audit.md)
- [BridgeX Research Paper](BridgeX_Research_Paper.md)
- [Google Play Release Guide](Google_Play_Release_Guide.md)
