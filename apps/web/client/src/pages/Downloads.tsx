import PublicLayout from "@/components/bridgex/PublicLayout";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ExternalLink, Laptop, Smartphone } from "lucide-react";

const ANDROID_APK = "https://expo.dev/artifacts/eas/CtUDQ5jVf5jYstJS5lI7eTYI5XmY7LsxQSX4JLwe7LQ.apk";

function DownloadCard({ icon: Icon, title, description, href, label, muted = false }: { icon: typeof Smartphone; title: string; description: string; href?: string; label: string; muted?: boolean }) {
  return (
    <article className={`rounded-3xl border p-6 sm:p-7 ${muted ? "border-[#172126]/8 bg-[#f3f1ea]" : "border-[#b9dfc9] bg-[#f0faf3]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`grid size-12 place-items-center rounded-2xl ${muted ? "bg-[#e5e1d7] text-[#637073]" : "bg-[#d5f1df] text-[#176447]"}`}><Icon className="size-6" /></div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${muted ? "bg-[#e5e1d7] text-[#637073]" : "bg-white text-[#176447]"}`}>{muted ? "In preparation" : "Ready"}</span>
      </div>
      <h2 className="mt-6 text-xl font-bold tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-[#637073]">{description}</p>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="mt-6 inline-flex"><Button className="rounded-xl bg-[#172126] font-bold text-[#f7f5ef] hover:bg-[#2a383e]"><ArrowDownToLine className="mr-2 size-4" />{label}</Button></a> : <Button disabled variant="outline" className="mt-6 rounded-xl border-[#172126]/12 bg-white font-bold text-[#637073]"><Laptop className="mr-2 size-4" />{label}</Button>}
    </article>
  );
}

export default function Downloads() {
  return <PublicLayout><main className="px-5 py-12 lg:px-8 lg:py-16"><div className="mx-auto max-w-[1120px]"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#23784f]">Downloads</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-[-0.055em] sm:text-5xl">Use BridgeX on the device that fits your workflow.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#637073]">The current Android build is available for testing and direct installation. Desktop and HarmonyOS packages are being prepared separately; we do not label an unavailable package as downloadable.</p><div className="mt-10 grid gap-5 md:grid-cols-2"><DownloadCard icon={Smartphone} title="Android app — independent native" description="BridgeX 1.6.7 · Build 24. Use this APK for direct Android installation and testing." href={ANDROID_APK} label="Download for Android" /></div><div className="mt-5 grid gap-5 md:grid-cols-3"><DownloadCard icon={Laptop} title="Windows" description="A signed Windows package is not published yet. The web app remains available in every modern desktop browser." label="Windows version coming soon" muted /><DownloadCard icon={Laptop} title="HarmonyOS" description="A HarmonyOS package is not published yet. Do not install an APK renamed as a HarmonyOS application." label="HarmonyOS version coming soon" muted /><DownloadCard icon={Laptop} title="macOS" description="A notarized macOS package is not published yet. Use the web app until the desktop release is signed." label="macOS version coming soon" muted /></div><div className="mt-10 rounded-3xl bg-[#172126] p-6 text-[#f7f5ef] sm:p-8"><ExternalLink className="size-6 text-[#91e7bc]" /><h2 className="mt-4 text-xl font-bold">Before installing</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#c3d0c9]">Verify that the download is from an official BridgeX link, keep Play Protect enabled, and review the file checksum supplied with the release package. Never install a modified copy from an unknown mirror.</p></div></div></main></PublicLayout>;
}
