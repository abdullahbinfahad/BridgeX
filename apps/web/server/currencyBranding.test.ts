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
    const requestComposer = read("apps/web/client/src/pages/CreateFlow.tsx");
    expect(requestComposer).toContain("currency, service_scope: form.serviceScope");
    expect(requestComposer).toContain("declared_item_currency: form.serviceScope === \"international\" ? form.declarationCurrency");
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
    expect(read("apps/mobile/app.json")).toContain('"versionCode": 14');
  });

  it("uses the independent native app shell in the BridgeX Android 1.3.0 release", () => {
    const mobileApp = read("apps/mobile/App.tsx");
    const nativeApp = read("apps/mobile/src/NativeApp.tsx");
    expect(mobileApp).toContain('import NativeApp from "./src/NativeApp"');
    expect(nativeApp).toContain("SafeAreaView");
    expect(nativeApp).not.toContain("WebView");
    expect(read("apps/mobile/android/app/build.gradle")).toContain("versionCode 14");
    expect(read("apps/mobile/android/app/build.gradle")).toContain('versionName "1.3.0"');
  });

  it("pairs sound categories with lightweight visual feedback cues that respect motion preferences", () => {
    const feedback = read("apps/web/client/src/lib/feedback.ts");
    const styles = read("apps/web/client/src/index.css");
    expect(feedback).toContain("showBridgeXVisualFeedback(kind)");
    expect(styles).toContain(".bridgex-feedback-cue--success");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("uses the completed independent-native Android v1.3.0 APK link alongside the Windows download entry", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain("N5fukcxoZHP8d2apA28UWulZSz94sBUqxyXNpYIX1pY.apk");
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

  it("retains detailed update text for Control Panel-only popup presentation", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain("type NotificationRecord = { id: string; type: string; link: string | null; title: string; body: string }");
    expect(layout).toContain("const updateDetailText");
    expect(layout).toContain("whitespace-pre-line");
    expect(layout).toContain("freshAdminRecords");
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
    expect(layout).toContain('type UpdateDestination = "profile" | "workspace" | "messages" | "payments" | "admin"');
    expect(layout).toContain('return "admin"');
    expect(layout).toContain('go("/admin", "admin")');
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

  it("removes the CNY-only QR gate while retaining manually reviewed payment records", () => {
    const migration = read("supabase/migrations/202608191730_allow_manual_qr_all_currencies.sql");
    const paymentHistory = read("apps/web/client/src/pages/PaymentHistory.tsx");
    expect(migration).toContain("DROP TRIGGER IF EXISTS bridgex_manual_qr_cny_only");
    expect(migration).toContain("DROP FUNCTION IF EXISTS public.enforce_bridgex_manual_qr_cny");
    expect(paymentHistory).toContain("Protected payment record");
    expect(paymentHistory).toContain("Alipay");
    expect(paymentHistory).toContain("WeChat Pay");
  });

  it("opens payment statuses and individual payment or payout actions on dedicated routes", () => {
    const paymentHistory = read("apps/web/client/src/pages/PaymentHistory.tsx");
    const workspace = read("apps/web/client/src/pages/Workspace.tsx");
    expect(paymentHistory).toContain("/dashboard/payments/${key}");
    expect(paymentHistory).toContain("/dashboard/payments/record/${payment.id}");
    expect(paymentHistory).toContain("/dashboard/payouts/record/${payout.id}");
    expect(workspace).toContain("/dashboard/payments/record/${encodeURIComponent(data)}");
    expect(paymentHistory).not.toContain("dashboard/payments?status=");
    expect(paymentHistory).not.toContain("dashboard/payments?payment=");
  });

  it("uses concise download links and keeps a separate signed Google Play App Bundle profile", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    const appConfig = read("apps/mobile/app.json");
    const eas = read("apps/mobile/eas.json");
    const gradle = read("apps/mobile/android/app/build.gradle");
    expect(layout).toContain('t("downloadAndroid")');
    expect(layout).toContain('t("downloadWindows")');
    expect(layout).toContain('t("harmonyOS")');
    expect(layout).toContain('t("macOS")');
    expect(layout).not.toContain("allow that app to install unknown apps");
    expect(appConfig).toContain('"versionCode": 14');
    expect(eas).toContain('"play"');
    expect(eas).toContain('"buildType": "app-bundle"');
    expect(gradle).toContain("EAS_BUILD_ANDROID_KEYSTORE_PATH");
    expect(gradle).toContain("versionCode 14");
    expect(gradle).toContain('versionName "1.3.0"');
    expect(gradle).not.toContain("signingConfig signingConfigs.debug\n            def enableShrinkResources");
  });

  it("creates private traveler payout details and payout-due records only after sender-confirmed release", () => {
    const migration = read("supabase/migrations/202608191800_traveler_payout_history.sql");
    const paymentHistory = read("apps/web/client/src/pages/PaymentHistory.tsx");
    const admin = read("apps/web/client/src/pages/AdminControl.tsx");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.bridgex_traveler_payout_profiles");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.bridgex_traveler_payouts");
    expect(migration).toContain("payout_status IN ('details_required', 'payment_due', 'payment_sent', 'received')");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.confirm_bridgex_sender_delivery");
    expect(migration).toContain("traveler_payout_due");
    expect(migration).toContain("mark_bridgex_traveler_payout_sent");
    expect(paymentHistory).toContain("Traveler payout history");
    expect(paymentHistory).toContain("Confirm received");
    expect(admin).toContain('"Traveler payouts"');
    expect(admin).toContain("Mark payment sent");
  });

  it("allows carry listings to remain payment-pending and sends one verified-payment alert only to the relevant owner", () => {
    const migration = read("supabase/migrations/202608191900_carry_payment_pending_and_single_payment_alert.sql");
    expect(migration).toContain("carry_listings_status_check");
    expect(migration).toContain("'open', 'payment_pending', 'paused', 'closed', 'released'");
    expect(migration).toContain("IF v_payment.response_kind = 'offer' THEN");
    expect(migration).toContain("v_payment.payer_id");
    expect(migration).toContain("v_payment.owner_id");
    expect(migration).toContain("review sender product details");
    expect(migration).not.toContain("currency <> 'CNY'");
  });

  it("uses an in-app release dialog, line-separated web updates, Payment history navigation, and interactive completed-order reviews", () => {
    const workspace = read("apps/web/client/src/pages/Workspace.tsx");
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    const reviews = read("apps/web/client/src/pages/ReviewsPage.tsx");
    expect(workspace).toContain("<AlertDialog open={open}");
    expect(workspace).toContain("Confirm product received");
    expect(workspace).toContain("Protected acceptance in progress");
    expect(layout).toContain("updateDetailText");
    expect(layout).toContain("whitespace-pre-line");
    expect(layout).toContain('"/dashboard/payments"');
    expect(layout).toContain("window.setInterval(() => void loadUnreadUpdates(), 30000)");
    expect(reviews).toContain('fulfillment_status.eq.completed');
    expect(reviews).toContain("of 5 stars selected");
    expect(reviews).toContain("Publishing review…");
  });

  it("uses signed private Supabase URLs for payment instructions instead of exposing the QR images through the public Render app", () => {
    const workspace = read("apps/web/client/src/pages/Workspace.tsx");
    const migration = read("supabase/migrations/202608191625_private_payment_instruction_read_scope.sql");
    expect(workspace).toContain('from("payment-instructions").createSignedUrl');
    expect(workspace).toContain("alipay-qr.jpg.jpg");
    expect(workspace).toContain("wechat-pay-qr.jpg.jpg");
    expect(migration).toContain("payment_instructions_payment_payer_read");
    expect(migration).toContain("proof.payer_id = auth.uid()");
  });

  it("keeps post-success reset references stable after asynchronous media work and allows payment statuses in response tables", () => {
    const createFlow = read("apps/web/client/src/pages/CreateFlow.tsx");
    const migration = read("supabase/migrations/202608191640_payment_response_statuses.sql");
    expect(createFlow).toContain("const formElement = event.currentTarget");
    expect(createFlow).toContain("formElement.reset()");
    expect(createFlow).not.toContain("event.currentTarget.reset()");
    expect(migration).toContain("'pending_payment', 'payment_verifying'");
    expect(migration).toContain("offers_status_check");
    expect(migration).toContain("listing_interests_status_check");
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

  it("uses a mobile-safe notification polling lifecycle and provides a return path for all dashboard routes", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    const app = read("apps/web/client/src/App.tsx");
    expect(layout).toContain("Polling avoids Android WebView channel reuse that can throw after subscription.");
    expect(layout).toContain("window.setInterval(() => void loadUnreadUpdates(), 30000)");
    expect(layout).not.toContain("member-web-updates-");
    expect(layout).toContain("}, [user?.id]);");
    expect(layout).not.toContain("}, [user?.id, open]);");
    expect(app).toContain('location.startsWith("/dashboard") || location === "/notifications" ? "/dashboard"');
  });

  it("uses the branded luggage, parcel, and plane loader for route and workspace loading states", () => {
    const app = read("apps/web/client/src/App.tsx");
    const dashboard = read("apps/web/client/src/components/DashboardLayout.tsx");
    const loader = read("apps/web/client/src/components/bridgex/DeliveryLoader.tsx");
    const styles = read("apps/web/client/src/index.css");
    expect(app).toContain("<DeliveryLoader />");
    expect(dashboard).toContain("<DeliveryLoader label=");
    expect(loader).toContain("bridgex-delivery-loader__luggage");
    expect(styles).toContain("bridgex-loader-plane-flight");
    expect(styles).toContain("bridgex-delivery-loader__package");
  });

  it("queues each new Control Panel update as an individual popup instead of combining multiple notifications", () => {
    const layout = read("apps/web/client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain("freshAdminRecords.forEach");
    expect(layout).toContain("index * 5400");
    expect(layout).toContain("toast.info(record.title");
    expect(layout).not.toContain("new Control Panel updates");
  });

  it("keeps exchange-rate publishing administrator-only and snapshots the CNY settlement conversion on a payment record", () => {
    const migration = read("supabase/migrations/202608201500_admin_exchange_rates_and_payment_snapshots.sql");
    const ratesPage = read("apps/web/client/src/pages/AdminExchangeRates.tsx");
    const payments = read("apps/web/client/src/pages/PaymentHistory.tsx");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.bridgex_exchange_rates");
    expect(migration).toContain("base_currency");
    expect(migration).toContain("settlement_currency := 'CNY'");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.save_bridgex_exchange_rate");
    expect(migration).toContain("Only an administrator can publish BridgeX payment exchange rates.");
    expect(ratesPage).toContain('const [base, setBase] = useState("BDT")');
    expect(ratesPage).toContain('const [quote, setQuote] = useState("CNY")');
    expect(ratesPage).toContain("currencies = [");
    expect(payments).toContain("Amount to pay");
    expect(payments).toContain("settlement_amount");
    expect(payments).toContain("Converted to CNY for this payment.");
    expect(payments).toContain("Payment screenshot (required)");
  });
});
