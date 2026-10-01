import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("legacy APK release URL", () => {
  it("does not advertise a dead legacy Expo artifact", () => {
    const layout = readFileSync("client/src/components/bridgex/PublicLayout.tsx", "utf8");
    expect(layout).toContain("/downloads/legacy");
    expect(layout).not.toContain("gvKYcGm-EOEkMHrYlfXecz3myOsJoCBtOWHkPh3KAsQ.apk");
  });
});
