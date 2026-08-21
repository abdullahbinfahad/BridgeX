# BridgeX Privacy Access and Retention Baseline

> **Operational baseline — not legal advice or a statement of jurisdictional compliance.** This document records the current intended control model for BridgeX. The owner must obtain qualified privacy advice before relying on it for any country-specific legal obligation.

## 1. Purpose and operating boundary

BridgeX is a marketplace for matching senders with travelers or carry-space providers. The platform stores account, post, match, message, payment-proof, verification, safety-report, and support information only to operate the marketplace, investigate safety issues, provide member support, and meet legitimate operational or legal obligations. This baseline does **not** authorize processing for unrelated marketing, data sale, or password access.

| Principle | BridgeX operating rule |
|---|---|
| **Data minimisation** | Collect information that supports account safety, matching, protected delivery, payment administration, support, or an identified legal need. Do not request unrelated sensitive documents through ordinary contact support. |
| **Purpose limitation** | Use private identity, delivery, chat, payment, and safety information only for the associated marketplace, support, safety, dispute, and compliance purpose. |
| **Least-privilege access** | Members can access their own data; matched counterparties receive only the protected contact information required for their active deal; authorized administrators access sensitive data only for verification, payment, safety, support, or dispute work. |
| **No password visibility** | Passwords are managed by the authentication provider. No BridgeX role, including Super Admin, is given member passwords. |
| **Accountability** | Administrators should record the reason for restrictive moderation, verification decisions, payment decisions, and safety-report handling. |
| **Security first** | Sensitive document, payment-proof, and payout-instruction storage is private and accessed through short-lived authorized links rather than public URLs. |

## 2. Data inventory and intended storage

| Data group | Typical fields or files | Primary platform location | Normal authorized access |
|---|---|---|---|
| Account identity | Email, provider ID, profile name, avatar, phone, profile settings | Supabase Auth and `public.users` | Member; authorized administrators for support, moderation, verification, and service operation. |
| Address and contact details | Current/home country, city, address, delivery phone, pickup details | `public.users`, protected order/contact records | Member; active matched counterparty only when a protected match opens; authorized administrators as needed. |
| Verification records | National ID, passport, optional student ID, associated profile details | `verification_submissions` and private `verification-documents` storage | Submitting member; authorized verification administrators. |
| Marketplace posts and public media | Request/listing details, declared value, purpose, commercial-use status, post images/videos | `send_requests`, `carry_listings`, related response tables, `request-media` storage | Public listing details according to product design; post owner; administrators. Private media is handled according to storage policy. |
| Protected deal records | Offers, interests, order stages, protected address/contact disclosures | `offers`, `listing_interests`, `orders`, protected workflow tables | Sender, matched traveler, and authorized administrators. |
| Messages and support conversation | Matched-deal messages, support replies, read state | Messaging and enquiry tables | Deal participants; authorized administrators for safety, disputes, or support. |
| Payment and payout records | Amount, currency, payment method, transfer reference, screenshot/QR or payout instructions | Payment tables plus private `payment-proofs`, `payment-instructions`, and `traveler-payout-instructions` storage | Relevant payer/payee to the extent necessary; authorized payment administrators. |
| Safety reports | Report text, category, evidence images, case status | `incident_reports` and compressed `request-media` evidence | Reporting member as allowed by case design; authorized safety administrators. |
| Contact and rights requests | Contact message, support response, `enquiry_kind` (support/privacy request/moderation appeal) | `contact_enquiries`, related notifications/messages | Requesting member or guest via their case; authorized support administrators. |
| System audit context | Record timestamps, administrator decisions, notification metadata | Relevant operating tables and notifications | Authorized operational staff only. |

## 3. Access-control baseline

BridgeX uses role-based access and row-level data rules as its first technical boundary. Administrators must not use access simply because it is technically possible. Every elevated review should have a service reason: verification, a payment decision, a safety report, a dispute, a support conversation, or a documented moderation action.

| Role | Minimum permitted scope | Explicitly prohibited scope |
|---|---|---|
| Guest | Public posts and public marketplace information. | Posting, responses, protected orders, private profiles, private files, messages, and administrative data. |
| Member | Their own profile, posts, submissions, private files, support cases, and protected deals. | Other members’ private identity records, unrelated chats, verification files, payment proofs, and administrator data. |
| Matched member | The protected delivery/contact details needed for their active accepted deal. | Information for unrelated members or deals; private documents not required for the deal. |
| Administrator | Assigned operational data for verification, payments, reports, support, disputes, and appropriately documented moderation. | Passwords; unrelated browsing of private data; unmanaged export or sharing of sensitive files. |
| Super Admin | Governance of administrator access and the same operational data scope needed to supervise the platform. | Passwords; arbitrary use of private member information outside a documented service/safety purpose. |

## 4. Retention and deletion baseline

The following timeframes are an **internal baseline**, not a promise that a record will be automatically deleted at the stated date. Before automation is enabled, the owner must approve a retention schedule, preservation process for disputes/lawful requests, and verified deletion procedures across database rows, private storage, logs, backups, and third-party processors.

| Data group | Proposed default retention point | Proposed baseline | Handling rule |
|---|---|---|---|
| Unfinished account onboarding | Account remains unused or is deleted by the member | Review after 12 months of inactivity | Preserve only if an unresolved safety, fraud, or legal hold exists. |
| Public posts and post media | Post is deleted, expired, matched/closed, or media is no longer needed | Remove public media promptly when a completed-order release or owner deletion flow removes it; review residual references within 30 days. | Keep only data needed for active order, dispute, fraud prevention, or legal hold. |
| Verification documents | Verification decision or account closure | Review after 24 months following account closure or final verification decision. | Earlier deletion may be appropriate when no operational/legal need remains; preserve only under a documented hold. |
| Payment proofs and payout instructions | Final payment/payout outcome | Review after 24 months from final payment outcome. | Private storage; no public links; retain longer only for a documented dispute, accounting, fraud, or legal reason. |
| Protected order records and messages | Completed, cancelled, or disputed order | Review after 36 months from final order outcome. | Keep necessary dispute, fraud-prevention, financial, and compliance evidence where justified. |
| Safety reports and evidence | Case is closed | Delete report evidence immediately when the authorized close-and-delete workflow is used; otherwise review case data after 36 months. | Never delete evidence subject to a documented legal, safety, or dispute hold. |
| Contact, privacy, and appeal requests | Request resolved | Review after 24 months from closure. | Maintain request/decision trail only as long as necessary to demonstrate handling and prevent repeated abuse. |
| Notifications and temporary operational records | Read or superseded | Review after 12 months. | Do not treat notifications as an authoritative long-term legal record. |

## 5. Privacy-request and appeal handling

BridgeX receives member and guest requests through the Contact page. The required classification is selected before submission:

| Request type | Intended handling path | Minimum administrator record |
|---|---|---|
| **Support** | Resolve the member’s product, account, payment, order, or technical issue. | Date, requester/contact method, issue summary, response, status. |
| **Privacy request** | Confirm identity where reasonably necessary, determine whether the request seeks access, correction, deletion review, or another rights-related action, then provide a documented outcome. | Request type, identity-check outcome, data areas reviewed, decision, reason, date, responder. |
| **Moderation appeal** | Re-evaluate the affected restriction/removal with the original reason, relevant evidence, and a written outcome. | Original action, reason, evidence considered, decision maker, appeal outcome, date. |

An administrator should not promise deletion, correction, disclosure, or a response deadline before validating the request, scope, applicable law, active-order obligations, fraud/safety concerns, and any preservation requirement. Where a request cannot be completed, the response should explain the practical reason in plain language and provide the appeal/support path.

## 6. Incident, export, and deletion controls

BridgeX should not export private tables or storage folders as a convenience workflow. Any approved export must be limited to the specific case and stored using an access-controlled method. A private file should never be copied into a public bucket or sent through an unprotected channel merely to make review easier.

For an incident involving possible unauthorized access, loss, disclosure, or destruction of sensitive data, the designated owner should promptly preserve relevant logs, restrict access, identify affected data groups and accounts, assess legal/contractual notification duties with qualified counsel, and record the decision. This document does not prescribe jurisdiction-specific breach deadlines.

## 7. Controls still required before broad scaling

BridgeX needs the following owner-approved work before representing the platform as mature for broad, multi-country use: a named privacy/compliance owner, a country-specific data-transfer assessment, processor/vendor contracts, a verified deletion-job design, backup-retention controls, administrator-access review cadence, incident-response runbook, and qualified legal review for each launch market.

## 8. Owner review record

The owner should review this baseline quarterly and whenever BridgeX adds a new payment provider, identity service, storage location, country corridor, advertising channel, or administrator role. Each review should record the version, date, reviewer, changes, and any external advice received.
