from pathlib import Path
from generate_revised_manual import (
    ACTION_PLANS,
    CHAPTER_EXPLANATIONS,
    CHAPTER_SOURCES,
    CHAPTERS,
    scale_note,
)

ROOT = Path(__file__).resolve().parent

REFERENCE_BY_CHAPTER = {
    1: "Use the repository README, this manual, the Team_Handover_2026 package, and the current main-branch commit as the operating record. Do not treat an old download, a screenshot, or a remembered instruction as authoritative source state.",
    2: "Use Git history, code review, migration sequence, task tracker, release notes, and build artifacts as evidence. Work that has no commit, test result, or reviewer is not ready for a production handover.",
    3: "Trace web behavior from apps/web/client/src/App.tsx into the named page, shared components, Supabase call, and loading/error branch. A route is complete only when all states render safely for all intended roles.",
    4: "Confirm the exact protection exists in both client experience and database rules. The final authority must be Supabase Auth, RLS, private Storage access, and protected RPC behavior, not a conditional React button alone.",
    5: "Keep language, theme, responsive layout, accessibility, and SEO changes in shared layers when they affect multiple views. Review actual rendered content rather than assuming a preference value automatically changes every screen.",
    6: "Trace native work from NativeApp.tsx to the screen module and lib/api.ts. Keep Expo configuration, Android version metadata, package identity, and EAS profile decisions in the same release record.",
    7: "Use physical-device evidence when an issue involves keyboard positioning, back navigation, gallery/document selection, device memory, background recovery, or vendor-specific Android behavior.",
    8: "Treat supabase/migrations as the durable database change record. Read existing fields, constraints, policies, functions, and indexes before deciding whether a new migration is needed.",
    9: "Use an explicit role/action matrix for every private data operation. A query must be denied to the wrong actor even if that actor can discover a page URL or call the backend outside the UI.",
    10: "Treat each file as a private object governed by its bucket, object key, metadata row, signed read URL, upload rule, retention date, and deletion decision. The database stores references; Storage stores bytes.",
    11: "Map a post through open, response, payment-pending, matched, completed, archived, and deleted/hidden rules. Public feed queries must return only the intended public state and fields.",
    12: "Use constrained payment and order states. Preserve evidence metadata and audit decisions; do not advertise manual proof review as a banking, escrow, insurance, or regulated payment service without the necessary provider and legal basis.",
    13: "Use stable account IDs and conversation IDs. Never identify a conversation by a display name, and never let an unread count or realtime subscription cause a user to view another member’s private conversation.",
    14: "Operate the control panel through purpose-specific queues and person/record detail pages. Administrators should see only the data needed for their assigned decision and should leave a reasoned audit outcome.",
    15: "Make release identity reproducible: source commit, app version, Android version code, package/bundle identifier, EAS profile, artifact checksum, test device, reviewer, and distribution channel must be known before publishing.",
    16: "Measure actual server, network, client, database, and Storage performance separately. A slow first request to a sleeping free host is not the same defect as a slow route bundle or an unindexed query.",
    17: "Separate source, schema, database data, Storage objects, credentials, domains, build identities, and provider configuration. A migration succeeds only after each responsibility is moved, verified, and recoverable.",
    18: "Preserve evidence before repair. Capture the affected route, user role, timestamp, request/error, app or web version, logs, data impact, and the exact containment action taken.",
}

COMMANDS_BY_CHAPTER = {
    1: "git status --short && git log --oneline -5",
    2: "git diff --check && git status --short",
    3: "cd apps/web && pnpm test && pnpm build",
    4: "Run signed-out, owner, unrelated member, admin, and super-admin authorization checks",
    5: "Test desktop/mobile widths, keyboard navigation, contrast, light/dark/system mode, and every supported language",
    6: "cd apps/mobile && npx tsc --noEmit && node tests/native-architecture.test.mjs",
    7: "Test a physical Android device: keyboard, Back, file picker, slow network, background/foreground, and fresh launch",
    8: "Read the existing migration, add a new timestamped migration, stage it, then verify schema and affected flows",
    9: "Exercise every sensitive operation with guest, owner, unrelated member, admin, and super-admin roles",
    10: "Upload a test object, verify metadata and signed access, deny unrelated access, then test authorized retention deletion",
    11: "Verify public feed filters, post lifecycle, duplicate responses, owner workspace visibility, and participant-only match details",
    12: "Verify proof prerequisites, payment-review queue visibility, authorized decision, match creation, and participant notifications",
    13: "Send and read a protected message; test realtime, unread state, same-name isolation, and admin safety review authorization",
    14: "Test each admin action with a non-admin, ordinary admin, and super-admin; verify audit outcome and member notice",
    15: "Run web tests/build plus native compiler/tests; inspect the completed artifact before publishing any download link",
    16: "Compare cold-request and warm-navigation timing; inspect bundle, query, Storage, and deployment logs before optimizing",
    17: "Rehearse source/schema/data/Storage export and restore in isolation; compare checksums, row counts, object counts, and critical flows",
    18: "Capture logs and reproduction steps, contain impact, apply a tested fix, verify recovery, and write an incident record",
}

MIGRATION_BY_CHAPTER = {
    1: "For an organizational handover, transfer repository ownership and access roles before operational credentials. Add the receiving technical lead as a named individual, then rotate privileged values after the new ownership is confirmed.",
    2: "When changing process or vendor, preserve the change log, approvals, and deployment history. A new team should be able to rebuild the release decision from Git and documented operational evidence.",
    3: "If the web client moves to another host, first reproduce the approved build, environment variables, OAuth redirects, allowed origins, and domain routing in staging. Cut DNS only after public and authenticated flows pass.",
    4: "If Auth or authorization moves away from Supabase, map every current role, session, ownership rule, RLS policy, signed-media permission, and administrator action into the target authorization service before switching clients.",
    5: "When replacing the frontend framework or localization layer, extract copy, route metadata, themes, and tokens into versioned resources first. Run visual/accessibility regression checks before changing user-facing URLs.",
    6: "When moving mobile build tooling, preserve package identity, application IDs, signing ownership, store listing records, deep links, and notification configuration. A new build account must not accidentally produce an unrelated application identity.",
    7: "For a mobile platform migration, maintain a real-device validation matrix and retain representative test devices. Device-specific regressions should not be inferred from a desktop browser test.",
    8: "To move Postgres, export schema, extensions, rows, sequences, constraints, indexes, and migration ledger. Restore in staging, compare row counts and foreign keys, then validate protected application flows before cutover.",
    9: "RLS cannot be copied as a simple UI rule. Reimplement its authorization semantics in target APIs, prove allow/deny behavior with a role matrix, and retain tests that run against the target service.",
    10: "Copy Storage objects with their object-key manifest, content type, size, checksum, retention status, and access classification. Replace signed URL generation in the target backend before pointing clients to the new store.",
    11: "Keep public post projections and protected participant details separate during migration. Recreate lifecycle constraints and status transition guards before importing active marketplace records.",
    12: "Migrate payment-proof data only under authorized data-transfer terms. Preserve audit status and evidence references, but re-evaluate retention and regulatory responsibility before enabling the target workflow.",
    13: "For realtime/chat replacement, migrate stable conversation/member IDs first, preserve message order and read states, then run participant-isolation tests before enabling subscriptions for live users.",
    14: "Move operational queues with least privilege. Preserve decision history, reviewer reason, timestamps, and evidence links; do not give the new provider or team unrestricted historical exports by default.",
    15: "Transfer store and signing ownership only through official provider processes. Preserve artifact history and version codes so future updates remain accepted by Google Play or Apple systems.",
    16: "A Render migration requires a provider-equivalent deployment contract: build command, start command, secrets, health behavior, custom-domain configuration, logs, alerting, and rollback domain path.",
    17: "Use a staged cutover: inventory, export, target build, rehearsal restore, functional comparison, short write freeze or delta strategy, DNS/API switch, monitoring, and reversible rollback. Do not move production directly from a zip file.",
    18: "After any provider or security incident, restore only from verified backups, validate authorization and private media before reopening traffic, and rotate privileged credentials that could have been exposed during investigation.",
}

def esc(value):
    return value.replace("#", "\\#").replace("[", "\\[").replace("]", "\\]")

def sentence_breaks(items):
    return "\n#v(0.22em)\n".join([f"{idx + 1}. {esc(item)}" for idx, item in enumerate(items)])

def page_block(page_no, chapter_no, chapter_title, topic, topic_index):
    sources = " · ".join(CHAPTER_SOURCES[chapter_no])
    action_steps = sentence_breaks(ACTION_PLANS[chapter_no])
    return f'''#page(margin: (top: 1.12cm, bottom: 1.02cm, x: 1.3cm), header: none)[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 8.25pt)
#text(size: 7pt, fill: report-accent)[BRIDGEX DEVELOPER OPERATIONS MANUAL · CHAPTER {chapter_no:02d} · PAGE {page_no:03d}/200]
#v(0.22em)
#text(size: 16pt, weight: "bold", fill: report-accent)[{esc(topic)}]
#v(0.18em)
#text(size: 7.8pt, fill: luma(95))[Chapter {chapter_no:02d}: {esc(chapter_title)} · Implementation procedure {topic_index:02d} of 11]
#v(0.45em)
#grid(columns: (1fr, 1fr), gutter: 12pt,
[
*1. Current architecture and decision boundary*
#v(0.22em)
{esc(CHAPTER_EXPLANATIONS[chapter_no])}
#v(0.35em)
*2. Source map and dependencies*
#v(0.22em)
#text(font: "DejaVu Sans Mono", size: 6.85pt)[{esc(sources)}]
#v(0.28em)
{esc(REFERENCE_BY_CHAPTER[chapter_no])}
#v(0.35em)
*3. Before you change anything*
#v(0.22em)
Define the desired observable result for {esc(topic.lower())}, identify the affected users and private data, list the routes/screens and database objects touched, and decide whether the change is reversible. Make a before-state record with source commit, current status, error text if any, and a safe test account or record. Never use a live member’s private document, payment proof, or message as a development fixture.
],
[
*4. What to do and how to do it*
#v(0.22em)
{action_steps}
])
#v(0.45em)
*5. Test, release, and rollback evidence*
#v(0.22em)
Run: #text(font: "DejaVu Sans Mono", size: 7.15pt)[{esc(COMMANDS_BY_CHAPTER[chapter_no])}]. Then exercise the user journey with the correct actor and a denied actor where authorization applies. Verify the rendered result, database/RPC result, private-media access outcome, notifications if relevant, and server/device logs. Record the approved commit and release identity. If the change fails, stop further writes, return the application to the prior verified revision, preserve evidence, and correct data only through an authorized migration or protected administrative action.
#v(0.42em)
*6. Future growth and maintenance*
#v(0.22em)
{esc(scale_note(chapter_no, topic))}
#v(0.42em)
*7. Future infrastructure change or provider migration*
#v(0.22em)
{esc(MIGRATION_BY_CHAPTER[chapter_no])}
#align(right)[#text(size: 7pt, fill: luma(112))[BridgeX technical handover · page {page_no:03d} of 200]]
]'''

def title_page():
    return '''#page(margin: (top: 31%, x: 2.2cm), numbering: none, header: none)[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 10pt)
#align(center)[
#text(size: 28pt, weight: "bold", fill: report-accent)[BridgeX Developer Operations Manual]
#v(0.45em)
#text(size: 14pt, fill: luma(85))[Text-first technical handbook for web, mobile, data, operations, growth, and migration]
#v(2.0em)
#line(length: 45%, stroke: 0.7pt + report-accent)
#v(2.0em)
#text(size: 10pt)[200 detailed source-specific procedures]
#v(0.45em)
#text(size: 8.5pt, fill: luma(102))[This edition contains no graphs, charts, pictures, captions, logos, or external author attribution.]
]
]'''

def contents_page():
    items = []
    for idx, (number, title, _, _) in enumerate(CHAPTERS):
        start = 3 + idx * 11
        items.append(f"#text(size: 7.25pt)[{number}. {title} · pp. {start}–{start+10}]")
    left, right = "\n".join(items[:9]), "\n".join(items[9:])
    return f'''#page(margin: (top: 1.2cm, bottom: 1.1cm, x: 1.55cm), header: none)[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 8.3pt)
#text(size: 20pt, weight: "bold", fill: report-accent)[How to use this manual]
#v(0.4em)
Each of the following pages is a source-specific operating procedure. Read the current architecture and source map first; follow the implementation instructions next; then use the testing, rollback, growth, and migration sections before releasing a change. The manual is deliberately honest about present architecture and future work. It does not claim that a roadmap item is already built.
#v(0.7em)
#grid(columns: (1fr, 1fr), gutter: 10pt, [{left}], [{right}])
#v(0.6em)
#block(fill: luma(245), radius: 6pt, inset: 9pt)[*Security and transfer rule:* ordinary source documentation can be shared with an authorized team. Live credentials, service keys, passwords, signing material, user documents, payment evidence, private messages, and production exports must be transferred only through a controlled authorized process and rotated when ownership changes.]
#align(right)[#text(size: 7pt, fill: luma(112))[BridgeX technical handover · page 002 of 200]]
]'''

def main():
    out = [
        '// Generated by generate_text_manual.py. Text-first edition without figures, images, captions, logos, or external author attribution.\n',
        '#import "report-theme.typ": report-accent, report-theme\n',
        '#show: report-theme.with(title: none, author: none, rhythm: "longform", running-header: false)\n',
        title_page(),
        contents_page(),
    ]
    page = 3
    for chapter_no, (number, title, focus, topics) in enumerate(CHAPTERS, start=1):
        for topic_index, topic in enumerate(topics, start=1):
            out.append(page_block(page, chapter_no, title, topic, topic_index))
            page += 1
    assert page == 201
    (ROOT / "main.typ").write_text("\n\n".join(out), encoding="utf-8")
    print("Generated text-first 200-page BridgeX developer operations manual source.")

if __name__ == "__main__":
    main()
