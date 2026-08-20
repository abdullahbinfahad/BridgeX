import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const publicLayout = readFileSync(new URL("../client/src/components/bridgex/PublicLayout.tsx", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
const adminControl = readFileSync(new URL("../client/src/pages/AdminControl.tsx", import.meta.url), "utf8");
const deals = readFileSync(new URL("../client/src/pages/Deals.tsx", import.meta.url), "utf8");
const notifications = readFileSync(new URL("../client/src/pages/NotificationsPage.tsx", import.meta.url), "utf8");
const onboarding = readFileSync(new URL("../client/src/pages/Onboarding.tsx", import.meta.url), "utf8");
const offer = readFileSync(new URL("../client/src/pages/OfferPage.tsx", import.meta.url), "utf8");
const payments = readFileSync(new URL("../client/src/pages/PaymentHistory.tsx", import.meta.url), "utf8");

describe("BridgeX feedback and update navigation", () => {
  it("uses one application-wide interaction-feedback listener", () => {
    expect(app).toContain("function GlobalInteractionFeedback()");
    expect(app).toContain("<GlobalInteractionFeedback />");
  });

  it("shows one-time popups only for new Control Panel updates and routes Super Admins to the main panel", () => {
    expect(publicLayout).toContain("shownAdminUpdateIds");
    expect(publicLayout).toContain("bridgex-shown-admin-updates-");
    expect(publicLayout).toContain("New Control Panel update");
    expect(publicLayout).toContain('go("/admin", "admin")');
    expect(publicLayout).toContain('go("/dashboard", "workspace")');
    expect(publicLayout).toContain('go("/dashboard/settings", "profile")');
  });

  it("links request and listing response totals to their exact response groups", () => {
    expect(workspace).toContain("offer_count");
    expect(workspace).toContain("interest_count");
    expect(workspace).toContain("/dashboard/offers?request=");
    expect(workspace).toContain("/dashboard/offers?listing=");
  });

  it("renders live administrator section badges including reports", () => {
    expect(adminControl).toContain("loadUpdateCounts");
    expect(adminControl).toContain("reports: reports.count ?? 0");
    expect(adminControl).toContain("tabBadge(key");
  });

  it("returns the Workspace root to the public homepage and exposes complete notification history from Messages", () => {
    expect(app).toContain('location === "/dashboard" ? "/"');
    expect(deals).toContain('window.location.assign("/notifications")');
    expect(notifications).toContain("Load more updates");
    expect(notifications).toContain("All account, offer, payment, order, support, safety, and administrator updates appear here.");
  });

  it("requires complete protected-order profile details and explains the requirement during onboarding and traveler offers", () => {
    expect(onboarding).toContain("Complete your details before accepting protected work");
    expect(onboarding).toContain("current exact pickup location");
    expect(onboarding).toContain("home delivery location");
    expect(offer).toContain("Complete details are required for acceptance");
    expect(offer).toContain("Complete your profile before submitting an offer.");
  });

  it("opens a new payment directly and supports every nested payment status or record route", () => {
    expect(app).toContain('path={"/dashboard/payments/:view/:record"}');
    expect(app).toContain('path={"/dashboard/payments/:view"}');
    expect(app).toContain('location.startsWith("/dashboard/payments/") ? "/dashboard/payments"');
    expect(workspace).toContain('window.location.assign(`/dashboard/payments/record/${encodeURIComponent(data)}`)');
    expect(payments).toContain('const routeType = segments[2] ?? ""');
    expect(payments).toContain('const recordId = routeType === "record" ? segments[3] ?? "" : ""');
    expect(publicLayout).toContain('Payments{updateBadge(updates.payments)}');
  });

  it("keeps the browser Back control while durably suppressing it for Android WebView routes", () => {
    const mobileApp = readFileSync(new URL("../../mobile/App.tsx", import.meta.url), "utf8");
    expect(app).toContain('new URLSearchParams(window.location.search).get("app") === "android"');
    expect(app).toContain('window.sessionStorage.setItem("bridgex-android-wrapper", "true")');
    expect(app).toContain('/BridgeXAndroid\\//i.test(navigator.userAgent)');
    expect(mobileApp).toContain("document.documentElement.dataset.bridgexAndroidWrapper = 'true'");
    expect(mobileApp).toContain("bridgex-android-back-control-style");
    expect(mobileApp).toContain(".bridgex-global-back{display:none!important");
  });
});
