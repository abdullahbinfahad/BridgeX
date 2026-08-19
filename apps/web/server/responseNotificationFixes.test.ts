import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const interestPage = readFileSync(new URL("../client/src/pages/InterestPage.tsx", import.meta.url), "utf8");
const workspace = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
const publicLayout = readFileSync(new URL("../client/src/components/bridgex/PublicLayout.tsx", import.meta.url), "utf8");
const adminControl = readFileSync(new URL("../client/src/pages/AdminControl.tsx", import.meta.url), "utf8");
const secureReplyMigration = readFileSync(new URL("../../../supabase/migrations/202608191000_secure_contact_reply_delivery.sql", import.meta.url), "utf8");
const adminReadMigration = readFileSync(new URL("../../../supabase/migrations/202608191015_admin_section_read_state.sql", import.meta.url), "utf8");

describe("BridgeX response and unread-state fixes", () => {
  it("updates an existing interest rather than inserting a duplicate row", () => {
    expect(interestPage).toContain("maybeSingle()");
    expect(interestPage).toContain('update(payload).eq("id", existing.id)');
  });

  it("shows a safe member identity on every incoming response card", () => {
    expect(workspace).toContain('bridgex_member_badges").select("id,display_name,is_verified")');
    expect(workspace).toContain("participant.display_name");
  });

  it("clears destination-specific member notification counts after opening the destination", () => {
    expect(publicLayout).toContain("markDestinationRead");
    expect(publicLayout).toContain("[destination]: 0");
  });

  it("uses secure support delivery and per-admin read states", () => {
    expect(secureReplyMigration).toContain("send_bridgex_contact_reply");
    expect(secureReplyMigration).toContain("SECURITY DEFINER");
    expect(adminReadMigration).toContain("bridgex_admin_section_reads");
    expect(adminControl).toContain("markSectionRead");
    expect(adminControl).toContain("last_read_at");
  });
});
