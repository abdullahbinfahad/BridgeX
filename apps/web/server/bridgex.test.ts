import { describe, expect, it } from "vitest";
import { BANGLADESH_DISTRICTS, canAdvanceEscrowStage, citiesForDistrict } from "../shared/bridgex";

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
});
