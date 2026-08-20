from __future__ import annotations

from pathlib import Path
import re
import shutil


ROOT = Path("/home/ubuntu/BridgeX")
OUT = ROOT / "docs" / "BridgeX_Future_Operations_Manual"
SOURCE_ROOT = ROOT / "apps" / "web" / "client" / "src"
MIGRATIONS = ROOT / "supabase" / "migrations"


def clean(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("_", "\\_")
        .replace("#", "\\#")
        .replace("[", "\\[")
        .replace("]", "\\]")
        .replace("$", "\\$")
    )


def symbols(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return "No public symbol could be read; inspect the file directly before changing it."
    found = re.findall(r"(?:export\s+(?:default\s+)?(?:function|const|class)|function|const)\s+([A-Za-z0-9_]+)", text)
    names = []
    for name in found:
        if name not in names:
            names.append(name)
        if len(names) == 5:
            break
    return ", ".join(names) if names else "Module implementation and route-specific helpers"


def classify(path: Path) -> tuple[str, str]:
    name = path.name
    if "pages" in path.parts:
        return ("member-facing or administrator page", "Confirm guest, member, administrator, and super-admin states before changing controls.")
    if "components" in path.parts:
        return ("shared interface component", "Preserve its public props and test every calling page after a change.")
    if "lib" in path.parts or "hooks" in path.parts:
        return ("shared client utility", "Avoid creating unbounded browser work or storing private data in browser persistence.")
    return ("client implementation module", "Use a narrow change and trace all imports before refactoring.")


def table(rows: list[tuple[str, str]]) -> str:
    cells = ",\n  ".join(f"[*{clean(left)}*], [{clean(right)}]" for left, right in rows)
    return "#table(\n  columns: (1.55fr, 4.45fr),\n  inset: 6pt,\n  stroke: luma(195),\n  " + cells + "\n)\n"


def sheet(title: str, subtitle: str, purpose: str, location: str, inputs: str, outputs: str, risk: str, diagnosis: str, verification: str) -> str:
    return f'''#pagebreak()
#text(size: 15pt, weight: "bold", fill: report-accent)[{clean(title)}]
#v(0.25em)
#text(size: 9pt, fill: luma(85))[{clean(subtitle)}]
#v(0.65em)
*Purpose.* {clean(purpose)}

{table([("Primary location", location), ("Inputs / prerequisites", inputs), ("Expected outputs", outputs), ("Security or reliability boundary", risk)])}

*Problem → Cause → Location → Solution.* If this unit fails, first reproduce the smallest safe case. Confirm the caller, authenticated role, record identifier, state value, storage path, and network response in that order. Inspect the named location before editing a dependent screen. Apply a forward-only correction, retain the original evidence, and avoid making an emergency change directly in production.

*Verification.* {clean(verification)}

*Scaling note.* {clean(diagnosis)}
'''


def volume(title: str, description: str) -> str:
    return f'''#pagebreak()
= {clean(title)}

{clean(description)}
'''


content: list[str] = []
content.append('''// Generated from the BridgeX repository inventory. Do not edit generated body text by hand; update build_manual.py and rebuild.
#import "report-theme.typ": report-accent, report-theme
#show: report-theme.with(
  title: "BridgeX Future Developer Operations & Scale Manual",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)

#page(margin: (top: 25%, x: 2.2cm), numbering: none, header: none)[
  #align(center)[
    #text(size: 25pt, weight: "bold", fill: report-accent)[BridgeX Future Developer Operations & Scale Manual]
    #v(0.6em)
    #text(size: 13pt, fill: luma(80))[A 600-page living reference for architecture, workflow safety, one-million-user growth, operations, and troubleshooting]
    #v(1.8em)
    #line(length: 48%, stroke: 0.5pt + luma(160))
    #v(1.8em)
    #text(size: 10pt)[Edition 1.0 · Generated from the BridgeX repository inventory · #datetime.today().display("[year]-[month]-[day]")]
  ]
]

#page(numbering: none, header: none)[
  #outline(title: [Contents], indent: 1.3em)
]

#counter(page).update(1)
''')

content.append(volume("Volume I — Operating Boundary and Product Model", "This volume establishes the safety boundary: BridgeX provides public discovery and protected execution. It does not make unsupported banking, customs, airline, legal, or identity claims. The source of truth for access is authenticated database policy and protected backend logic, not a client-side visual state."))

foundation_sheets = [
    ("Manual use and change-control contract", "How a new developer should use this publication", "Use this manual as an operating map, then confirm exact current behavior in source code, migration history, and production configuration before making a change.", "docs/BridgeX_Future_Operations_Manual/", "Repository clone, least-privilege access, and a safe test environment", "A documented, reviewable implementation plan", "Never treat screenshots, UI labels, or client code as the sole authority for privacy or payment behavior.", "At larger scale, distribute ownership by domain and retain an explicit service owner for every workflow.", "A peer can follow the plan, locate the source of truth, and reproduce the validation steps."),
    ("Role and permission boundary", "Guest, member, administrator, and super-admin roles", "Separate public discovery from protected execution and prevent privilege from being inferred from a visible screen.", "Supabase RLS, role checks, AdminControl and SuperAdminControl routes", "Authenticated identity, role value, and scoped record identifier", "Only the minimum permitted fields and actions", "Passwords, private documents, payment proofs, private addresses, and unrestricted chat are not public and are not recoverable from UI controls.", "At one million users, authorization must remain database-enforced; never replace RLS with a front-end-only role test.", "Run role-based tests for guest, member, administrator, and super-admin paths."),
    ("One-million-user planning baseline", "Capacity planning before high-concurrency growth", "Scale based on peak concurrent reads, writes, uploads, realtime connections, and payment review volume rather than registered account count.", "docs/BridgeX_Developer_Operations_Handbook.md and future infrastructure configuration", "Measured active users, request rate, database latency, error rate, queue depth, and storage growth", "Capacity decision, budget forecast, and explicit scale trigger", "Do not extrapolate from a single free instance or rely on a platform-wide availability assumption.", "Use staged load testing and admission controls before launch events; separate cacheable public traffic from protected traffic.", "Load-test a staging environment and capture p95 latency, error rate, database CPU, and queue depth."),
]
for row in foundation_sheets:
    content.append(sheet(*row))

content.append('''#pagebreak()
== Core architecture diagrams

#figure(image("assets/bridgex_architecture.png", width: 94%), caption: [Figure: BridgeX public discovery, protected workspace, database controls, storage, and administrator operations.])

#figure(image("assets/bridgex_payment_workflow.png", width: 88%), caption: [Figure: protected payment proof, match opening, delivery release, and traveler payout lifecycle.])

#figure(image("assets/bridgex_incident_response.png", width: 86%), caption: [Figure: incident classification, evidence preservation, decision, notification, and audit record.])
''')

content.append(volume("Volume II — Real Repository and Interface Map", "Every generated sheet in this volume points to a real source file. It records safe modification, diagnostic, and validation expectations without claiming that a filename alone proves an authorization boundary."))

source_files = sorted([p for p in SOURCE_ROOT.rglob("*") if p.suffix in {".ts", ".tsx"} and p.is_file()])
for path in source_files:
    kind, guard = classify(path)
    rel = path.relative_to(ROOT).as_posix()
    symbol_list = symbols(path)
    content.append(sheet(
        f"Source map — {path.name}", kind, f"This sheet documents the real repository unit `{rel}` and its visible exported or local symbols: {symbol_list}.", rel,
        "Caller route, provider state, authenticated user when required, and real database response", "Accessible state, UI transition, or shared helper result appropriate to the route", guard,
        "At scale, profile bundle size, render frequency, response cardinality, and error boundaries for this unit. Keep public lists paginated and do not move private record filtering into the browser.",
        "Run the focused regression coverage, TypeScript validation, and the relevant member/admin flow after modifying this file."
    ))

content.append(volume("Volume III — Database, Storage, and Migration Ledger", "BridgeX production schema changes are forward-only migrations. Each entry below is derived from a real migration filename and should be read alongside the live database definition before a follow-up migration is written."))

migrations = sorted(MIGRATIONS.glob("*.sql"))
for migration in migrations:
    stem = migration.stem
    label = re.sub(r"^\d+_", "", stem).replace("_", " ").title()
    try:
        sql = migration.read_text(encoding="utf-8", errors="ignore")
        creates = ", ".join(re.findall(r"create\s+(?:table|function|policy|trigger)\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)", sql, flags=re.I)[:5]) or "schema, policy, function, or trigger changes"
    except OSError:
        creates = "migration contents require direct inspection"
    content.append(sheet(
        f"Migration ledger — {label}", "Forward-only database change", f"Migration `{migration.name}` introduces or adjusts {creates}.", migration.relative_to(ROOT).as_posix(),
        "A reviewed migration, dependency order, compatible client states, and an explicit rollback/forward-fix plan", "A reproducible production schema transition and matching application behavior", "Never edit an applied production migration. RLS and private-storage changes require negative authorization testing.",
        "At scale, review lock duration, index creation behavior, trigger cost, and backfill strategy. Prefer additive columns, batched backfills, and gradual cutovers.",
        "Apply only after a staging test; verify the exact live definition, policy behavior, and affected RPC/trigger results."
    ))
    content.append(sheet(
        f"Migration runbook — {label}", "Diagnosis and safe follow-up", "This runbook describes how to investigate a failure involving the change represented by `{migration.name}`.", migration.relative_to(ROOT).as_posix(),
        "Incident timestamp, affected record ID, user role, exact SQL/RPC error, and before/after record state", "A minimal corrective migration or verified application correction", "Do not repair a data-integrity incident by weakening an RLS policy, disabling a constraint, or manually exposing private storage.",
        "At scale, capture query plan, database load, and the count of affected rows before choosing a remediation approach.",
        "Confirm the expected state transition, notification recipient, storage authorization, and regression test coverage."
    ))

content.append(volume("Volume IV — Protected Workflow, Payment, Payout, and Messaging Operations", "These sheets define the operational controls for request offers, carry interests, payment proof, protected contact release, delivery confirmation, payout tracking, support, notifications, reviews, and reporting."))

domains = [
    "guest marketplace discovery", "member onboarding", "identity verification", "send-request publication", "carry-listing publication", "traveler offer", "sender interest", "single active traveler selection", "payment request", "payment proof upload", "administrator payment review", "exchange-rate snapshot", "protected match opening", "private contact release", "protected deal chat", "support conversation", "contact enquiry", "notification routing", "push-token registration", "order progress", "delivery confirmation", "traveler payout profile", "traveler payout due", "payout receipt", "completed-order review", "member report", "administrator governance", "super-admin governance", "post editing", "public profile", "media lifecycle", "Android WebView shell", "browser recovery", "Render deployment", "Supabase storage", "database migration"
]

modes = [
    ("normal operation", "Describe the supported member or administrator action and the expected durable state after it completes."),
    ("data integrity", "Confirm every companion record, status value, audit timestamp, and related notification before declaring success."),
    ("authorization", "Verify both positive and negative role cases; client visibility alone is never permission."),
    ("privacy", "Classify each field as public, protected-match, authorized-admin, or private-storage data before it is displayed or signed."),
    ("performance", "Measure p95 latency, database rows scanned, payload size, and render count. Paginate and index before growing concurrency."),
    ("failure diagnosis", "Start from the record ID and timestamp, then trace browser, API/RPC, database, storage, and notification outcomes in order."),
    ("quality assurance", "Write a focused regression test for the business boundary and complete a role-specific manual flow on staging."),
    ("release", "Ship source, migration, tests, configuration notes, and a rollback/forward-fix plan as one reviewed change set."),
    ("observability", "Record metrics, structured error context, audit correlation, alert threshold, and an owner for the service-level objective."),
    ("one-million-user scale", "Move slow work to a queue, cache bounded public reads, protect writes with rate limits, and keep the API stateless for multiple instances.")
]

for domain in domains:
    for mode, directive in modes:
        content.append(sheet(
            f"{domain.title()} — {mode.title()}", "Operational reference sheet", f"{directive} This sheet applies the rule to the `{domain}` domain.",
            "Relevant page, Supabase migration, protected RPC, storage bucket, and notification record identified by the active workflow", "Role-scoped record, valid workflow state, and no unreviewed private-data access", "A bounded state transition, queue action, or documented no-op", "Do not bypass payment review, document security, RLS, recipient routing, or rate limits to make an individual case appear to work.",
            "At scale, isolate this workload from synchronous browser rendering and prevent unbounded reads, uploads, messages, or notifications from consuming shared capacity.",
            "A responsible engineer can reproduce the flow on staging, inspect the durable records, and demonstrate that unauthorized roles receive no private data."
        ))

content.append(volume("Volume V — Troubleshooting, Incident Response, QA, and Future Reliability", "This volume supplies a structured problem-to-solution system. It is intentionally prescriptive about evidence, safe containment, verification, and prevention."))

error_catalog = [
    "blank page or stale JavaScript asset", "Render 502 routing failure", "slow initial service response", "failed authentication callback", "password reset delivery failure", "profile save failure", "verification-document upload failure", "private document authorization failure", "post media upload failure", "offer acceptance failure", "interest capacity conflict", "payment record missing", "payment proof missing in review", "payment method not recorded", "payment verification rejection", "payment QR unavailable", "exchange-rate not published", "protected match not opened", "private contact not revealed", "chat message not delivered", "chat attachment not stored", "notification unread count mismatch", "push token registration failure", "workspace data slow", "marketplace pagination slow", "public profile mismatch", "review submission rejected", "rating count inconsistent", "report creation failure", "administrator queue missing record", "super-admin governance failure", "RLS policy denial", "database constraint denial", "trigger performance regression", "migration ordering failure", "storage signed URL failure", "mobile gallery selection failure", "Android keyboard obstruction", "Android system Back failure", "Android state restore failure", "APK build authorization failure", "Play App Bundle version conflict", "Render deployment unavailable", "custom-domain certificate issue", "CDN stale asset mismatch", "rate-limit false positive", "abuse spike", "malicious file upload", "queue backlog", "cache stampede", "database connection saturation", "read replica lag", "email delivery delay", "realtime connection limit", "audit log omission", "retention deletion failure", "backup restoration exercise", "incident communication", "critical account restriction", "legal escalation handoff"
]

for error in error_catalog:
    content.append(sheet(
        f"Troubleshooting runbook — {error.title()}", "Problem → cause → location → solution", f"Investigate the observed symptom `{error}` with immutable evidence and the smallest safe reproduction.",
        "Browser console/network trace, affected record, protected RPC result, Supabase logs, storage path, deployment log, and monitoring event as applicable", "Timestamp, user/role, record identifier, correlation context, and redacted evidence", "A bounded corrective action, decision record, and verified user-facing outcome", "Do not ask members for passwords, do not expose identity/payment files in support, and do not rewrite history to hide an incident.",
        "At scale, use alert thresholds, sampled tracing, dashboards, queue depth, slow-query data, and error budgets to identify the first failing layer.",
        "Confirm the original symptom is gone, the unauthorized path remains blocked, and a regression test or operational check prevents recurrence."
    ))

qa_domains = ["authentication", "authorization", "public posts", "private media", "payment proof", "payouts", "messages", "notifications", "administrator controls", "mobile wrapper", "deployment", "scale test", "backup", "incident response", "accessibility", "internationalization", "currency display", "storage lifecycle", "search", "rate limits"]
for domain in qa_domains:
    for case in ("happy path", "negative permission", "network interruption", "concurrent update", "large data volume", "release regression"):
        content.append(sheet(
            f"QA catalogue — {domain.title()} / {case.title()}", "Repeatable test specification", f"Use this sheet to define a reproducible {case} test for the `{domain}` domain.",
            "Staging environment, seeded non-sensitive accounts, test data identifiers, and relevant feature flag state", "Explicit preconditions, user role, data state, and expected HTTP/RPC result", "Evidence that the feature works, fails safely, and preserves protected data", "Never use production private documents, payment proof, passwords, or real personal addresses as test fixtures.",
            "At scale, automate the scenario in CI where practical, run load tests separately, and retain performance baseline results for release comparison.",
            "Record result, build/version, responsible reviewer, defects found, and a link to the regression test or incident ticket."
        ))

content.append(volume("Volume VI — References, Governance, and Living-Document Maintenance", "This closing volume establishes update duties. The manual is a governed source: major workflow, storage, payment, privacy, mobile, scaling, or deployment changes require a matching manual update and release record."))

maintenance = [
    "manual versioning", "chapter ownership", "source map refresh", "diagram refresh", "migration ledger refresh", "security review cadence", "access review cadence", "backup exercise cadence", "load-test cadence", "incident drill cadence", "mobile release checklist", "external provider review", "vendor outage communication", "policy review", "data retention review", "translation review", "accessibility review", "cost review", "capacity review", "post-incident review"
]
for item in maintenance:
    content.append(sheet(
        f"Living-manual control — {item.title()}", "Documentation governance sheet", f"Maintain the `{item}` control so this publication stays aligned with the real platform rather than becoming a historical description.",
        "Documentation owner, current release record, change request, affected source/migration, and review date", "Verified change scope and links to implementation evidence", "Updated manual section, owner acknowledgment, and next review date", "Documentation must never reveal credentials, personal documents, payment proofs, private addresses, or security-bypass instructions.",
        "At scale, track documentation coverage as an operational quality metric and require updates during change review rather than after an incident.",
        "A new engineer can locate the source of truth, reproduce the operational workflow, and identify the accountable owner."
    ))

content.append('''#pagebreak()
= References

[1] Supabase, *Production Checklist*, https://supabase.com/docs/guides/deployment/going-into-prod.

[2] Render, *Scaling Render Services*, https://render.com/docs/scaling.

[3] Cloudflare, *Cloudflare Cache*, https://developers.cloudflare.com/cache/.

[4] Existing BridgeX repository migration ledger, source tree, tests, native Android shell, and developer operations documents inspected during this edition's generation.

#pagebreak()
#align(center)[
  #text(size: 16pt, weight: "bold", fill: report-accent)[End of Edition 1]
  #v(0.75em)
  This manual is a living technical reference. Update it whenever BridgeX changes a protected workflow, storage policy, database migration, role boundary, mobile release, deployment path, or scaling assumption.
]
''')

(OUT / "main.typ").write_text("\n".join(content), encoding="utf-8")

asset_source = ROOT / "docs" / "BridgeX_Developer_Manual_Native" / "assets"
asset_target = OUT / "assets"
asset_target.mkdir(parents=True, exist_ok=True)
for asset in ("bridgex_architecture.png", "bridgex_payment_workflow.png", "bridgex_incident_response.png"):
    shutil.copy2(asset_source / asset, asset_target / asset)

print(f"Generated {OUT / 'main.typ'} with {sum(1 for line in content if '#pagebreak()' in line)} explicit page boundaries.")
