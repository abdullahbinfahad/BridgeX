import { cn } from "@/lib/utils";

const BRIDGEX_LOGO_URL = "https://github.com/abdullahbinfahad/BridgeX/releases/download/windows-v1.0.0/bridgex-logo.png";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 text-[#172126]", className)}>
      <img src={BRIDGEX_LOGO_URL} alt="BridgeX" className="size-9 rounded-xl object-cover shadow-[0_8px_22px_rgba(23,33,38,0.16)]" />
      {!compact && <span className="font-display text-xl font-bold tracking-[-0.05em]">BridgeX</span>}
    </div>
  );
}
