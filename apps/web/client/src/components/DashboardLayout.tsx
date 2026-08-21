import { Brand } from "@/components/bridgex/Brand";
import { VerifiedBadge } from "@/components/bridgex/VerifiedBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/_core/hooks/useAuth";
import DeliveryLoader from "@/components/bridgex/DeliveryLoader";
import { BarChart3, BadgeCheck, Bell, BookOpenCheck, CheckCircle2, CircleDollarSign, FileText, LayoutDashboard, LogOut, MessageSquareText, PackageCheck, PanelLeft, Pencil, Plane, Settings, ShieldAlert, ShieldCheck, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

type LayoutMode = "member" | "admin";
type Props = { children: React.ReactNode; mode?: LayoutMode; preview?: boolean };

const memberMenu = [
  [LayoutDashboard, "Overview", "/dashboard"], [PackageCheck, "My requests", "/dashboard/requests"], [Plane, "My carry space", "/dashboard/listings"], [Pencil, "Manage posts", "/dashboard/manage-posts"], [BookOpenCheck, "Offers", "/dashboard/offers"], [CircleDollarSign, "Payment history", "/dashboard/payments"], [MessageSquareText, "Deals & chat", "/dashboard/deals"], [Bell, "Notifications", "/notifications"], [FileText, "Orders", "/dashboard/orders"], [CheckCircle2, "Completed orders", "/dashboard/completed"], [MessageSquareText, "Reviews", "/dashboard/reviews"], [CircleDollarSign, "Wallet", "/dashboard/wallet"], [ShieldAlert, "Safety report", "/report-incident"], [BadgeCheck, "Verification", "/dashboard/verification"], [Settings, "Settings", "/dashboard/settings"],
] as const;
const adminMenu = [[LayoutDashboard, "Overview", "/admin"], [BadgeCheck, "Verification queue", "/admin/verification"], [CircleDollarSign, "Exchange rates", "/admin/exchange-rates"], [FileText, "Orders & payments", "/admin/orders"], [ShieldAlert, "Reports", "/admin/reports"], [Users, "Users", "/admin/users"], [BarChart3, "Analytics", "/admin/analytics"]] as const;

export default function DashboardLayout({ children, mode = "member", preview = false }: Props) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const previewUser = mode === "admin" ? { name: "BridgeX Admin", email: "admin@bridgex.market" } : { name: "Sadia Rahman", email: "sadia@bridgex.market" };
  const currentUser = user ?? (preview ? previewUser : null);
  const menu = mode === "admin" ? adminMenu : memberMenu;

  if (loading && !preview) return <DeliveryLoader label="Preparing your workspace" description="Loading your protected orders and activity…" />;
  if (!currentUser) return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] px-5"><div className="max-w-md rounded-3xl border border-[#172126]/8 bg-white p-8 text-center shadow-sm"><Brand className="justify-center" /><h1 className="mt-7 font-display text-3xl font-bold tracking-[-0.05em]">Sign in to your workspace</h1><p className="mt-3 text-sm leading-6 text-[#647174]">Manage requests, travel capacity, protected orders, verification, and wallet activity in one place.</p><Button onClick={() => setLocation("/access")} className="mt-7 h-11 w-full rounded-xl bg-[#172126] font-bold">Continue to BridgeX</Button></div></div>;

  const workspaceOffset = collapsed ? "xl:ml-[76px]" : "xl:ml-[250px]";
  const verificationStatus = "verificationStatus" in currentUser ? currentUser.verificationStatus : undefined;
  const verificationLabel = verificationStatus === "approved" ? <VerifiedBadge /> : <span className="text-[11px] font-bold text-[#7a8685]">{verificationStatus === "pending_review" ? "Review pending" : "Not verified"}</span>;
  const avatarUrl = "avatarUrl" in currentUser ? currentUser.avatarUrl : undefined;
  const isRestricted = !preview && "suspended" in currentUser && currentUser.suspended === true;
  const restrictionReason = "profile" in currentUser ? currentUser.profile?.restriction_reason : undefined;

  return <div className="min-h-screen bg-[#f7f5ef] text-[#172126]">
    <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-[#172126]/8 bg-[#fffdf8] transition-all xl:block ${collapsed ? "w-[76px]" : "w-[250px]"}`}>
      <div className="flex h-[74px] items-center justify-between border-b border-[#172126]/8 px-4"><button onClick={() => setLocation("/")} aria-label="Go to BridgeX homepage"><Brand compact={collapsed} /></button><button onClick={() => setCollapsed(value => !value)} aria-label="Collapse dashboard navigation" className="grid size-9 place-items-center rounded-xl bg-[#f0ede5] text-[#526063]"><PanelLeft className="size-4" /></button></div>
      <ScrollArea className="h-[calc(100vh-154px)] py-4"><nav className="grid gap-1 px-3">{menu.map(([Icon, label, path]) => <button key={path} onClick={() => setLocation(path)} title={collapsed ? label : undefined} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${location === path ? "bg-[#172126] text-[#f7f5ef]" : "text-[#596568] hover:bg-[#eeeae0]"}`}><Icon className="size-[18px] shrink-0" /><span className={collapsed ? "hidden" : "truncate"}>{label}</span></button>)}</nav></ScrollArea>
      <div className="absolute inset-x-0 bottom-0 border-t border-[#172126]/8 p-3"><div className="flex items-center gap-2.5"><Avatar className="size-9 border border-[#dce6df]"><AvatarImage src={avatarUrl} alt="Profile photo" /><AvatarFallback className="bg-[#dff5ea] text-xs font-bold text-[#176447]">{currentUser.name?.charAt(0) ?? "B"}</AvatarFallback></Avatar><div className={collapsed ? "hidden" : "min-w-0 flex-1"}><p className="truncate text-xs font-bold">{currentUser.name}</p><div className="mt-0.5">{verificationLabel}</div></div>{!preview && <button aria-label="Log out" onClick={logout} className={collapsed ? "hidden" : "text-[#697577] hover:text-[#172126]"}><LogOut className="size-4" /></button>}</div></div>
    </aside>
    <div className={`transition-all ${workspaceOffset}`}>
      <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[#172126]/8 bg-[#f7f5ef]/90 px-5 backdrop-blur-xl xl:px-8"><button onClick={() => setLocation("/")} aria-label="Go to BridgeX homepage" className="flex items-center gap-3 xl:hidden"><Brand compact /><span className="text-sm font-bold">BridgeX</span></button><div className="hidden xl:block"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6d7c77]">{mode === "admin" ? "Control room" : "Member workspace"}</p></div><div className="flex items-center gap-2"><span className="hidden text-xs font-semibold text-[#637073] sm:inline">{preview ? "Preview mode" : currentUser.email}</span><span className="grid size-9 place-items-center rounded-xl bg-[#dff5ea] text-[#176447]"><ShieldCheck className="size-4" /></span></div></header>
      <main className="p-5 lg:p-8">{isRestricted && <section role="alert" className="mb-6 rounded-2xl border border-[#cf8f73] bg-[#fff5ef] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-[#94462d]">Your BridgeX account is restricted</p><p className="mt-1 max-w-3xl text-sm leading-6 text-[#834631]">{restrictionReason || "An administrator temporarily restricted this account. You can request a review through Contact support."}</p></div><Button onClick={() => setLocation("/contact?kind=moderation_appeal")} size="sm" variant="outline" className="rounded-lg border-[#cf8f73] bg-white text-[#94462d]">Request a review</Button></div></section>}{children}</main>
    </div>
  </div>;
}
