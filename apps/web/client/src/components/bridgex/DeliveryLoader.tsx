import { Luggage, PackageCheck, Plane } from "lucide-react";

type DeliveryLoaderProps = { label?: string; description?: string; compact?: boolean };

export default function DeliveryLoader({ label = "Preparing your BridgeX route", description = "Loading your secure delivery workspace…", compact = false }: DeliveryLoaderProps) {
  return <div className={`bridgex-delivery-loader ${compact ? "bridgex-delivery-loader--compact" : ""}`} role="status" aria-live="polite"><div className="bridgex-delivery-loader__scene" aria-hidden="true"><span className="bridgex-delivery-loader__route" /><span className="bridgex-delivery-loader__plane"><Plane className="size-5" /></span><span className="bridgex-delivery-loader__package"><PackageCheck className="size-5" /></span><span className="bridgex-delivery-loader__luggage"><Luggage className="size-6" /></span></div><div className="text-center"><p className="font-display text-2xl font-bold tracking-[-0.04em] text-[#172126]">{label}</p><p className="mt-2 text-sm text-[#637073]">{description}</p></div></div>;
}
