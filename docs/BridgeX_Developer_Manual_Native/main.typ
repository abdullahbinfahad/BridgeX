// Native professional report entry.
// Prepared projects receive report-theme.typ beside this file.

#import "report-theme.typ": report-accent, report-theme

#show: report-theme.with(
  title: "BridgeX Developer Manual — Core Edition",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)

// ---------- Title page ----------
#page(margin: (top: 30%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 26pt, weight: "bold", fill: report-accent)[BridgeX Developer Manual — Core Edition]
    #v(0.5em)
    #text(size: 14pt, fill: luma(80))[Illustrated engineering, operations, and security guide]
    #v(2em)
    #line(length: 40%, stroke: 0.5pt + luma(160))
    #v(2em)
    #text(size: 12pt)[
      作者: Manus AI \
      日期: #datetime.today().display("[year] 年 [month] 月 [day] 日")
    ]
  ]
]

// ---------- Table of contents ----------
#page(numbering: none, header: none)[
  #outline(title: [目 录], indent: 1.5em)
]

// ---------- Main body ----------
#counter(page).update(1)

= Purpose and operating boundary

BridgeX is a peer-to-peer global goods-carrying marketplace. It connects people who need an item carried with travelers or cargo-capacity providers who can legally and safely complete a compatible route. The engineering principle is *public discovery, protected execution*: route and service context can be public, but direct addresses, contact details, identity records, payment evidence, private payout instructions, and matched-deal chat are revealed only to the appropriate participant or authorized reviewer.

#quote(block: true)[
  This manual describes the present implementation and the safe path for future changes. It does not authorize developers or administrators to bypass row-level security, retrieve passwords, expose private records, or make legal, customs, banking, or carrier claims that BridgeX cannot substantiate.
]

== Product claims that must remain accurate

The current manual-payment design is a *payment-proof review* workflow. A user supplies evidence for an administrator to review; that evidence should not be described as a bank balance, regulated escrow, cleared settlement, customs clearance, or legal approval. Members retain responsibility for accurate item information and for compliance with every relevant customs, airline, carrier, import/export, and destination-country requirement.

== Roles and least privilege

#table(
  columns: (1.25fr, 2.2fr, 2.6fr),
  inset: 8pt,
  stroke: luma(190),
  table.header([*Role*], [*Core ability*], [*Hard boundary*]),
  [Guest], [Browse public marketplace and profiles], [Cannot post, respond, message, or view protected details],
  [Member], [Create posts, respond, manage own protected activity], [Cannot view another member’s documents, proof, or unrestricted messages],
  [Administrator], [Review assigned verification, payment, payout, report, and support queues], [Cannot read or recover passwords; must use documented reason and audit trail],
  [Super Admin], [Manage governance and administrator controls], [Does not override privacy or password rules]
)

= Architecture map

#figure(
  image("assets/bridgex_architecture.png", width: 100%),
  caption: [BridgeX architecture: public discovery, protected workspace, Supabase data controls, storage, realtime, and administrator operations.],
)

== Repository map

#table(
  columns: (2.6fr, 2.3fr, 2.5fr),
  inset: 8pt,
  stroke: luma(190),
  table.header([*Location*], [*Responsibility*], [*Safe change pattern*]),
  [`apps/web/client/src/App.tsx`], [Routes and guards], [Register a route and preserve role protection],
  [`components/bridgex/PublicLayout.tsx`], [Signed-in header and notification routing], [Classify events by destination and preserve unread state],
  [`pages/Workspace.tsx`], [Member orders, offers, interests, release actions], [Use in-app dialogs and explicit state labels],
  [`pages/PaymentHistory.tsx`], [Proof, payment history, traveler payout instructions], [Never expose private payment data in public surfaces],
  [`pages/AdminControl.tsx`], [Administrative work queues], [Add scoped search, decision reasons, and audit-oriented actions],
  [`supabase/migrations/*.sql`], [Schema, RLS, RPCs, triggers, buckets], [Add forward-only migrations and commit them with the source change],
  [`server/*.test.ts`], [Business-rule regression coverage], [Add a focused test when a workflow contract changes]
)

== Data classification

Public post media may be public only while linked to an open public post. Identity documents, payment proof screenshots, private payment instructions, and traveler payout assets require private buckets and database-backed authorization before a signed URL is created. A path string alone must never grant access.

= Protected workflow state machines

#figure(
  image("assets/bridgex_payment_workflow.png", width: 92%),
  caption: [Protected payment proof, match opening, delivery release, and traveler payout sequence.],
)

== Sender request to traveler offer

A sender publishes a request with a route, item details, categories, weight, timing, handling needs, destination data, and a legality declaration. A traveler submits an offer. The sender selects an eligible offer; this creates a protected payment request in `pending_payment`. After evidence is submitted, status becomes `payment_verifying`. Only an authorized verification decision can open the protected match and reveal the matched workflow details.

== Carry listing to sender interest

A traveler publishes spare capacity with route, departure and estimated-delivery dates, accepted categories, transport method, capacity, and pricing. A sender submits an interest with category, quantity, weight, deadline, and destination data. When the traveler selects an eligible interest, the sender’s payment request is created and capacity is reserved during review. Capacity becomes a confirmed commitment only after payment proof is verified. Multiple interests can coexist while remaining capacity permits.

== Delivery release and traveler payout

A traveler must enter private payout instructions before marking an order delivered. After the sender confirms receipt and releases the order, a traveler-payout-due record and administrator notification are created. An administrator records payout sent, and the traveler confirms payout received. This creates a closed, traceable record rather than leaving payout status in informal chat.

== Payment states

#table(
  columns: (1.55fr, 3.1fr, 2.25fr),
  inset: 8pt,
  stroke: luma(190),
  table.header([*State*], [*Meaning*], [*Permitted next action*]),
  [`pending_payment`], [Protected acceptance exists and requires member evidence], [Submit proof or apply a policy-approved cancellation],
  [`payment_verifying`], [Proof is waiting for authorized review], [Verify or reject with documented reason],
  [`verified`], [Review succeeded and protected match is open], [Manage the protected order],
  [`payment_due`], [A released order requires traveler payout review], [Review payout instruction and execute external payout under policy],
  [`payment_sent`], [Administrator recorded the external payout as sent], [Traveler confirms receipt],
  [`payment_received`], [Traveler confirmed the payout], [Retain immutable completion history]
)

= Payment and state-transition troubleshooting

== First diagnostic rule

When a status error appears, do not patch only the visible table. Trace the entire state transition: the response record, request/listing record, payment record, protected match/order record, notification record, and any trigger/RPC that writes state. A feature can fail even if one table accepts the state but its companion table does not.

#table(
  columns: (2.25fr, 2.55fr, 2.1fr),
  inset: 8pt,
  stroke: luma(190),
  table.header([*Symptom*], [*Likely cause*], [*Safe resolution*]),
  [`offers_status_check`], [Offer constraint omitted the payment state], [Create a migration extending only the required response values, then test the transition],
  [`listing_interests_status_check`], [Interest constraint is older than the payment workflow], [Update the named constraint and dependent UI labels],
  [`send_requests_status_check`], [Request tries `payment_pending` but its lifecycle rule omitted it], [Extend the request rule using an append-only migration],
  [`carry_listings_status_check`], [Carry listing tries `payment_pending` but its lifecycle rule omitted it], [Extend only the listing lifecycle values required by payment review],
  [Private QR does not load], [Signed URL authorization or storage policy is missing/misaligned], [Verify active payment record, role scope, signed URL path, and bucket policy],
  [Match does not open], [Verification RPC failed or completed only part of its transaction], [Inspect proof decision, RPC error, match creation, and notification insert in order]
)

== Standard safe migration sequence

```text
1. Inspect the live constraint and the current forward migration history.
2. Add one new timestamped migration; never edit an already-applied migration.
3. Update every typed status label, filter, queue, and notification recipient.
4. Add a regression test for the intended transition and its safety boundary.
5. Apply the migration, verify the live definition, then run type check, tests, and production build.
6. Commit the migration and source code together so a new environment can reproduce production.
```

= Notifications, messages, and feedback

Each notification must contain a stable event type, recipient, title, body, link target, related record, creation time, and read state. The signed-in navigation separates Profile, Workspace, Messages, Payment history, and Administrator destinations. Temporary in-app popups show new updates once; the permanent state remains in the relevant inbox.

== Payment notification routing

#table(
  columns: (2.45fr, 1.55fr, 2.5fr),
  inset: 8pt,
  stroke: luma(190),
  table.header([*Event*], [*Recipient*], [*Permanent destination*]),
  [Payment proof submitted], [Authorized administrator], [Payment verification queue and review record],
  [Payment verified for a sender request], [Sender only], [Payment history, protected match, and message update],
  [Payment verified for a carry-space interest], [Traveler only], [Payment history, protected match, and message update],
  [Traveler payout due], [Authorized administrator], [Traveler payout queue and payout record],
  [Payout sent], [Traveler], [Payment history and payout record],
  [Payout received], [Authorized administrator], [Payout queue/history and audit event]
)

== Reviews and reports

A completed or released protected order is the eligibility boundary for ratings. The review component must permit a one-to-five star selection and an optional factual comment, prevent duplicate submissions, and display policy errors clearly. A rating is a community signal, not a guarantee. Keep `0.0 (0)` visible for a member with no completed-order reviews rather than implying an unearned positive rating.

= Administrator operations

== Verification review

Review a member record, not disconnected document rows. The review surface should show the submitted identity details, all required document types, states, and an explicit approval or rejection reason. A rejection should notify the member with a correctable explanation and must not reveal confidential internal detection criteria.

== Payment proof and payout review

Payment reviewers confirm that a payment record exists, evidence is associated with the expected payer, the amount and currency context are consistent, and the proof is legible. If the case cannot be accepted, reject with a concise, documented reason. Do not release contact data manually: that action belongs to the protected verifier transaction. Payout reviewers should similarly record the reason and reference for payment sent, then wait for traveler receipt confirmation.

#figure(
  image("assets/bridgex_incident_response.png", width: 90%),
  caption: [Incident response: classify, preserve evidence, decide under policy, notify, and create an audit record.],
)

== Incident response boundary

Reports, disputes, suspicious proof, and unsafe-listing claims must be classified by severity. Preserve relevant record references, restrict only within policy, and write a decision reason. Customer support should not make legal conclusions in chat. If an external report is required, record the authority, time, policy/legal basis, and material disclosed.

= Release engineering and quality gates

== Required change process

```text
1. Record the user-visible work item in the `apps/web` implementation tracker.
2. Read the relevant UI page, tests, migration history, and data contract.
3. Make the smallest coherent implementation change.
4. Add or update a regression test.
5. Run pnpm check, pnpm test, and pnpm build inside apps/web.
6. Mark the tracker item complete only after validation.
7. Commit application source and matching migration together, then verify the affected production path.
```

== Security release gate

Before release, check role guards, RLS policy, storage policy, signed URL scope, notification recipient, error copy, client bundle exposure, test results, and production build. For changes involving documents, money, private addresses, or restrictions, add a second reviewer and retain decision context. Passwords must be reset through the authentication recovery flow; they cannot be displayed or reconstructed by any platform role.

= Core audit findings

The current audit found a meaningful functional base: public marketplace, posts, offers/interests, protected matches, payment proof review, traveler payout history, messaging, ratings, reports, verification, and administrator governance. The production review showed guest marketplace posts after initial loading and showed in-app unread payment updates. The current repository contains 42 migrations, nine test files, and 55 passing automated checks.

The principal weaknesses are operational rather than cosmetic. Manual proof review is not automated settlement. The 5% service fee should evolve into a transaction-level fee ledger before it is charged at scale. Private document and payout records require retention and access-log policies. Remaining browser-native confirmation/alert calls should be replaced with accessible in-app dialogs. Data-quality validation needs to prevent incomplete route/city displays. Notification delivery needs event observability, and mobile release testing should be treated as a release gate.

= 600-page illustrated-manual publication plan

This core manual is the technical foundation, not a dishonest attempt to fill 600 pages with repeated text. The complete publication should be authored as eight image-rich volumes with screenshots, data-flow diagrams, policy examples, migration excerpts, test cases, and operations exercises.

#table(
  columns: (2.65fr, 1fr, 3.4fr),
  inset: 8pt,
  stroke: luma(190),
  table.header([*Volume*], [*Pages*], [*Coverage*]),
  [I. Product and domain foundation], [60], [User journeys, terminology, policy boundaries, route and item examples],
  [II. Frontend architecture], [80], [React routes, layouts, hooks, forms, accessibility, visual states, screenshots],
  [III. Supabase data model], [100], [Tables, state diagrams, RLS reasoning, RPC contracts, storage buckets, migrations],
  [IV. Payments and payouts], [80], [Proof review, fee ledger, payout due, reconciliation, disputes, audit records],
  [V. Messages, notifications, and reviews], [60], [Conversation permissions, realtime, unread states, feedback eligibility, reports],
  [VI. Administration and support], [60], [Verification, payment queues, decision templates, escalation runbooks],
  [VII. Mobile, deployment, and observability], [60], [Android, Render, domains, monitoring, release/rollback runbooks],
  [VIII. Troubleshooting and security appendices], [100], [Error catalogue, incident response, retention, QA cases, glossary, marked images],
  [*Total planned publication*], [*600*], [*Non-duplicative illustrated engineering manual series*]
)

= References

[1] Mokhberi et al., “Trust, Privacy, and Safety Factors Associated with Decision Making in P2P Markets,” ACM CHI 2024, https://dl.acm.org/doi/full/10.1145/3613904.3641966.

[2] Persona, “Marketplace Trust & Safety Workshop,” https://www.youtube.com/watch?v=sh0meBwTdhI.

[3] General Administration of Customs of the People’s Republic of China, “Customs Clearance Guide for International Passengers,” http://english.customs.gov.cn/statics/88707c1e-aa4e-40ca-a968-bdbdbb565e4f.html.

[4] State Council of the People’s Republic of China, “Customs FAQ for Inbound and Outbound Passengers,” https://english.www.gov.cn/services/visitchina/202008/04/content_WS5f2905dec6d029c1c26372f0.html.
