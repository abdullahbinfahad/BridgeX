import { describe, expect, it } from "vitest";
import { BANGLADESH_DISTRICTS, canAdvanceEscrowStage, citiesForDistrict } from "../shared/bridgex";
import { canSubmitIncidentReport, orderUpdateForAdminAction, signedInDestination } from "../shared/bridgeXControls";

describe("BridgeX marketplace rules", () => {
  it("includes Bangladesh districts used by delivery-address selectors", () => {
    expect(BANGLADESH_DISTRICTS).toContain("Dhaka");
    expect(BANGLADESH_DISTRICTS).toContain("Bhola");
    expect(citiesForDistrict("Dhaka")).toContain("Dhaka City");
    expect(citiesForDistrict("Bhola")).toContain("Lalmohan");
  });

  it("permits only the next valid escrow lifecycle stage", () => {
    expect(canAdvanceEscrowStage("offer_accepted", "funded")).toBe(true);
    expect(canAdvanceEscrowStage("funded", "in_transit")).toBe(false);
    expect(canAdvanceEscrowStage("delivered", "released")).toBe(true);
  });

  it("allows a dispute before release but never after release", () => {
    expect(canAdvanceEscrowStage("in_transit", "disputed")).toBe(true);
    expect(canAdvanceEscrowStage("released", "disputed")).toBe(false);
  });

  it("requires a valid category, meaningful description, and consent for an incident report", () => {
    expect(canSubmitIncidentReport("suspected_fraud", "The traveler requested payment outside the agreed escrow process.", true)).toBe(true);
    expect(canSubmitIncidentReport("unknown", "The traveler requested payment outside the agreed escrow process.", true)).toBe(false);
    expect(canSubmitIncidentReport("suspected_fraud", "Too short", true)).toBe(false);
    expect(canSubmitIncidentReport("suspected_fraud", "The traveler requested payment outside the agreed escrow process.", false)).toBe(false);
  });

  it("maps administrator order actions to explicit escrow and fulfillment updates", () => {
    expect(orderUpdateForAdminAction("fund")).toEqual({ escrow_status: "funded" });
    expect(orderUpdateForAdminAction("release")).toEqual({ escrow_status: "released", fulfillment_status: "completed" });
    expect(orderUpdateForAdminAction("dispute")).toEqual({ escrow_status: "disputed", fulfillment_status: "disputed" });
  });

  it("sends completed members to their dashboard while new members continue profile setup", () => {
    expect(signedInDestination(true)).toBe("/dashboard");
    expect(signedInDestination(false)).toBe("/onboarding");
  });
});
