import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("BridgeX currency, cargo, support, and brand release safeguards", () => {
  it("stores preferred and per-transaction currency codes while allowing partial cargo acceptance", () => {
    const migration = read("supabase/migrations/202608191200_currency_preferences_and_partial_cargo_acceptance.sql");
    expect(migration).toContain("preferred_currency");
    expect(migration).toContain("accepted_weight_kg");
    expect(migration).toContain("LEAST(v_interest_weight, v_remaining_weight)");
  });

  it("uses the selected currency in the profile, request, listing, offer, and interest data paths", () => {
    expect(read("apps/web/client/src/pages/Workspace.tsx")).toContain("Transaction currency");
    expect(read("apps/web/client/src/pages/CreateFlow.tsx")).toContain("currency });");
    expect(read("apps/web/client/src/pages/OfferPage.tsx")).toContain("Service amount ({currency})");
    expect(read("apps/web/client/src/pages/InterestPage.tsx")).toContain("Total offer ({currency})");
  });

  it("requires protected destination delivery contacts for carry interests and persists them to the accepted match", () => {
    const migration = read("supabase/migrations/202608191330_carry_interest_delivery_contacts.sql");
    const interestPage = read("apps/web/client/src/pages/InterestPage.tsx");
    expect(migration).toContain("delivery_phone text");
    expect(migration).toContain("v_interest.delivery_address");
    expect(migration).toContain("v_interest.delivery_phone");
    expect(interestPage).toContain("Destination delivery details");
    expect(interestPage).toContain("Exact delivery location and address");
  });

  it("uses the notification related enquiry ID for private BridgeX Admin replies", () => {
    const deals = read("apps/web/client/src/pages/Deals.tsx");
    expect(deals).toContain("const selectedSupportEnquiryId = selectedSupport?.related_id || selectedSupport?.id || \"\"");
    expect(deals).toContain("p_enquiry_id: selectedSupportEnquiryId");
    expect(deals).toContain("support=${encodeURIComponent(latestSupportUpdate.related_id || latestSupportUpdate.id)}");
  });

  it("keeps the member Inbox limited to the signed-in deal participant even when that member is an administrator", () => {
    const deals = read("apps/web/client/src/pages/Deals.tsx");
    expect(deals).toContain(".or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`)");
    expect(deals).toContain("matches").toContain("orders");
  });

  it("uses the supplied logo for shared web branding, browser favicon, and mobile app configuration", () => {
    expect(read("apps/web/client/src/components/bridgex/Brand.tsx")).toContain("/bridgex-logo.webp");
    expect(read("apps/web/client/index.html")).toContain("/favicon.ico");
    expect(read("apps/mobile/app.json")).toContain("./assets/icon.png");
    expect(read("apps/mobile/app.json")).toContain('"versionCode": 5');
  });

  it("uses the compact 0.5 cm application-color Android top spacer in the next native build", () => {
    const mobileApp = read("apps/mobile/App.tsx");
    expect(mobileApp).toContain("const HALF_CENTIMETER_DP = 160 / 2.54 / 2");
    expect(mobileApp).toContain("backgroundColor: \"#f7f5ef\", height: HALF_CENTIMETER_DP");
    expect(mobileApp).toContain("?app=android&build=5");
    expect(read("apps/mobile/android/app/build.gradle")).toContain("versionCode 5");
    expect(read("apps/mobile/android/app/build.gradle")).toContain('versionName "1.0.5"');
  });

  it("pairs sound categories with lightweight visual feedback cues that respect motion preferences", () => {
    const feedback = read("apps/web/client/src/lib/feedback.ts");
    const styles = read("apps/web/client/src/index.css");
    expect(feedback).toContain("showBridgeXVisualFeedback(kind)");
    expect(styles).toContain(".bridgex-feedback-cue--success");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("uses the completed Android v1.0.5 build link alongside the Windows download entry", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain("builds/1ecca5d1-5f3e-4ac5-8dc5-b22781d0ea5c");
    expect(layout).toContain("BridgeX-Windows-x64.zip");
  });

  it("labels a signed-in member’s private support reply with that member’s own profile name", () => {
    const deals = read("apps/web/client/src/pages/Deals.tsx");
    expect(deals).toContain('const memberName = user?.name || user?.email?.split("@")[0] || "Member"');
    expect(deals).toContain('{message.sender_id === user?.id ? memberName : "BridgeX Admin"}');
  });

  it("uses completed click events rather than pointer-down events for global tap feedback and applies glass treatments with a fallback", () => {
    const app = read("apps/web/client/src/App.tsx");
    const styles = read("apps/web/client/src/index.css");
    expect(app).toContain('window.addEventListener("click", onInteraction, { passive: true })');
    expect(app).not.toContain('window.addEventListener("pointerdown", onInteraction');
    expect(styles).toContain(".bridgex-glass-panel");
    expect(styles).toContain("@supports not ((backdrop-filter: blur(1px))");
  });

  it("provides a shared logical back control for member, administrator, and public-detail pages", () => {
    const app = read("apps/web/client/src/App.tsx");
    expect(app).toContain("function GlobalBackButton()");
    expect(app).toContain("<GlobalBackButton />");
    expect(app).toContain('location.startsWith("/post/")');
    expect(app).toContain('location.startsWith("/dashboard/deals") && hasDetailQuery');
  });

  it("renders correct participant names and live latest-message cards in administrator contact enquiries", () => {
    const enquiries = read("apps/web/client/src/pages/AdminEnquiries.tsx");
    const deals = read("apps/web/client/src/pages/Deals.tsx");
    const migration = read("supabase/migrations/202608191500_contact_enquiries_realtime.sql");
    expect(enquiries).toContain('{isMember ? selected.name : "BridgeX Admin"}');
    expect(enquiries).toContain("latestBody");
    expect(enquiries).toContain("totalMessages");
    expect(enquiries).toContain('supabase.channel("admin-contact-enquiries-live")');
    expect(deals).toContain("member-support-${selectedSupportEnquiryId}");
    expect(migration).toContain("ADD TABLE public.contact_enquiry_messages");
  });

  it("gives profile and workspace notifications their specific title and body detail", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain("type NotificationRecord = { id: string; type: string; link: string | null; title: string; body: string }");
    expect(layout).toContain("const updateDetailText");
    expect(layout).toContain("description: updateDetailText(records)");
    expect(layout).toContain("description: description ||");
  });

  it("consolidates BridgeX Admin Inbox updates into one latest-message card with one unread count", () => {
    const deals = read("apps/web/client/src/pages/Deals.tsx");
    expect(deals).toContain("const latestSupportUpdate = supportUpdates[0]");
    expect(deals).toContain("const unreadSupportCount = supportUpdates.filter");
    expect(deals).toContain("latestSupportUpdate.body");
    expect(deals).toContain("{latestSupportUpdate && <section");
  });

  it("subscribes matched participants to live protected-deal messages and publishes the table to realtime", () => {
    const deals = read("apps/web/client/src/pages/Deals.tsx");
    const migration = read("supabase/migrations/202608191520_match_messages_realtime.sql");
    expect(deals).toContain("protected-deal-${selected.id}");
    expect(deals).toContain('table: "match_messages"');
    expect(migration).toContain("ADD TABLE public.match_messages");
  });

  it("keeps administrator-control notifications out of the member Workspace count", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain('type UpdateDestination = "profile" | "workspace" | "messages" | "admin"');
    expect(layout).toContain('return "admin"');
    expect(layout).toContain('go(user.role === "super_admin" ? "/admin/super" : "/admin", "admin")');
    expect(layout).toContain("updateBadge(updates.admin)");
  });

  it("gates response acceptance behind protected payment proof verification and reserves carry capacity during payment review", () => {
    const migration = read("supabase/migrations/202608191600_manual_payment_verification.sql");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.bridgex_payment_proofs");
    expect(migration).toContain("status IN ('pending_payment', 'payment_verifying', 'verified', 'rejected', 'cancelled')");
    expect(migration).toContain("reserved_weight_kg");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.start_bridgex_payment");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.submit_bridgex_payment_proof");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.verify_bridgex_payment");
    expect(migration).toContain("Only an administrator can complete a payment-verified acceptance.");
  });

  it("renders sender payment proof instructions and routes administrators to a screenshot review detail page", () => {
    const workspace = read("apps/web/client/src/pages/Workspace.tsx");
    const admin = read("apps/web/client/src/pages/AdminControl.tsx");
    const review = read("apps/web/client/src/pages/AdminPaymentReview.tsx");
    expect(workspace).toContain('title="Pending payments"');
    expect(workspace).toContain("Submit payment screenshot for verification");
    expect(workspace).toContain("Pay with Alipay");
    expect(workspace).toContain("Pay with WeChat Pay");
    expect(workspace).toContain("start_bridgex_payment");
    expect(admin).toContain('"Payment verification"');
    expect(admin).toContain("Review payment");
    expect(review).toContain("verify_bridgex_payment");
    expect(review).toContain("Uploaded payment screenshot");
  });
});
