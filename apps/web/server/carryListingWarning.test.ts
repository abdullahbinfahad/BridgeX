import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const createFlow = readFileSync(new URL("../client/src/pages/CreateFlow.tsx", import.meta.url), "utf8");

describe("carry-space publication acknowledgement", () => {
  it("requires the BridgeX legal acknowledgement before publishing a carry listing", () => {
    expect(createFlow).toContain('LegalAcknowledgement action="carry_listing"');
    expect(createFlow).toContain('if (!acknowledged) return setMessage("Read and accept the Terms & Conditions before publishing.")');
    expect(createFlow).toContain("terms_accepted_at");
    expect(createFlow).toContain("terms_version: BRIDGEX_TERMS_VERSION");
  });
});
