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

  it("alerts members when they enter an unread profile, workspace, or message destination", () => {
    expect(publicLayout).toContain("new ${destination === \"profile\" ? \"profile\"");
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
