import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 text-[#172126]", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-[#172126] text-[#f5f1e9] shadow-[0_8px_22px_rgba(23,33,38,0.16)]">
        <Compass className="size-[18px]" strokeWidth={2.2} />
      </span>
      {!compact && <span className="font-display text-xl font-bold tracking-[-0.05em]">BridgeX</span>}
    </div>
  );
}
