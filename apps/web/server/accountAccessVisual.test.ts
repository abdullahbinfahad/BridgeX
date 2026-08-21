import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const access = readFileSync(new URL("../client/src/pages/Access.tsx", import.meta.url), "utf8");

describe("BridgeX account-access delivery visual", () => {
  it("uses the optimized delivery animation beneath the account trust message without blocking initial loading", () => {
    expect(access).toContain("/manus-storage/bridgex-delivery-motion_c0394da2.webp");
    expect(access).toContain('alt="Animated delivery route visual"');
    expect(access).toContain('loading="lazy"');
    expect(access).toContain('decoding="async"');
    expect(access).toContain("mt-7 flex h-48 items-center justify-center");
  });
});
