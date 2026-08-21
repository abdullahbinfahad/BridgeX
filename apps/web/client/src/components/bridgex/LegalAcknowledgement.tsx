import { FileCheck2 } from "lucide-react";
import { Link } from "wouter";

export const BRIDGEX_TERMS_VERSION = "2026-08-21";

export type LegalAcknowledgementAction = "send_request" | "carry_listing" | "offer" | "listing_interest" | "protected_acceptance";

const copyByAction: Record<LegalAcknowledgementAction, string> = {
  send_request: "I have read the Terms & Conditions. I confirm that my item description, quantity, value, route, and purpose are accurate; that the item is lawful and may be transported; and that I will meet any applicable declaration, customs, tax, carrier, and local-law requirements.",
  carry_listing: "I have read the Terms & Conditions. I will not carry undeclared, prohibited, restricted, counterfeit, dangerous, or materially misdescribed items. I understand that I remain responsible for applicable transport, declaration, customs, tax, and local-law requirements.",
  offer: "I have read the Terms & Conditions. I can meet the stated route, timing, item, and handling requirements, and I will follow applicable transport, declaration, customs, tax, and local-law requirements.",
  listing_interest: "I have read the Terms & Conditions. I confirm that every item in this interest is accurately described, lawful to send, and not concealed, substituted, prohibited, dangerous, restricted, or materially different from this description.",
  protected_acceptance: "I have read the Terms & Conditions and confirm that I understand the selected response, item description, route, and declared obligations. I will not use BridgeX to conceal goods, avoid lawful declarations, or misrepresent an item’s nature, value, quantity, or purpose.",
};

export function acknowledgementText(action: LegalAcknowledgementAction) {
  return copyByAction[action];
}

export function LegalAcknowledgement({ action, checked, onCheckedChange, compact = false }: { action: LegalAcknowledgementAction; checked: boolean; onCheckedChange: (checked: boolean) => void; compact?: boolean }) {
  return <div className={`${compact ? "mt-3" : ""} rounded-2xl border border-[#d8c58e] bg-[#fff9ea] p-4 text-sm leading-6 text-[#5e512c]`}>
    <div className="flex items-start gap-3">
      <FileCheck2 className="mt-0.5 size-5 shrink-0 text-[#876719]" />
      <label className="cursor-pointer">
        <span className="flex items-start gap-2 font-semibold">
          <input required type="checkbox" checked={checked} onChange={event => onCheckedChange(event.target.checked)} className="mt-1 size-4 shrink-0" />
          <span>{acknowledgementText(action)}</span>
        </span>
        <span className="mt-2 block text-xs text-[#79693b]">This acknowledgement is recorded with your action. Read the <Link href="/terms" className="font-bold text-[#765a13] underline underline-offset-2">Terms & Conditions</Link> and <Link href="/safety" className="font-bold text-[#765a13] underline underline-offset-2">Safety guidance</Link>.</span>
      </label>
    </div>
  </div>;
}
