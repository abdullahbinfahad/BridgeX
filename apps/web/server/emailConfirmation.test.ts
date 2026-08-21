import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const access = readFileSync(new URL("../client/src/pages/Access.tsx", import.meta.url), "utf8");

describe("BridgeX email-confirmed registration", () => {
  it("redirects confirmation links back to BridgeX and tells a new account owner to confirm email before sign-in", () => {
    expect(access).toContain('emailRedirectTo: `${window.location.origin}/access`');
    expect(access).toContain("Check your email inbox and confirm your address before signing in.");
    expect(access).toContain("Confirm your email from the BridgeX message in your inbox before signing in.");
    expect(access).toContain("BridgeX sends a confirmation message to this address");
  });
});
