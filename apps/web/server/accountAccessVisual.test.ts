import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const access = readFileSync(new URL("../client/src/pages/Access.tsx", import.meta.url), "utf8");

describe("BridgeX account-access delivery visual", () => {
  it("uses the optimized delivery animation as a complete trust-panel background without blocking account access", () => {
    expect(access).toContain("const ACCOUNT_ACCESS_DELIVERY_VISUAL = \"https://bridgexmp-fcp7rl7v.manus.space/manus-storage/bridgex-delivery-motion_c0394da2.webp\"");
    expect(access).toContain('aria-hidden="true"');
    expect(access).toContain('loading="eager"');
    expect(access).toContain('decoding="async"');
    expect(access).toContain('fetchPriority="low"');
    expect(access).toContain("absolute inset-0 h-full w-full object-cover object-center opacity-55");
    expect(access).toContain("bg-gradient-to-br from-[#101d21]/95 via-[#172126]/84 to-[#172126]/72");
    expect(access).not.toContain("mt-7 flex h-48 items-center justify-center");
  });
});
