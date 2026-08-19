import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../../supabase/migrations/202608190930_interest_item_quantities_and_delivery_date.sql", import.meta.url), "utf8");

describe("carry-interest detail migration", () => {
  it("stores structured quantities for selected items", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS item_quantities jsonb NOT NULL DEFAULT '{}'::jsonb");
  });

  it("stores a sender delivery-required date for each interest", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS delivery_required_by date");
    expect(migration).toContain("listing_interests_delivery_required_by_idx");
  });
});
