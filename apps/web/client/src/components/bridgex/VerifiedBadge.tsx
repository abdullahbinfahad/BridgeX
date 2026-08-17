import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ label = "Verified" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#dff5ea] px-2 py-1 text-[11px] font-bold text-[#176447]">
      <BadgeCheck className="size-3.5" strokeWidth={2.6} />
      {label}
    </span>
  );
}
