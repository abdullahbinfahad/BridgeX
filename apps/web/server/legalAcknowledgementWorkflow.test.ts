import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const requestFlow = readFileSync(new URL("../client/src/pages/CreateFlow.tsx", import.meta.url), "utf8");
const offerPage = readFileSync(new URL("../client/src/pages/OfferPage.tsx", import.meta.url), "utf8");
const interestPage = readFileSync(new URL("../client/src/pages/InterestPage.tsx", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../../supabase/migrations/202608211800_legal_acknowledgements_and_acceptance_gate.sql", import.meta.url), "utf8");
const marketingPages = readFileSync(new URL("../client/src/pages/MarketingPages.tsx", import.meta.url), "utf8");

describe("BridgeX legal acknowledgement workflow", () => {
  it("requires visible terms acknowledgements for posts, offers, interests, and protected acceptance", () => {
    expect(requestFlow).toContain('LegalAcknowledgement action="send_request"');
    expect(requestFlow).toContain('LegalAcknowledgement action="carry_listing"');
    expect(offerPage).toContain('LegalAcknowledgement action="offer"');
    expect(interestPage).toContain('LegalAcknowledgement action="listing_interest"');
    expect(workspace).toContain('LegalAcknowledgement compact action="protected_acceptance"');
  });

  it("persists terms version data and rejects unacknowledged database actions", () => {
    expect(migration).toContain("bridgex_legal_acknowledgements");
    expect(migration).toContain("enforce_bridgex_terms_acknowledgement");
    expect(migration).toContain("p_terms_version text");
    expect(migration).toContain("Read and accept the current BridgeX Terms & Conditions");
  });

  it("uses original BridgeX-specific customs and sender-truthfulness guidance", () => {
    expect(marketingPages).toContain("BridgeX platform role");
    expect(marketingPages).toContain("Calling an item personal luggage");
    expect(marketingPages).toContain("A sender must not conceal, substitute, relabel");
    expect(marketingPages).toContain("Are domestic routes supported?");
  });
});
