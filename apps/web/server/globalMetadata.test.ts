import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const metadata = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("BridgeX global browser metadata", () => {
  it("positions BridgeX as a global anywhere-to-anywhere courier alternative", () => {
    expect(metadata).toContain("BridgeX — Global Courier Alternative for Anywhere-to-Anywhere Delivery");
    expect(metadata).toContain("global peer-to-peer courier alternative");
    expect(metadata).toContain("lawful anywhere-to-anywhere goods delivery");
    expect(metadata).not.toContain("Send Goods from China with Trusted Travelers");
  });
});
