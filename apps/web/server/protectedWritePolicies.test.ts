import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), "..", "..", path), "utf8");

describe("BridgeX protected write policy regression coverage", () => {
  const migration = read("supabase/migrations/202608220800_secure_match_message_and_notification_writes.sql");
  const nativeApi = read("apps/mobile/src/lib/api.ts");
  const deals = read("apps/web/client/src/pages/Deals.tsx");

  it("uses a participant-checked RPC for protected message submission instead of relying on client-supplied sender ids", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.send_bridgex_match_message");
    expect(migration).toContain("auth.uid() IS NULL");
    expect(migration).toContain("m.status IN ('active', 'completed', 'disputed')");
    expect(migration).toContain("INSERT INTO public.match_messages (match_id, sender_id, body)");
    expect(nativeApi).toContain('rpc("send_bridgex_match_message"');
    expect(deals).toContain('rpc("send_bridgex_match_message"');
    expect(nativeApi).not.toContain('from("match_messages").insert');
    expect(deals).not.toContain('from("match_messages").insert');
  });

  it("permits member notifications only for the legitimate counterpart of an owned request or carry listing", () => {
    expect(migration).toContain("notifications_insert_related_or_admin");
    expect(migration).toContain("r.user_id = notifications.user_id AND auth.uid() <> r.user_id");
    expect(migration).toContain("o.traveler_id = notifications.user_id");
    expect(migration).toContain("l.user_id = notifications.user_id AND auth.uid() <> l.user_id");
    expect(migration).toContain("i.sender_id = notifications.user_id");
  });
});
