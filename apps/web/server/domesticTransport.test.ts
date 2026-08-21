import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("BridgeX Train and domestic-route support", () => {
  it("offers Train in the listing composer and preserves domestic same-country matching guidance", () => {
    const createFlow = read("../client/src/pages/CreateFlow.tsx");
    expect(createFlow).toContain('<option value="train">Train</option>');
    expect(createFlow).toContain("Domestic route selected");
    expect(createFlow).toContain("Domestic and international routes are supported");
    expect(createFlow).toContain('form.mode === "train"');
  });

  it("allows Train through every active schema contract and public post display", () => {
    const schema = read("../drizzle/schema.ts");
    const router = read("../server/routers.ts");
    const detail = read("../client/src/pages/PostDetail.tsx");
    const migration = read("../../../supabase/migrations/202608211630_add_train_transport_mode.sql");
    expect(schema).toContain('["flight", "train", "cargo"]');
    expect(router).toContain('z.enum(["flight", "train", "cargo"])');
    expect(detail).toContain('mode === "train" ? "Train"');
    expect(migration).toContain("('flight', 'train', 'cargo')");
  });
});
