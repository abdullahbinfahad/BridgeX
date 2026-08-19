import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../../supabase/migrations/202608190900_cargo_capacity_fulfillment.sql", import.meta.url), "utf8");

describe("cargo capacity fulfillment migration", () => {
  it("stores consumed capacity separately from the total listing capacity", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS filled_weight_kg numeric NOT NULL DEFAULT 0");
    expect(migration).toContain("SET filled_weight_kg = COALESCE((");
  });

  it("prevents accepting an interest that exceeds remaining capacity", () => {
    expect(migration).toContain("v_remaining_weight := v_listing.available_weight_kg - COALESCE(v_listing.filled_weight_kg, 0)");
    expect(migration).toContain("IF v_interest_weight > v_remaining_weight THEN");
  });

  it("keeps a listing open until accepted weights consume its available capacity", () => {
    expect(migration).toContain("status = CASE WHEN COALESCE(filled_weight_kg, 0) + v_interest_weight >= available_weight_kg THEN 'closed' ELSE 'open' END");
    expect(migration).toContain("IF v_interest_weight >= v_remaining_weight THEN");
  });
});
