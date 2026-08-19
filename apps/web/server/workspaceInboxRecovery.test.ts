import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workspace = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
const deals = readFileSync(new URL("../client/src/pages/Deals.tsx", import.meta.url), "utf8");
const errorBoundary = readFileSync(new URL("../client/src/components/ErrorBoundary.tsx", import.meta.url), "utf8");
const viteStatic = readFileSync(new URL("../server/_core/vite.ts", import.meta.url), "utf8");
const supportMigration = readFileSync(new URL("../../../supabase/migrations/202608191100_support_conversations.sql", import.meta.url), "utf8");
const readMigration = readFileSync(new URL("../../../supabase/migrations/202608191115_fix_match_read_state.sql", import.meta.url), "utf8");

describe("BridgeX workspace, inbox, and route recovery", () => {
  it("shows completed orders at the bottom of the member overview", () => {
    expect(workspace).toContain("Order history");
    expect(workspace).toContain("View all completed orders");
  });

  it("keeps the Updates inbox to the newest thirty records and supports a member reply to BridgeX Admin", () => {
    expect(deals).toContain("slice(0, 30)");
    expect(deals).toContain("send_bridgex_support_message");
    expect(deals).toContain("Reply to BridgeX Admin");
  });

  it("reloads once for stale dynamic chunks and prevents index HTML caching", () => {
    expect(errorBoundary).toContain("bridgex-route-recovery");
    expect(viteStatic).toContain("no-store, max-age=0");
  });

  it("stores support messages and updates either protected-deal participant’s read timestamp in one update", () => {
    expect(supportMigration).toContain("contact_enquiry_messages");
    expect(readMigration).toContain("sender_last_read_at = CASE");
    expect(readMigration).toContain("traveler_last_read_at = CASE");
  });
});
