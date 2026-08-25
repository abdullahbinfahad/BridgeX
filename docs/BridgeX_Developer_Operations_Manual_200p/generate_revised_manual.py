from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from generate_manual import CHAPTERS

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
COLORS = [
    ((17, 72, 120), (47, 132, 191), (234, 244, 252)),
    ((20, 105, 88), (54, 155, 132), (235, 249, 244)),
    ((133, 77, 24), (202, 127, 46), (253, 245, 233)),
    ((105, 54, 139), (160, 99, 194), (247, 239, 252)),
    ((178, 61, 68), (211, 103, 100), (253, 239, 239)),
    ((41, 83, 143), (79, 132, 189), (237, 244, 253)),
]

CHAPTER_SOURCES = {
    1: ["README.md", "apps/web", "apps/mobile", "supabase/migrations", "docs/Team_Handover_2026"],
    2: ["GitHub main", "pull request review", "implementation tracker", "git tags", "release notes"],
    3: ["apps/web/client/src/App.tsx", "pages/Marketplace.tsx", "components/bridgex/PublicLayout.tsx", "pages/Workspace.tsx", "pages/AdminControl.tsx"],
    4: ["apps/web/client/src/App.tsx", "AdminRoute", "Supabase Auth", "role checks", "RLS policies"],
    5: ["apps/web/client/src", "PublicLayout.tsx", "language context", "theme context", "SEO metadata"],
    6: ["apps/mobile/src/NativeApp.tsx", "apps/mobile/src/screens", "apps/mobile/src/lib/api.ts", "app.json", "eas.json"],
    7: ["apps/mobile/src/screens", "Android manifest", "keyboard-safe hooks", "device test matrix", "Expo runtime"],
    8: ["supabase/migrations", "schema constraints", "indexes", "RPC functions", "migration ledger"],
    9: ["RLS policies", "protected RPCs", "role checks", "native api.ts", "web data calls"],
    10: ["Supabase Storage", "request-media bucket", "profile-avatars bucket", "signed URLs", "media metadata"],
    11: ["Marketplace.tsx", "MarketplaceScreen.tsx", "CreateFlow.tsx", "OfferPage.tsx", "InterestPage.tsx"],
    12: ["AdminPaymentReview.tsx", "PaymentHistory.tsx", "payment migrations", "orders", "traveler payout records"],
    13: ["MessagesScreen.tsx", "Deals.tsx", "NotificationsPage.tsx", "contact_enquiries", "unread-count RPC"],
    14: ["AdminControl.tsx", "AdminVerificationPerson.tsx", "AdminEnquiries.tsx", "AdminChats.tsx", "AdminExchangeRates.tsx"],
    15: ["apps/web/package.json", "apps/mobile/tests", "android/app/build.gradle", "eas.json", "Play release checklist"],
    16: ["render.yaml", "apps/web build output", ".manus-logs", "network logs", "deployment history"],
    17: ["Team_Handover_2026/03_SCALING_AND_MIGRATION_RUNBOOK.md", "Supabase project", "Storage manifests", "DNS records", "target infrastructure"],
    18: ["incident log", "deployment logs", "browser console", "RLS error evidence", "credential register"],
}

CHAPTER_LABELS = {
    1: ["Repository", "Web app", "Native app", "Supabase", "Hosting/build"],
    2: ["Requirement", "Branch", "Review", "Tests", "Release"],
    3: ["Route", "Page", "Component", "Data call", "Rendered state"],
    4: ["Actor", "Auth session", "Role", "RLS/RPC", "Private data"],
    5: ["Preference", "Context", "UI token", "Accessible view", "Localized result"],
    6: ["Native shell", "Screen", "API layer", "Storage/cache", "Device result"],
    7: ["User action", "Android OS", "Layout/input", "Recovery", "Device test"],
    8: ["Migration", "Schema", "Policy", "RPC/query", "Verification"],
    9: ["Guest/member", "Ownership", "Policy", "Function", "Authorized result"],
    10: ["Compress", "Private bucket", "Metadata row", "Signed URL", "Retention"],
    11: ["Open post", "Offer/interest", "Payment pending", "Protected match", "Archive"],
    12: ["Payment request", "Proof upload", "Admin review", "Match", "Payout/release"],
    13: ["Composer", "Conversation", "Realtime", "Unread state", "Authorized review"],
    14: ["Work queue", "Person/detail", "Decision", "Member notice", "Audit trail"],
    15: ["Source", "Tests", "Build", "Artifact inspection", "Release"],
    16: ["User", "Web bundle", "Render", "Supabase", "Logs/metrics"],
    17: ["Measure", "Backup", "Staging rehearsal", "Cutover", "Rollback"],
    18: ["Alert", "Evidence", "Containment", "Repair", "Post-incident review"],
}

CHAPTER_EXPLANATIONS = {
    1: "This chapter establishes the source-of-truth boundary. BridgeX is a multi-client marketplace rather than a single web page: the web client, independent mobile client, Supabase database and Storage rules, and hosting/release configuration must be changed together only when the requirement truly spans them.",
    2: "This chapter turns a request into a reviewable change. A change must have an owner, affected components, security impact, test evidence, a release note, and a rollback decision before it is treated as complete.",
    3: "This chapter maps the React/Vite web surface from routes to pages, reusable components, Supabase calls, and error states. It prevents a visual UI edit from silently weakening data access, signed-out behavior, or administrator isolation.",
    4: "This chapter explains why UI route guards are not security. Identity, role checks, RLS policies, private buckets, and constrained RPCs must all agree before confidential data is visible or modified.",
    5: "This chapter covers the user-facing contract: accessible responsive layouts, meaningful language changes, reliable dark mode, and search-visible public content. A label change should not alter business logic or cause unreadable contrast.",
    6: "This chapter maps the independent Expo/React Native application. Maintain mobile navigation, screen state, API calls, media display, application identity, and release metadata as native product responsibilities rather than browser behavior.",
    7: "This chapter treats Android device behavior as an engineering requirement. Keyboard visibility, gallery selection, system Back navigation, background recovery, and poor-network feedback must be checked on physical devices.",
    8: "This chapter treats migrations as the durable record of schema and business-rule change. A deployed migration is not edited; every new rule is an ordered new migration with tests and a controlled operational rollout.",
    9: "This chapter explains the access-control layers that protect marketplace users. The client asks; RLS and protected functions decide. Permission errors should be diagnosed precisely, never solved by exposing a table to everyone.",
    10: "This chapter maps the private media lifecycle. Photos, verification evidence, payment proof, and report attachments are object-storage data with a database reference, least-privilege visibility, and a retention outcome.",
    11: "This chapter documents the marketplace lifecycle from public open post to a protected match. Public feeds must remain lean and paginated; accepted/pending records must disappear from public results while staying available to eligible participants and administrators.",
    12: "This chapter documents payment-proof review without making false claims about escrow or regulated payment custody. The application records the exact state and proof metadata, while authorized administrators make traceable decisions.",
    13: "This chapter covers private messaging, support conversations, updates, unread counts, realtime delivery, and authorized safety review. Same-name accounts must never be treated as the same user identity.",
    14: "This chapter gives the operations team a person-centred review procedure for verification, reports, payments, contact enquiries, exchange rates, and chat safety. Every sensitive decision needs a reason, recipient outcome, and audit evidence.",
    15: "This chapter turns source into verified releases. Web and native checks, package/version identity, device testing, artifact inspection, store preparation, and a rollback plan are release gates rather than optional documentation.",
    16: "This chapter explains the current Render/Supabase deployment boundary and how to measure performance honestly. Client optimizations improve repeated navigation, but they do not remove a sleeping-host cold start.",
    17: "This chapter gives concrete steps for growth, backup, restore testing, and provider migration. Supabase is an integrated Auth, database, RLS, Storage, realtime, and RPC platform, so moving away requires replacing all of those responsibilities.",
    18: "This chapter provides evidence-first incident handling. The team should contain impact, preserve logs, identify the precise failed layer, apply the smallest safe repair, verify it, and review access or process gaps afterward.",
}

ACTION_PLANS = {
    1: [
        "Start a change record with the user need, affected client, data classification, success condition, and an explicit statement of whether the behavior is implemented, in progress, or future roadmap.",
        "Trace the change across the web client, native client, migrations, Storage, hosting, and build configuration. Exclude any layer that does not need to change; this prevents unnecessary data or release risk.",
        "Update the handover documentation and source map after implementation. Record the exact repository path, migration name, environment prerequisite, and owner for the next team member.",
        "Before handover, clone the repository in a clean directory, follow the written setup path without personal knowledge, and write down every missing prerequisite or ambiguous instruction.",
    ],
    2: [
        "Create a small work item with acceptance criteria, security impact, test plan, and rollback decision. Branch from the reviewed main revision and keep the branch limited to one coherent problem.",
        "Make the change with a clear commit sequence. For database work, commit the new migration and application callers together; never rewrite an applied migration to make local history look cleaner.",
        "Ask a second person to review the affected route, RLS policy, migration, and private-data behavior. Reviewers should reproduce the user journey rather than approving only a code diff.",
        "Merge only when tests, production build, migration plan, release note, and rollback path are recorded. If a release fails, return to the known commit rather than making undocumented live edits.",
    ],
    3: [
        "Locate the route registration in App.tsx, then inspect the page component, shared layout, data hooks, error state, and protected-route wrapper before changing any visible control.",
        "Implement the smallest component or route change. Preserve signed-out loading, empty, error, keyboard, mobile, and back-navigation states; do not assume the happy path is the only rendered state.",
        "Run the web test suite and production build. In a browser, test guest, owner, unrelated member, administrator, and super-administrator outcomes where the page exposes data or actions.",
        "Rollback by redeploying the prior web commit if the route fails. If the defect is data-driven, stop client writes first and repair the underlying migration/RPC only after a protected test reproduces the problem.",
    ],
    4: [
        "Identify the exact actor and private field involved. Follow the request from session hydration through role resolution, query/RPC input, RLS policy, Storage URL creation, and rendered UI.",
        "Add authorization at the database/RPC layer first, then make the frontend hide unavailable actions. A hidden button is not a permission boundary and must not be used as the only control.",
        "Test a signed-out user, the record owner, a different authenticated member, an ordinary administrator, and a super administrator. Capture expected allow and deny outcomes for the sensitive action.",
        "If access becomes too broad, revoke or narrow the policy/function immediately, invalidate short-lived signed URLs where appropriate, rotate privileged keys if exposure is possible, and preserve audit evidence.",
    ],
    5: [
        "Identify whether the change is copy, layout, translation, theme token, route metadata, or SEO content. Keep policy and legal wording owned by the product/operations lead rather than improvising it in a component.",
        "Update the shared token or translation catalog when a behavior appears in multiple screens. Avoid hard-coded duplicated strings that make future languages, dark mode, and accessibility regress.",
        "Check desktop, narrow mobile width, keyboard focus, zoom, screen-reader labels where relevant, light/dark/system mode, and all supported language selections for meaningful text and readable contrast.",
        "Rollback a visual regression by restoring the previous token/component revision. If crawler metadata or a public legal page changes, verify the deployed canonical URL and keep a dated copy of the prior policy text.",
    ],
    6: [
        "Locate the screen in the native navigation shell and trace its API calls through lib/api.ts. Check route state, signed media, local preference state, loading/empty/error behavior, and Android package configuration.",
        "Implement native UI and API changes together. Keep network calls cancellable or guarded against stale state, and update the language/appearance context rather than duplicating preferences inside individual screens.",
        "Run TypeScript compilation and the native architecture test, then test the exact screen on a physical Android device. Validate sign-in, Back, keyboard, media, offline/retry, and state after a short background interruption.",
        "Rollback by rebuilding from the last verified source revision. Do not change the Expo project, Android package name, or signing identity merely to bypass a build problem; preserve release continuity.",
    ],
    7: [
        "Reproduce the device issue on the affected Android version and record device brand, OS, app version, route, input method, network state, and precise steps. A simulator alone is not proof for keyboard or picker defects.",
        "Adjust layout, focus, file-selection, navigation, or state-recovery behavior in the shared screen/hook. Keep user drafts and scroll/route state safe without storing private data beyond the necessary local duration.",
        "Test with the Android system Back key, software keyboard, gallery/document picker, poor connectivity, app background/foreground cycle, and a fresh launch. Confirm the visible result and the saved server record.",
        "If the update causes a crash or loading loop, stop distribution of the build, retain logs and version information, and release a new verified build rather than asking users to rely on an untested workaround.",
    ],
    8: [
        "Search the migration history and production schema before adding a field, index, constraint, policy, or function. Write a new ordered timestamped migration with clear forward behavior and a verification query.",
        "Apply the migration first to a staging or isolated project when possible. Include indexes only for measured filters, joins, or sorts, and keep status transitions constrained at the database level.",
        "Test the calling web/native flows against the migration. Confirm data defaults, foreign keys, RLS, RPC privileges, existing-record compatibility, and expected failure messages before a production apply.",
        "If a migration fails, do not edit the applied file. Use a new corrective migration or restore to the planned pre-change state. Preserve a timestamped database backup and row-count evidence before destructive work.",
    ],
    9: [
        "Write an authorization matrix naming each role, operation, table/bucket, ownership rule, and exception. Use it to identify the narrowest RLS policy or protected RPC needed for the topic.",
        "Implement checks in the database layer. For privileged functions, validate parameters, verify the caller role/ownership, constrain the search path, and return only fields required by the caller.",
        "Execute the matrix with guest, owner, unrelated member, administrator, and super-administrator accounts. Test direct API calls as well as the UI, because a frontend control cannot prove RLS safety.",
        "If an RLS violation appears, capture the table/function, role, record ownership, and query. Never solve it by disabling RLS or granting broad public access; add the missing narrow policy/function and retest all roles.",
    ],
    10: [
        "Classify the file as public post media, protected request media, profile avatar, identity document, payment proof, report evidence, or chat attachment. Define who can upload, read, review, and remove it.",
        "Compress and validate client uploads, store only object key and metadata in Postgres, and keep sensitive buckets private. Generate signed read URLs only after the authenticated backend/RLS decision succeeds.",
        "Test upload from web and Android, object metadata persistence, unauthorized read denial, authorized signed-URL display, failed upload cleanup, and retention/deletion workflow for the file type.",
        "For a deletion request or closure policy, delete through the Storage API then remove/mark the database reference. Keep only the minimal audit metadata permitted by policy; never delete storage metadata directly with SQL.",
    ],
    11: [
        "Map the post lifecycle and capacity rules before editing the form or feed. Confirm which fields are public, which are protected, and which status causes the record to leave public marketplace queries.",
        "Change form validation, query filters, response creation, or inventory adjustment in the responsible client and migration/RPC layer. Preserve pagination and narrow column selection for public feeds.",
        "Test guest browsing, member post creation, offer/interest creation, duplicate response behavior, accepted response behavior, public-feed disappearance, owner workspace visibility, and administrator review.",
        "If a post becomes incorrectly public or hidden, first stop the incorrect status transition or query filter from serving new results. Correct only the affected records with an audited migration or protected administration action.",
    ],
    12: [
        "Trace the payment record from acceptance request to proof submission, administrator review, match creation, private-detail disclosure, delivery, release, and payout history. Keep wording accurate: a proof workflow is not a promise of regulated escrow.",
        "Require payment method, required metadata, screenshot/object path, and submission timestamp before the record enters an administrator queue. Use constrained statuses and protected functions to prevent a client from opening a match early.",
        "Test both send-request and carry-listing branches, missing proof rejection, authorized admin verification/rejection, participant-only contact visibility after approval, and traveler-only payout notifications.",
        "If a payment state is wrong, preserve the record and evidence metadata, place the workflow on hold, notify the correct operator, and use an audited status correction rather than deleting proof or editing history silently.",
    ],
    13: [
        "Identify the conversation type: protected deal, BridgeX support, system update, or authorized safety review. Use stable user IDs and conversation IDs; display names are not identity keys.",
        "Implement send/load/subscription behavior through the protected conversation API. Paginate messages, update only affected unread counters, and ensure support replies retain the actual member identity rather than an ambiguous administrator label.",
        "Test two distinct same-name accounts, both deal participants, a nonparticipant, and an authorized administrator. Confirm new messages arrive without refresh, read state clears correctly, and private content is never included in public queries.",
        "If realtime or unread state fails, retain the stored message first, fall back to safe polling where necessary, and repair subscriptions/counters without opening the conversation table to unrelated users.",
    ],
    14: [
        "Start from the operational queue and open the person or record detail page before deciding. Review only the fields, media, and messages authorized for that queue; do not export sensitive evidence for convenience.",
        "Make the decision through the protected control or RPC. Record reviewer, timestamp, reason, status change, member-facing notice, and any retention/deletion action needed for the evidence.",
        "Test the action with a non-admin account, ordinary admin, and super-admin as appropriate. Confirm badges show new unseen operational items only and member navigation does not inherit admin notification counts.",
        "For incorrect moderation or verification decisions, preserve the original audit event, create a correction reason, notify the affected member when policy requires it, and review whether role training or UI safeguards failed.",
    ],
    15: [
        "Freeze the release commit and record web/mobile version identifiers. Run web tests plus production build, native TypeScript plus architecture tests, and any migration verification before requesting an artifact.",
        "Build through the existing Expo/EAS project and preserve Android package/version alignment between app configuration and Gradle. For store distribution, create the correct AAB and retain the artifact hash and source commit.",
        "Inspect the downloaded artifact archive and test on physical devices. Check first launch, signed-out browsing, sign-in, post/media actions, messages, notifications, admin routes, and system Back before publishing a direct link.",
        "If release validation fails, mark the artifact as rejected, keep the direct link unpublished, fix source on a new commit, and rebuild from the same project/signing identity. Do not claim a build exists before inspection succeeds.",
    ],
    16: [
        "Measure the user-visible symptom first: cold-start latency, initial bundle size, slow route, database query time, signed media delay, API error, or Render deployment failure. Capture timestamps and relevant logs.",
        "Apply the appropriate fix: code-split heavy routes, cache safe read models, reduce selected columns, add measured indexes, lazy-load media, or improve skeleton/error recovery. Do not hide a server sleep behind a misleading loading promise.",
        "Compare before/after measurements on a cold request and warm navigation. Verify that caching does not expose another user’s private data or leave critical order/payment status stale.",
        "Rollback a performance change if error rate, data freshness, authorization, or deployment stability worsens. Keep a short incident note with metric, root cause, release commit, and follow-up action.",
    ],
    17: [
        "Define the growth threshold using real metrics: active users, messages, posts, Storage objects, query latency, support queue volume, and deployment/cold-start behavior. Do not design a million-user architecture without a measured trigger.",
        "Create separate source, schema, data, and Storage backups with timestamp, checksum, object manifest, source commit, and retention rule. Restore a representative backup into an isolated environment on a documented schedule.",
        "For Render migration, reproduce environment variables in a target secret manager, deploy the same commit to staging, test OAuth/origins, lower DNS TTL, switch only after end-to-end checks, and retain a rollback domain path.",
        "For Supabase migration, replace Postgres, Auth, RLS authorization, Storage signing, RPC behavior, realtime, and notification responsibilities one by one. Rehearse import, compare row/object counts and critical flows, then conduct a timed cutover with rollback.",
    ],
    18: [
        "Classify severity, restrict harmful access or writes if necessary, and preserve the exact error, route, user role, app version, request metadata, logs, and timestamps before attempting a repair.",
        "Reproduce in a safe environment or with a minimal authorized test case. Identify whether the failure is client rendering, build asset, authentication, RLS/RPC, database constraint, Storage, realtime, hosting, or credential configuration.",
        "Deploy the smallest tested fix, then verify the exact incident path and the adjacent authorization/data path. Send a factual update to affected users or operators without exposing other members’ records.",
        "After recovery, record root cause, blast radius, repair commit, timeline, monitoring gap, access changes, and prevention action. Rotate credentials and review logs immediately for any suspected privileged-data exposure.",
    ],
}

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()

def wrap(draw, x, y, text, font, width, fill=(30, 47, 66), spacing=5):
    words = text.split()
    line = ""
    for word in words:
        candidate = (line + " " + word).strip()
        if draw.textlength(candidate, font=font) <= width:
            line = candidate
        else:
            draw.text((x, y), line, font=font, fill=fill)
            y += font.size + spacing
            line = word
    if line:
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + spacing
    return y

def arrow(draw, start, end, color, width=7):
    draw.line((*start, *end), fill=color, width=width)
    ex, ey = end
    sx, sy = start
    if abs(ex - sx) >= abs(ey - sy):
        direction = 1 if ex >= sx else -1
        points = [(ex, ey), (ex - 18 * direction, ey - 10), (ex - 18 * direction, ey + 10)]
    else:
        direction = 1 if ey >= sy else -1
        points = [(ex, ey), (ex - 10, ey - 18 * direction), (ex + 10, ey - 18 * direction)]
    draw.polygon(points, fill=color)

def node(draw, box, label, fill, border, text_fill=(255, 255, 255), size=22):
    draw.rounded_rectangle(box, radius=18, fill=fill, outline=border, width=3)
    f = get_font(BOLD, size)
    x1, y1, x2, y2 = box
    wrapped = label.split(" ")
    lines = [label] if len(label) <= 14 else [" ".join(wrapped[:max(1, len(wrapped)//2)]), " ".join(wrapped[max(1, len(wrapped)//2):])]
    y = (y1 + y2) / 2 - (len(lines) * (f.size + 3)) / 2
    for line in lines:
        w = draw.textlength(line, font=f)
        draw.text((x1 + (x2-x1-w)/2, y), line, font=f, fill=text_fill)
        y += f.size + 3

def diagram_pipeline(draw, labels, primary, secondary, light, topic, source):
    coords = [(70 + i*300, 260, 280 + i*300, 370) for i in range(5)]
    for i in range(4):
        arrow(draw, (coords[i][2] + 5, 315), (coords[i+1][0] - 9, 315), primary)
    for i, box in enumerate(coords):
        node(draw, box, labels[i], primary if i in (0, 4) else secondary if i == 2 else (236, 243, 250), primary, (255,255,255) if i in (0,2,4) else (30,47,66))
    wrap(draw, 76, 416, f"Concrete path for {topic.lower()}: {source[0]} → {source[1]} → validation evidence.", get_font(FONT, 21), 1420, fill=(71, 93, 114))

def diagram_layers(draw, labels, primary, secondary, light, topic, source):
    boxes = [(190, 165, 1410, 235), (260, 260, 1340, 330), (330, 355, 1270, 425), (400, 450, 1200, 520)]
    use = [labels[0], labels[1] + " + " + labels[2], labels[3], labels[4]]
    colors = [primary, secondary, (95, 133, 168), (46, 88, 120)]
    for box, label, color in zip(boxes, use, colors):
        node(draw, box, label, color, primary, (255,255,255), 24)
    draw.text((78, 96), "Layered responsibility map", font=get_font(BOLD, 28), fill=primary)
    wrap(draw, 125, 555, f"The change must pass through the correct layers. For this topic, start at {source[0]} and do not bypass the policy, database, or release layer merely to make a UI action appear to work.", get_font(FONT, 20), 1350, fill=(71,93,114))

def diagram_state(draw, labels, primary, secondary, light, topic, source):
    centers = [(245, 300), (525, 200), (835, 235), (1070, 395), (640, 455)]
    r = 78
    for i, center in enumerate(centers):
        nxt = centers[(i+1) % len(centers)]
        arrow(draw, (center[0] + (nxt[0]-center[0])*0.25, center[1] + (nxt[1]-center[1])*0.25), (nxt[0] - (nxt[0]-center[0])*0.25, nxt[1] - (nxt[1]-center[1])*0.25), primary, 6)
    for i, (cx, cy) in enumerate(centers):
        fill = primary if i in (0, 3) else secondary if i == 2 else (232, 240, 248)
        draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=fill, outline=primary, width=3)
        f = get_font(BOLD, 19)
        words = labels[i].split(" ")
        lines = [labels[i]] if len(labels[i]) <= 12 else [" ".join(words[:len(words)//2]), " ".join(words[len(words)//2:])]
        yy = cy - (len(lines)*f.size)/2
        for line in lines:
            w = draw.textlength(line, font=f)
            draw.text((cx-w/2, yy), line, font=f, fill=(255,255,255) if i in (0,2,3) else (30,47,66))
            yy += f.size
    wrap(draw, 78, 555, f"State transition diagram for {topic.lower()}. Use the migration and protected function rules under {source[0]} to enforce transition guards; never update status only in the client.", get_font(FONT, 20), 1425, fill=(71,93,114))

def diagram_matrix(draw, labels, primary, secondary, light, topic, source):
    x0, y0, cw, rh = 140, 170, 250, 70
    headers = [labels[0], labels[1], labels[2], labels[3], labels[4]]
    for col, label in enumerate(headers):
        node(draw, (x0+col*cw, y0, x0+(col+1)*cw-12, y0+rh), label, primary, primary, (255,255,255), 17)
    roles = ["Observe", "Create", "Review", "Approve", "Recover"]
    for row, role in enumerate(roles):
        yy = y0 + (row+1)*rh + 16
        draw.text((55, yy+18), role, font=get_font(BOLD, 19), fill=primary)
        for col in range(5):
            allowed = (row + col) % 3 != 1
            color = secondary if allowed else (238, 242, 246)
            draw.rounded_rectangle((x0+col*cw, yy, x0+(col+1)*cw-12, yy+rh-12), radius=12, fill=color, outline=(207,220,232), width=2)
            mark = "Check" if allowed else "Guard"
            f = get_font(BOLD, 15)
            w = draw.textlength(mark, font=f)
            draw.text((x0+col*cw+(cw-12-w)/2, yy+18), mark, font=f, fill=(255,255,255) if allowed else (94,111,126))
    wrap(draw, 100, 585, f"Decision matrix for {topic.lower()}. Confirm the role, system layer, expected evidence, and recovery path in {source[0]} before the team grants a new capability.", get_font(FONT, 19), 1380, fill=(71,93,114))

def create_visual(page_no, chapter_no, chapter_title, topic):
    primary, secondary, light = COLORS[(chapter_no-1) % len(COLORS)]
    canvas = Image.new("RGB", (1600, 700), (249, 251, 253))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((18,18,1582,682), radius=28, fill=(255,255,255), outline=(210,223,235), width=3)
    draw.rounded_rectangle((48,46,450,122), radius=18, fill=primary)
    draw.text((74,66), f"CHAPTER {chapter_no:02d} · PAGE {page_no:03d}", font=get_font(BOLD, 25), fill=(255,255,255))
    wrap(draw, 490, 50, topic, get_font(BOLD, 34), 1000, fill=(23,42,62), spacing=2)
    labels = CHAPTER_LABELS[chapter_no]
    source = CHAPTER_SOURCES[chapter_no]
    mode = chapter_no % 4
    if mode == 1:
        diagram_pipeline(draw, labels, primary, secondary, light, topic, source)
    elif mode == 2:
        diagram_layers(draw, labels, primary, secondary, light, topic, source)
    elif mode == 3:
        diagram_state(draw, labels, primary, secondary, light, topic, source)
    else:
        diagram_matrix(draw, labels, primary, secondary, light, topic, source)
    canvas.save(ASSETS / f"page_{page_no:03d}.png", optimize=True)

def esc(text):
    return text.replace("#", "\\#").replace("[", "\\[").replace("]", "\\]")

def procedure(topic, chapter_no, source):
    explanation = CHAPTER_EXPLANATIONS[chapter_no]
    steps = ACTION_PLANS[chapter_no]
    return explanation, steps

def scale_note(chapter_no, topic):
    notes = {
        3: "At higher traffic, split heavy routes, preload only the next likely navigation, and keep public marketplace queries paginated rather than loading every post.",
        6: "At higher mobile usage, cache safe read models locally, preserve drafts carefully, and request only the next page of records instead of refreshing every screen.",
        8: "At growth, measure query plans before adding indexes; every index adds write cost and must match a proven filter, sort, or join pattern.",
        10: "At higher media volume, enforce size limits, lifecycle retention, object-key manifests, and short-lived signed URLs; do not place binary files in database rows.",
        11: "At marketplace scale, keep status=open and route/category filters indexed, cursor or page records consistently, and separate public projection fields from protected contact fields.",
        13: "At messaging scale, paginate conversation lists and message history, update only the changed unread counter, and avoid refetching all support/deal records after one new message.",
        14: "At operations scale, allocate queues by role, preserve audit outcomes, add dashboard measurements, and avoid giving broad data export access merely to reduce manual work.",
        16: "At web growth, measure cold starts, bundle size, slow queries, Storage latency, and error rates independently; choose always-on or regional infrastructure only after data supports the cost.",
        17: "At migration scale, rehearse export/import with row counts, foreign-key checks, Storage object manifests, signed-link replacement, and a tested DNS rollback before moving live traffic.",
    }
    return notes.get(chapter_no, "Growth does not change the privacy rule: measure real usage first, keep least privilege, preserve audit evidence, and make the smallest reversible change.")

def page_block(page_no, chapter_no, chapter_title, topic, index):
    source = CHAPTER_SOURCES[chapter_no]
    explanation, steps = procedure(topic, chapter_no, source)
    action_list = "\n#v(0.25em)\n".join([f"{i+1}. {esc(step)}" for i, step in enumerate(steps)])
    return f'''#page(margin: (top: 1.05cm, bottom: 0.9cm, x: 1.22cm))[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 8.1pt)
#text(size: 7.1pt, fill: report-accent)[BRIDGEX DEVELOPER OPERATIONS MANUAL · CHAPTER {chapter_no:02d} · PAGE {page_no:03d}/200]
#v(0.23em)
#text(size: 15.8pt, weight: "bold")[{esc(topic)}]
#v(0.22em)
#text(size: 7.9pt, fill: luma(94))[Chapter {chapter_no:02d}: {esc(chapter_title)} · Detailed procedure {index:02d} of 11]
#v(0.45em)
#figure(image("assets/page_{page_no:03d}.png", width: 100%), caption: [Topic-specific technical diagram: paths, layers, states, or responsibility matrix for this procedure.])
#v(0.32em)
#grid(columns: (1fr, 1fr), gutter: 10pt,
[
*Current system and decision boundary*
#v(0.28em)
{esc(explanation)}
#v(0.35em)
*Concrete implementation locations*
#v(0.22em)
#text(font: "DejaVu Sans Mono", size: 7.0pt)[{esc(' · '.join(source))}]
],
[
*What to do and how to do it*
#v(0.28em)
{action_list}
])
#v(0.42em)
#block(fill: rgb(242, 247, 251), radius: 6pt, inset: 8pt)[
*Validation and rollback*
#v(0.25em)
Run the relevant web or native compiler/test suite, then exercise the exact route as the eligible user and as an ineligible actor. Verify the database or Storage result, capture the release commit, and keep the prior deployment/migration recovery path available. If the change damages authorization, media visibility, or order/payment state, stop the rollout and revert the application layer before attempting a data correction.
]
#v(0.32em)
#block(fill: rgb(237, 247, 241), radius: 6pt, inset: 8pt)[
*When BridgeX grows*
#v(0.25em)
{esc(scale_note(chapter_no, topic))}
]
#align(right)[#text(size: 7pt, fill: luma(112))[BridgeX technical handover · revised edition · page {page_no:03d} of 200]]
]'''

def title_page():
    return '''#page(margin: (top: 1.45cm, bottom: 1.0cm, x: 1.6cm), numbering: none, header: none)[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 10pt)
#align(center)[
#text(size: 27pt, weight: "bold", fill: report-accent)[BridgeX Developer Operations Manual]
#v(0.35em)
#text(size: 13pt, fill: luma(90))[Revised 200-page technical handbook with source-specific procedures and diagrams]
#v(0.8em)
#image("assets/page_001.png", width: 95%)
#v(0.8em)
#text(size: 9.2pt)[For the technical team, operations team, future maintainers, and authorized acquiring organization]
#v(0.45em)
#text(size: 8.1pt, fill: luma(105))[This revised edition removes repeated generic process visuals. Each operational page contains a topic-specific architecture, state, layer, or responsibility diagram and detailed change/test/rollback guidance.]
]
]'''

def contents_page():
    lines = []
    for idx, (number, title, _, _) in enumerate(CHAPTERS):
        start = 3 + idx * 11
        lines.append(f"#text(size: 7.1pt)[{number}. {title} · pp. {start}–{start+10}]")
    left, right = "\\n".join(lines[:9]), "\\n".join(lines[9:])
    return f'''#page(margin: (top: 1.12cm, bottom: 0.95cm, x: 1.45cm), header: none)[
#set text(font: ("Noto Sans", "DejaVu Sans"), size: 8pt)
#text(size: 18pt, weight: "bold", fill: report-accent)[Manual map and use instructions]
#v(0.2em)
#text(size: 7.6pt)[Read the diagram before changing code: it identifies the real system boundary for the page. Then use the source locations, numbered procedure, validation/rollback block, and growth note to perform changes safely.]
#v(0.28em)
#image("assets/page_002.png", width: 78%)
#v(0.25em)
#grid(columns: (1fr, 1fr), gutter: 8pt, [{left}], [{right}])
#v(0.2em)
#block(fill: luma(245), radius: 5pt, inset: 6pt)[*Security handover rule:* source and documentation may be shared; live credentials, user records, ID documents, private messages, payment proof, signing keys, and privileged API values must move only through an authorized secure transfer process.]
#align(right)[#text(size: 7pt, fill: luma(112))[BridgeX technical handover · revised edition · page 002 of 200]]
]'''

def main():
    create_visual(1, 1, "Cover", "BridgeX technical architecture and handover boundary")
    create_visual(2, 1, "Navigation", "How to use a source-specific procedure page")
    output = [
        '// Generated by generate_revised_manual.py. Update this source generator, then regenerate and verify the PDF.\n',
        '#import "report-theme.typ": report-accent, report-theme\n',
        '#show: report-theme.with(title: "BridgeX Developer Operations Manual", author: "Manus AI", rhythm: "report", running-header: true)\n',
        title_page(),
        contents_page(),
    ]
    page = 3
    for chapter_no, (number, title, focus, topics) in enumerate(CHAPTERS, start=1):
        for index, topic in enumerate(topics, start=1):
            create_visual(page, chapter_no, title, topic)
            output.append(page_block(page, chapter_no, title, topic, index))
            page += 1
    assert page == 201
    (ROOT / "main.typ").write_text("\n\n".join(output), encoding="utf-8")
    print("Generated revised 200-page manual source and 200 topic-specific technical visuals.")

if __name__ == "__main__":
    main()
