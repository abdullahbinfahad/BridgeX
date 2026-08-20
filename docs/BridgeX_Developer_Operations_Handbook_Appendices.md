# BridgeX Developer Operations Handbook — Operational Appendices

This appendix accompanies the [BridgeX Developer Operations Handbook](BridgeX_Developer_Operations_Handbook.md). It provides repeatable checklists and templates for operations. It must be updated whenever an underlying route, role rule, migration, or release process changes.

## Appendix A — Daily operations checklist

| Queue | Operator checks | Do not do |
|---|---|---|
| Verification | New people, required documents, readable submissions, decision reason, notification delivery | Do not approve from a loose document row without reviewing the member record |
| Payment proof | Record owner, exact amount/currency, readable proof, current status, reviewer decision | Do not open a match by directly editing a client-visible status |
| Traveler payout | Payout due records, profile completeness, sent confirmation, receipt status | Do not request banking data in public chat |
| Reports | Severity, related member/order/conversation, evidence references, operator action | Do not make legal conclusions or promise authority action |
| Support | New contact replies, unresolved status, one BridgeX Admin conversation identity | Do not expose administrator personal details or other members’ messages |
| Platform health | Render availability, marketplace load, account menu, notification count, admin queue counts | Do not disable RLS to work around an isolated error |

## Appendix B — Payment review decision template

```markdown
Payment reference:
Payer member ID:
Response kind: Offer / carry-space interest
Requested amount and currency:
Current status:
Proof path reviewed:
Reviewer:
Decision: Verified / Rejected
Reason (member-safe):
Internal observations (avoid storing unnecessary personal data):
Notification and protected-match result checked:
```

## Appendix C — Verification review decision template

```markdown
Member ID:
Required records reviewed: National ID / Passport / Student ID where applicable
Identity and profile consistency check:
Submission quality and completeness:
Decision: Approved / Rejected
Member-safe correction guidance:
Operator:
Timestamp:
Member notification checked:
```

## Appendix D — Incident record template

| Field | Required content |
|---|---|
| Incident ID | Immutable internal reference |
| Report source | Member report, administrator observation, support enquiry, order dispute |
| Immediate risk | None, low, medium, high, emergency escalation under applicable policy |
| Related records | Member IDs, post/order/payment/report IDs, message IDs, file references |
| Evidence handling | References and integrity notes; do not duplicate sensitive raw files unnecessarily |
| Action | Review, restriction, removal, escalation, no action, or follow-up |
| Decision basis | Policy/state facts, not speculation |
| Operator and reviewer | Named authorized roles only |
| Notification | What was communicated to the affected member and when |
| Follow-up | Due date, owner, closure rationale |

## Appendix E — Pre-release checklist

| Category | Required confirmation |
|---|---|
| Scope | `todo.md` includes the change and all completed items are marked accurately |
| Security | RLS, role gates, private bucket access, signed URL controls, secret handling reviewed |
| Data | New migration is forward-only, applied/verified where required, and committed |
| UI | Loading, empty, error, mobile, keyboard, and Back behavior reviewed |
| Tests | Relevant Vitest tests updated; `pnpm test`, `pnpm check`, `pnpm build` pass |
| Live check | Guest/member/admin core path smoke-tested after deployment where risk warrants it |
| Documentation | Handbook route/state tables and release record updated |
| Versioning | Android native/app config version fields agree for a new mobile release |

## Appendix F — Android and Google Play release record

```markdown
Release name:
Version name / version code:
Package name:
Git commit:
EAS build profile:
EAS build URL:
AAB artifact URL:
Play track: Internal / Closed / Open / Production
Play App Signing confirmed:
Data safety and privacy policy reviewed by publisher:
Test cohort:
Devices tested:
Known limitations:
Release owner approval:
```

## Appendix G — Mobile WebView recovery matrix

| Symptom | First action | Engineering follow-up |
|---|---|---|
| Stuck startup loader | Fully close/reopen app, check public domain in Chrome | Inspect `App.tsx` load fail-safe, WebView events, and Render availability |
| Old web bundle | Close/reopen and retry | Confirm `build` query marker and cache strategy; do not hardcode a stale preview URL |
| Account menu crash | Update to latest web build/reload current page | Confirm account menu uses polling and has no callback registered after subscription |
| Login leaves app | Verify deep-link/auth configuration and email/password fallback | Inspect auth redirect URL and native WebView cookie/session behavior |
| Push updates absent | Check permission, token registration, device token table | Confirm server delivery credentials and recipient-specific notification record |

## Appendix H — Visual documentation controls

All operational screenshots use a Figure ID, capture date, environment, viewport, and redaction status. The following sequence is mandatory:

1. Capture the intended page with demonstration-safe data.
2. Redact national IDs, passport data, exact addresses, phone numbers, proof screenshots, access tokens, and unrelated chat content.
3. Add numbered callouts and a written caption.
4. Link the figure to the exact handbook chapter and repository/source version.
5. Replace or retire the figure when the workflow changes.

## Appendix I — Controlled vocabulary

| Term | Operational meaning |
|---|---|
| Public post | Request or listing visible to guests and members without protected data |
| Protected match | Authorized relationship created only after verified acceptance workflow |
| Payment proof | Private member-uploaded evidence attached to a payment record; not a guarantee of funds |
| Verification | Administrative decision that grants a trust signal; not a legal or customs guarantee |
| Payout | Traveler payment record created after eligible sender release |
| Review | One participant feedback record after an eligible completed/released order |
| Updates | Consolidated in-app notification stream; distinct from participant chat |
| Restricted account | Member account subject to policy-controlled limits; show safe explanatory UI rather than raw database error |

## Appendix J — Handbook change log template

| Date | Handbook version | Source commit/migration | Changed section | Reviewer | Notes |
|---|---|---|---|---|---|
| YYYY-MM-DD | X.Y | Commit / migration file | Chapter or appendix | Role/name | Reason and validation |

