import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const createFlow = readFileSync(new URL("../client/src/pages/CreateFlow.tsx", import.meta.url), "utf8");

describe("carry-space publication warning", () => {
  it("requires an explicit acknowledgement before publishing a carry listing", () => {
    expect(createFlow).toContain("const acknowledged = window.confirm");
    expect(createFlow).toContain("Make sure you can fulfill the written requirements, delivery deadline, and product handling needs.");
    expect(createFlow).toContain("Best wishes for a safe, lawful delivery.");
  });
});
