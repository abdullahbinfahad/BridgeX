import { describe, expect, it } from "vitest";
import { BANGLADESH_DISTRICTS, canAdvanceEscrowStage, citiesForDistrict } from "../shared/bridgex";
import { canSubmitIncidentReport, hasCompleteVerificationPacket, hasRequiredProfileLocations, normalizePostCategories, orderUpdateForAdminAction, signedInDestination } from "../shared/bridgeXControls";
import { validatePostMediaSelection } from "../client/src/lib/fileUpload";

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

  it("requires National ID and Passport, with Student ID only for declared students", () => {
    expect(hasCompleteVerificationPacket(["national_id", "passport"], false, "")).toBe(true);
    expect(hasCompleteVerificationPacket(["national_id"], false, "")).toBe(false);
    expect(hasCompleteVerificationPacket(["national_id", "passport"], true, "BridgeX University")).toBe(false);
    expect(hasCompleteVerificationPacket(["national_id", "passport", "student_id"], true, "BridgeX University")).toBe(true);
  });

  it("requires exact current and home locations, including China address when applicable", () => {
    const complete = { currentCountry: "Malaysia", currentCity: "Kuala Lumpur", currentAddress: "12 Central Road", homeCountry: "Bangladesh", homeCity: "Bhola", chinaAddress: "" };
    expect(hasRequiredProfileLocations(complete)).toBe(true);
    expect(hasRequiredProfileLocations({ ...complete, currentCountry: "China" })).toBe(false);
    expect(hasRequiredProfileLocations({ ...complete, currentCountry: "China", chinaAddress: "Tianhe District, Guangzhou" })).toBe(true);
  });

  it("normalizes multi-category post selections without blank or duplicate values", () => {
    expect(normalizePostCategories([" Personal item ", "Business product", "Personal item", ""])).toEqual(["Personal item", "Business product"]);
  });

  it("allows a post gallery of up to five images and one short video only", () => {
    expect(validatePostMediaSelection([{ type: "image/jpeg" }, { type: "image/png" }, { type: "video/mp4" }])).toBeNull();
    expect(validatePostMediaSelection(Array.from({ length: 6 }, () => ({ type: "image/jpeg" })))).toBe("Choose up to five images.");
    expect(validatePostMediaSelection([{ type: "video/mp4" }, { type: "video/webm" }])).toBe("Choose only one short video.");
    expect(validatePostMediaSelection([{ type: "application/pdf" }])).toBe("Choose only JPG, PNG, WEBP, MP4, or WebM files.");
  });
});
