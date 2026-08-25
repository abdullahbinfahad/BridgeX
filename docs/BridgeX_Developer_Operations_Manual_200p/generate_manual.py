from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

CHAPTERS = [
    ("01", "Product Orientation and System Boundaries", "Define what BridgeX is, which data it owns, and where product claims must stop.", [
        "Platform purpose and operating boundaries", "Current stack and service inventory", "Repository topology and source ownership", "Public, member, administrator, and super-administrator roles", "Truthful feature-status ledger", "Environment taxonomy: local, staging, and production", "Configuration inventory without secret values", "Domain, app identity, and release identifiers", "How to read the migration history", "Decision records and release notes", "First-week technical onboarding"
    ]),
    ("02", "Git, Collaboration, and Change Control", "Use a disciplined review and release process so a small team can change BridgeX safely.", [
        "Branching and protected main branch", "Commit messages and linked work items", "Code review responsibilities", "Pre-merge validation", "Database migration review", "Feature flags and reversible changes", "Dependency update policy", "Release notes and user-facing language", "Handling incomplete or blocked work", "Repository hygiene and archive rules", "Part-time developer handoff ritual"
    ]),
    ("03", "Web Frontend Architecture", "Maintain the React and Vite web client without breaking public browsing or protected workflows.", [
        "Web application entry points", "Public versus member route boundaries", "Administrative route protection", "Marketplace data-loading pattern", "Public layout, header, and footer behavior", "Workspace and dashboard navigation", "Detail-page escape routes", "Component ownership and reuse", "Error boundaries and chunk recovery", "Bundle-size measurement and code splitting", "Web frontend change checklist"
    ]),
    ("04", "Web Authentication, Authorization, and Privacy", "Keep every sensitive route and query protected by server-side controls, not only visible UI.", [
        "Session hydration and authenticated shell", "Guest browsing boundaries", "Member identity and profile data", "Administrator and super-administrator gates", "Password-reset safety rule", "Private contact information", "Verification-document review boundary", "Public member-profile minimization", "Audit-safe administrative actions", "Access-control regression tests", "Authorization incident response"
    ]),
    ("05", "Web Experience, Accessibility, Language, and Theme", "Make the web product readable, responsive, meaningful in every supported language, and safe to use.", [
        "Responsive layout contract", "Visual design tokens and contrast", "Keyboard and focus behavior", "Mobile three-dot menu behavior", "Language-selection architecture", "Translation completeness review", "Light, dark, and system theme", "Motion and sound accessibility", "Form labels and validation copy", "SEO and crawler-facing content", "Web usability test script"
    ]),
    ("06", "Native Mobile Architecture", "Maintain the independent Expo and React Native client as a real application, not a web wrapper.", [
        "Native app shell and route state", "Expo configuration and package identity", "Android native directory authority", "Screen module boundaries", "Native Supabase API layer", "Appearance and local preferences", "Native language context", "Profile avatar and signed-media loading", "Client caching and pagination", "Foreground versus background behavior", "Native architecture regression checks"
    ]),
    ("07", "Mobile Interaction and Device Reliability", "Resolve real-device concerns including keyboards, file pickers, back navigation, and slow networks.", [
        "Keyboard-safe message and form layouts", "Android system Back behavior", "Fresh launch and route restore policy", "Offline and unreliable-network states", "Image and document selection", "Compressed upload feedback", "Notifications and unread badges", "Marketplace filters and category color", "Updates pagination and read status", "Supported Android release testing", "Mobile accessibility and reduced motion"
    ]),
    ("08", "Supabase Data Model and Migrations", "Treat the migration history as the source of truth for database evolution and business rules.", [
        "Supabase project responsibilities", "Migration naming and ordering", "Schema inspection before change", "Tables, foreign keys, and constraints", "Indexes and measured query performance", "Status fields and legal state transitions", "RPC functions and transactional operations", "Read models and pagination", "Safe data correction process", "Migration rehearsal and rollback planning", "Production migration acceptance"
    ]),
    ("09", "Row-Level Security and Secure RPC Design", "Preserve privacy with policies, role checks, and narrow functions rather than broad client permission.", [
        "RLS as the primary data boundary", "Guest read policies", "Member ownership policies", "Administrator role policies", "Security-definer function checklist", "Avoiding policy recursion", "Support conversation privacy", "Protected order and payment privacy", "Service-role key containment", "RLS test matrix", "Responding to permission errors"
    ]),
    ("10", "Storage, Media, and Retention", "Store media outside database rows, use signed URLs, and delete only through authorized retention workflows.", [
        "Storage bucket classification", "Signed URL lifetime and access", "Request and listing media", "Verification documents", "Payment-proof images", "Report evidence", "Compression and media limits", "Storage metadata and database references", "Retention and release cleanup", "Storage deletion through the API", "Media incident and recovery procedure"
    ]),
    ("11", "Marketplace, Posts, Offers, and Interests", "Maintain accurate public feeds while enforcing private lifecycle transitions and lawful-item constraints.", [
        "Public marketplace query contract", "Post composer data requirements", "Request categories and service types", "Carry-space inventory and remaining capacity", "Offer submission workflow", "Interest submission workflow", "Duplicate-response handling", "Acceptance prerequisites", "Hiding matched posts from public feed", "Member post editing and deletion", "Marketplace regression scenarios"
    ]),
    ("12", "Protected Orders and Payment-Proof Workflow", "Keep the payment-proof and match process conservative, traceable, and accurate about its limitations.", [
        "Order lifecycle states", "Accept and request payment entry point", "Payment record creation", "Proof submission requirements", "Administrator payment review", "Verified match opening", "Counterpart contact disclosure", "Traveler payout detail privacy", "Delivery, release, and completed history", "Disputes and operational holds", "Payment workflow test matrix"
    ]),
    ("13", "Messaging, Updates, and Realtime", "Operate chat and notifications as private, paginated systems with correct unread counts and safety review.", [
        "Deal conversation creation", "Support conversation creation", "Participant identity and same-name safety", "Message retrieval and pagination", "Realtime delivery design", "Unread count rules", "Updates versus messages", "Administrator chat review", "Notification delivery failure handling", "Sound and in-app alerts", "Messaging privacy test matrix"
    ]),
    ("14", "Administrator and Operations Console", "Use least privilege, person-centred review, and traceable outcomes for platform operations.", [
        "Administrator navigation and badge counts", "User review and restriction", "Verification review workflow", "Report review and evidence handling", "Requests and carry-listing operations", "Protected order oversight", "Payment verification and traveler payouts", "Contact enquiries and BridgeX Admin support", "Chat safety review", "Currency-rate administration", "Admin offboarding and audit review"
    ]),
    ("15", "Quality Assurance and Mobile Release Engineering", "Turn source changes into verified web and mobile releases with reproducible evidence.", [
        "Test strategy and regression ownership", "Web test and production build", "Native compiler and architecture test", "Browser and device matrix", "Android versioning and artifacts", "EAS profiles and build identity", "APK archive inspection", "Google Play AAB preparation", "iOS signing and TestFlight prerequisites", "Release rollback and communication", "Release approval checklist"
    ]),
    ("16", "Deployment, Performance, and Observability", "Keep the web service responsive while measuring real bottlenecks and documenting hosting limits honestly.", [
        "Render deployment configuration", "Cold-start limitations", "Caching and stale-data control", "Asset and bundle optimization", "Database query observation", "Client error collection", "Server and deployment logs", "Availability and health checks", "Rate limits and abuse controls", "Performance incident triage", "Operational dashboard metrics"
    ]),
    ("17", "Scaling, Backups, and Infrastructure Migration", "Scale after measurement, create restore-tested backups, and migrate services through rehearsed cutovers.", [
        "Pilot-to-growth scaling gates", "One-thousand-user operating plan", "Ten-thousand-user operating plan", "Hundred-thousand-user architecture review", "Source and configuration backups", "Database export and restore drill", "Storage manifest and object recovery", "Render-to-new-host migration", "Supabase-to-new-backend migration", "DNS cutover and rollback", "Buyer and ownership transfer"
    ]),
    ("18", "Troubleshooting, Security Incidents, and Continuity", "Give future operators exact evidence to collect and safe steps to take under pressure.", [
        "Incident severity and communication", "Blank screen or chunk-load recovery", "Slow route and query diagnosis", "RLS violation diagnosis", "Upload and signed-URL failure", "Message or notification failure", "Payment-state constraint failure", "Android loading and sign-in failure", "Data exposure response", "Credential rotation and access recovery", "Ninety-day continuity plan"
    ]),
]

PALETTE = [
    (15, 48, 87), (22, 90, 128), (35, 121, 100), (176, 86, 56),
    (139, 75, 153), (176, 130, 34), (57, 86, 158), (40, 120, 162),
]

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()

def draw_wrapped(draw, xy, text, font_obj, fill, width, spacing=6):
    x, y = xy
    words = text.split()
    lines, line = [], ""
    for word in words:
        candidate = (line + " " + word).strip()
        if draw.textlength(candidate, font=font_obj) <= width:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    for value in lines:
        draw.text((x, y), value, font=font_obj, fill=fill)
        y += font_obj.size + spacing
    return y

def create_visual(page_no, chapter_no, chapter, topic, subtitle):
    color = PALETTE[(chapter_no - 1) % len(PALETTE)]
    accent = PALETTE[(chapter_no + 2) % len(PALETTE)]
    canvas = Image.new("RGB", (1600, 620), (246, 249, 252))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((20, 20, 1580, 600), radius=28, fill=(255, 255, 255), outline=(218, 227, 236), width=3)
    draw.rounded_rectangle((50, 54, 500, 160), radius=20, fill=color)
    draw.text((78, 78), f"CHAPTER {chapter_no:02d}", font=font(BOLD, 30), fill=(255, 255, 255))
    draw.text((78, 115), f"PAGE {page_no:03d} / 200", font=font(FONT, 20), fill=(222, 239, 250))
    draw_wrapped(draw, (545, 66), topic, font(BOLD, 42), (24, 43, 63), 930, 5)
    nodes = ["Input", "Control", "Evidence", "Decision", "Outcome"]
    x_positions = [80, 365, 650, 935, 1220]
    y = 300
    for idx, label in enumerate(nodes):
        fill = color if idx in (0, 4) else accent if idx == 2 else (231, 239, 247)
        text_fill = (255, 255, 255) if idx in (0, 2, 4) else (24, 43, 63)
        draw.rounded_rectangle((x_positions[idx], y, x_positions[idx] + 220, y + 110), radius=24, fill=fill, outline=(208, 220, 232), width=2)
        tw = draw.textlength(label, font=font(BOLD, 25))
        draw.text((x_positions[idx] + 110 - tw / 2, y + 22), label, font=font(BOLD, 25), fill=text_fill)
        if idx < len(nodes) - 1:
            draw.line((x_positions[idx] + 220, y + 55, x_positions[idx + 1] - 18, y + 55), fill=color, width=8)
            draw.polygon([(x_positions[idx + 1] - 18, y + 55), (x_positions[idx + 1] - 38, y + 42), (x_positions[idx + 1] - 38, y + 68)], fill=color)
    draw_wrapped(draw, (90, 470), subtitle, font(FONT, 23), (76, 94, 113), 1400, 5)
    canvas.save(ASSETS / f"page_{page_no:03d}.png", optimize=True)

def esc(value):
    return value.replace("#", "\\#").replace("[", "\\[").replace("]", "\\]")

def page_block(page_no, chapter_no, chapter_title, chapter_focus, topic, page_in_chapter):
    source_map = {
        1: "README.md; docs/Team_Handover_2026; apps/web; apps/mobile; supabase/migrations",
        2: "GitHub main branch; implementation tracker; release notes; migration review records",
        3: "apps/web/client/src/App.tsx; pages; components/bridgex; PublicLayout.tsx",
        4: "apps/web/client/src/App.tsx; role-aware routes; Supabase Auth and RLS policies",
        5: "apps/web/client/src; language/theme contexts; public SEO files and layout components",
        6: "apps/mobile/src/NativeApp.tsx; screens; lib/api.ts; app.json; eas.json",
        7: "apps/mobile/src/screens; hooks; native Android configuration; test devices",
        8: "supabase/migrations; application queries; RPC definitions; migration acceptance records",
        9: "supabase/migrations; RLS policies; protected RPCs; role checks",
        10: "Supabase Storage buckets; signed URL helper calls; media metadata fields",
        11: "Marketplace pages/screens; posts, offers, carry listings, and interest workflows",
        12: "Order/payment migrations; payment pages/screens; protected status transition functions",
        13: "MessagesScreen.tsx; contact-enquiry migration; notifications and unread-count RPC",
        14: "Admin routes/screens; verification, reports, payment review, enquiries, and safety flows",
        15: "apps/web package scripts; apps/mobile tests; app.json; android/app/build.gradle; eas.json",
        16: "render.yaml; apps/web build output; .manus logs; browser and network logs",
        17: "docs/Team_Handover_2026/03_SCALING_AND_MIGRATION_RUNBOOK.md; migration history; provider consoles",
        18: "incident log; deployment logs; client error evidence; secure credential register",
    }[chapter_no]
    command_map = {
        1: "git status --short && git log --oneline -5",
        2: "git diff --check && git status --short",
        3: "cd apps/web && pnpm test && pnpm build",
        4: "Review signed-out, member, admin, and super-admin behavior before release",
        5: "Check keyboard navigation, contrast, small screens, and meaningful translated copy",
        6: "cd apps/mobile && npx tsc --noEmit && node tests/native-architecture.test.mjs",
        7: "Test on a physical Android device with keyboard, file picker, Back key, and slow network",
        8: "Read existing migration, create a new timestamped migration, then stage and verify it",
        9: "Exercise every table and RPC with guest, owner, unrelated member, admin, and super-admin roles",
        10: "Use private buckets plus short-lived signed URLs; never expose object paths as public data",
        11: "Verify public feed status=open and participant-only visibility after acceptance",
        12: "Confirm proof metadata exists before admin review; do not expose counterpart details early",
        13: "Open the conversation, verify read state, then test a new realtime message without refresh",
        14: "Record reviewer, timestamp, decision reason, and user-visible outcome for every sensitive action",
        15: "Run web tests/build and native compiler/tests before creating an EAS release artifact",
        16: "Measure query, bundle, navigation, and hosting wake-up latency before changing architecture",
        17: "Rehearse export, restore, integrity comparison, cutover, and rollback in a non-production environment",
        18: "Capture exact error, role, route, request, app version, timestamp, and safe reproduction steps",
    }[chapter_no]
    why = f"This page explains {topic.lower()}. {chapter_focus} Treat the documented behavior as a safety and continuity requirement: change it only after the affected user journey, authorization boundary, data rule, and rollback path have been checked."
    procedure = f"Start by locating the current implementation in {source_map}. Compare the observed behavior with the migration history and the task tracker. Make the smallest reversible change, add a regression check, and capture a concise release note that states both the intended result and any remaining limitation."
    acceptance = f"Acceptance evidence for {topic.lower()} is not a screenshot alone. It includes an authorized user test, an unauthorized-user rejection where applicable, a reviewed data result, and a verified rollback or recovery action. Escalate if the change modifies personal data, payment evidence, identity review, message access, or role authority."
    return f'''#page(margin: (top: 1.15cm, bottom: 1.05cm, x: 1.35cm))[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 8.65pt)
#align(left)[#text(size: 7.5pt, fill: report-accent)[BRIDGEX DEVELOPER OPERATIONS MANUAL · CHAPTER {chapter_no:02d} · PAGE {page_no:03d}/200]]
#v(0.32em)
#text(size: 17pt, weight: "bold")[{esc(topic)}]
#v(0.32em)
#text(size: 8.3pt, fill: luma(88))[Chapter {chapter_no:02d}: {esc(chapter_title)} · Topic {page_in_chapter:02d} of 11]
#v(0.7em)
#figure(image("assets/page_{page_no:03d}.png", width: 100%), caption: [Visual procedure map: input, control, evidence, decision, and outcome.])
#v(0.35em)
#grid(columns: (1fr, 1fr), gutter: 11pt,
[
*Why this matters*
#v(0.38em)
{esc(why)}
],
[
*Implementation procedure*
#v(0.38em)
{esc(procedure)}
])
#v(0.65em)
#block(fill: luma(245), radius: 6pt, inset: 9pt)[
*Acceptance and safety check*
#v(0.38em)
{esc(acceptance)}
]
#v(0.65em)
#block(fill: rgb("E9F2F8"), radius: 6pt, inset: 8pt)[
*Operational reference*
#v(0.38em)
#text(font: "DejaVu Sans Mono", size: 7.3pt)[{esc(command_map)}]
]
#v(0.5em)
#text(size: 7.2pt, fill: luma(105))[Source context: {esc(source_map)}]
#align(right)[#text(size: 7.3pt, fill: luma(110))[BridgeX technical handover · page {page_no:03d} of 200]]
]'''

def title_page():
    return '''#page(margin: (top: 1.65cm, bottom: 1.2cm, x: 1.7cm), numbering: none, header: none)[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 10pt)
#v(1.5cm)
#align(center)[
#text(size: 28pt, weight: "bold", fill: report-accent)[BridgeX Developer Operations Manual]
#v(0.45em)
#text(size: 14pt, fill: luma(85))[A 200-page visual handbook for web, mobile, data, security, operations, releases, scaling, and continuity]
#v(1.2em)
#image("assets/page_001.png", width: 95%)
#v(1.1em)
#text(size: 10pt)[Prepared for the BridgeX technical and operations team]
#v(0.5em)
#text(size: 8.6pt, fill: luma(105))[Truth rule: implemented capability, in-progress work, and future roadmap are explicitly distinguished. This book never treats a planned feature as a completed production capability.]
]
]'''

def contents_page():
    content_lines = [f"#text(size: 7.1pt)[{number}. {title} · pp. {3 + idx * 11}–{3 + idx * 11 + 10}]" for idx, (number, title, _, _) in enumerate(CHAPTERS)]
    chapters_left = "\\n".join(content_lines[:9])
    chapters_right = "\\n".join(content_lines[9:])
    return f'''#page(margin: (top: 1.2cm, bottom: 1.1cm, x: 1.55cm), header: none)[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 9pt)
#text(size: 18pt, weight: "bold", fill: report-accent)[How to use this manual]
#v(0.25em)
#text(size: 7.7pt)[Each of the following 198 operational pages pairs a focused procedure with a visual map. Use the source-context line to find the implementation, the acceptance check to decide whether a change is complete, and the operational reference as a safe starting command or test pattern.]
#v(0.32em)
#image("assets/page_002.png", width: 75%)
#v(0.3em)
#grid(columns: (1fr, 1fr), gutter: 9pt, [{chapters_left}], [{chapters_right}])
#v(0.3em)
#block(fill: luma(245), radius: 6pt, inset: 6pt)[*Critical rule:* never place secrets, private user evidence, payment proofs, ID documents, passwords, or privileged service credentials in Git, routine Drive folders, screenshots, test fixtures, or general handover archives.]
#align(right)[#text(size: 7.3pt, fill: luma(110))[BridgeX technical handover · page 002 of 200]]
]'''

def main():
    # Title and contents visual assets
    create_visual(1, 1, "Cover", "BridgeX technical handover", "A source-backed manual for maintaining a private marketplace platform safely.")
    create_visual(2, 1, "Contents", "Manual navigation", "Every technical page contains a visual procedure map and source-context pointer.")
    pieces = [
        '// Generated by generate_manual.py. Do not edit manually; update the source generator and regenerate.\n',
        '#import "report-theme.typ": report-accent, report-theme\n',
        '#show: report-theme.with(title: "BridgeX Developer Operations Manual", author: "Manus AI", rhythm: "report", running-header: true)\n',
        title_page(),
        contents_page(),
    ]
    page_no = 3
    for chapter_no, (number, title, focus, topics) in enumerate(CHAPTERS, start=1):
        for page_in_chapter, topic in enumerate(topics, start=1):
            create_visual(page_no, chapter_no, title, topic, focus)
            pieces.append(page_block(page_no, chapter_no, title, focus, topic, page_in_chapter))
            page_no += 1
    assert page_no == 201, page_no
    (ROOT / "main.typ").write_text("\n\n".join(pieces), encoding="utf-8")
    print("Generated 200-page BridgeX manual source with 200 visual assets.")

if __name__ == "__main__":
    main()
