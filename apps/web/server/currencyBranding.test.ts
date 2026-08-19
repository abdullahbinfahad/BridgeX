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

  it("uses the supplied logo for shared web branding, browser favicon, and mobile app configuration", () => {
    expect(read("apps/web/client/src/components/bridgex/Brand.tsx")).toContain("bridgex-logo.png");
    expect(read("apps/web/client/index.html")).toContain("/favicon.ico");
    expect(read("apps/mobile/app.json")).toContain("./assets/icon.png");
  });
});
