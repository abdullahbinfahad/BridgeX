import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const publicLayout = readFileSync(new URL("../client/src/components/bridgex/PublicLayout.tsx", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
const adminControl = readFileSync(new URL("../client/src/pages/AdminControl.tsx", import.meta.url), "utf8");

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
});
