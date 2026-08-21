import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("BridgeX Contact enquiry access", () => {
  it("accepts short but meaningful guest and member messages with aligned client and database checks", () => {
    const contact = read("../client/src/pages/ContactPage.tsx");
    const migration = read("../../../supabase/migrations/202608211300_relax_contact_enquiry_message_validation.sql");
    expect(contact).toContain("const CONTACT_MESSAGE_MIN_LENGTH = 3");
    expect(contact).toContain("message.length < CONTACT_MESSAGE_MIN_LENGTH");
    expect(contact).toContain("user_id: user?.id ?? null");
    expect(migration).toContain("DROP CONSTRAINT IF EXISTS contact_enquiries_message_check");
    expect(migration).toContain("char_length(btrim(message)) BETWEEN 3 AND 4000");
  });

  it("keeps Contact accessible from public navigation and the footer", () => {
    const layout = read("../client/src/components/bridgex/PublicLayout.tsx");
    expect(layout).toContain('{ label: "Contact", href: "/contact" }');
    expect(layout).toContain("data-bridgex-contact-footer");
    expect(layout).toContain('contact.href = "/contact"');
  });
});
