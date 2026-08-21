import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brand } from "@/components/bridgex/Brand";
import { VerifiedBadge } from "@/components/bridgex/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { CircleDollarSign, Crown, LogOut, Menu, MessageSquareText, Plane, Plus, Settings, ShieldCheck, UserRound } from "lucide-react";
import { playBridgeXFeedback } from "@/lib/feedback";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS, SystemLanguage } from "@/lib/language";

const displayName = (user: ReturnType<typeof useAuth>["user"]) => user?.name || user?.email?.split("@")[0] || "Member";
const ANDROID_BUILD = 7;
const ANDROID_DOWNLOAD_URL = "https://expo.dev/accounts/abdullahbinfahadabfs-team/projects/bridgex/builds/1ecca5d1-5f3e-4ac5-8dc5-b22781d0ea5c";

function AndroidUpdatePrompt() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const parameters = new URLSearchParams(window.location.search); const installedBuild = Number(parameters.get("build") || "0"); const key = `bridgex-android-update-dismissed-${installedBuild}`; if (parameters.get("app") === "android" && Number.isFinite(installedBuild) && installedBuild < ANDROID_BUILD && window.sessionStorage.getItem(key) !== "1") setVisible(true); }, []);
  if (!visible) return null;
  const dismiss = () => { const installedBuild = new URLSearchParams(window.location.search).get("build") || "0"; window.sessionStorage.setItem(`bridgex-android-update-dismissed-${installedBuild}`, "1"); setVisible(false); };
  return <div className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-md rounded-2xl border border-[#91e7bc]/45 bg-[#172126]/95 p-4 text-[#f7f5ef] shadow-2xl backdrop-blur-xl"><p className="text-sm font-bold">A newer BridgeX app is available.</p><p className="mt-1 text-xs leading-5 text-[#c3d0c9]">Update for improved typing, document uploads, Back navigation, and return-to-draft support.</p><div className="mt-3 flex gap-2"><a href={ANDROID_DOWNLOAD_URL} target="_blank" rel="noreferrer" className="rounded-lg bg-[#91e7bc] px-3 py-2 text-xs font-bold text-[#172126]">Update app</a><button onClick={dismiss} className="rounded-lg px-3 py-2 text-xs font-bold text-[#d6ddd7]">Not now</button></div></div>;
}

function NativePushBridge() {
  const { user } = useAuth();
  useEffect(() => {
    const bridge = (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView;
    if (!user || !bridge) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) bridge.postMessage(JSON.stringify({ type: "BRIDGEX_AUTH", userId: user.id, accessToken: data.session.access_token }));
    });
  }, [user?.id]);
  useEffect(() => { const applyReleaseFooter = () => { const androidLink = document.querySelector<HTMLAnchorElement>("[data-bridgex-android-download]"); if (androidLink) androidLink.href = ANDROID_DOWNLOAD_URL; const footer = document.querySelector("footer"); if (footer && !footer.querySelector("[data-bridgex-copyright]")) { const copyright = document.createElement("div"); copyright.dataset.bridgexCopyright = "true"; copyright.className = "border-t border-white/10 px-5 py-4 text-center text-xs font-semibold text-[#8fa39a]"; copyright.textContent = "© 2027 BridgeX. All rights reserved."; footer.appendChild(copyright); } }; const timer = window.setTimeout(applyReleaseFooter, 0); return () => window.clearTimeout(timer); }, []);
  return <AndroidUpdatePrompt />;
}

type UpdateDestination = "profile" | "workspace" | "messages" | "payments" | "admin";
type NotificationRecord = { id: string; type: string; link: string | null; title: string; body: string };
const emptyUpdateCounts: Record<UpdateDestination, number> = { profile: 0, workspace: 0, messages: 0, payments: 0, admin: 0 };
const emptyUpdateDetails: Record<UpdateDestination, NotificationRecord[]> = { profile: [], workspace: [], messages: [], payments: [], admin: [] };

const updateDestination = (notification: NotificationRecord): UpdateDestination => {
  if (notification.link?.startsWith("/admin") || /support_member_reply|admin_/i.test(notification.type)) return "admin";
  if (notification.link?.startsWith("/dashboard/settings") || /verification|profile|account/i.test(notification.type)) return "profile";
  if (notification.link?.startsWith("/dashboard/payments") || /payment|payout/i.test(notification.type)) return "payments";
  if (notification.link?.startsWith("/dashboard/deals") || /match|message|contact_reply|order_update/i.test(notification.type)) return "messages";
  return "workspace";
};
const updateDetailText = (record: NotificationRecord) => `${record.title}: ${record.body}`;

function AccountMenu({ mobile = false }: { mobile?: boolean }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState(emptyUpdateCounts);
  const [updateDetails, setUpdateDetails] = useState(emptyUpdateDetails);
  const shownAdminUpdateIds = useRef<Set<string>>(new Set());
  const popupTimers = useRef<number[]>([]);

  useEffect(() => {
    if (!user) {
      setUpdates(emptyUpdateCounts);
      setUpdateDetails(emptyUpdateDetails);
      shownAdminUpdateIds.current = new Set();
      return;
    }
    const popupKey = `bridgex-shown-admin-updates-${user.id}`;
    try { shownAdminUpdateIds.current = new Set(JSON.parse(window.sessionStorage.getItem(popupKey) || "[]") as string[]); } catch { shownAdminUpdateIds.current = new Set(); }
    let active = true;
    const loadUnreadUpdates = async () => {
      const { data, error } = await supabase.from("notifications").select("id,type,link,title,body").eq("user_id", user.id).is("read_at", null).order("created_at", { ascending: false }).limit(150);
      if (!active || error) return;
      const records = (data ?? []) as NotificationRecord[];
      const next = records.reduce((counts, notification) => { counts[updateDestination(notification)] += 1; return counts; }, { ...emptyUpdateCounts });
      const details = records.reduce((groups, notification) => { groups[updateDestination(notification)].push(notification); return groups; }, { ...emptyUpdateDetails });
      const freshAdminRecords = details.admin.filter(record => !shownAdminUpdateIds.current.has(record.id));
      if (freshAdminRecords.length) {
        freshAdminRecords.forEach(record => shownAdminUpdateIds.current.add(record.id));
        try { window.sessionStorage.setItem(popupKey, JSON.stringify(Array.from(shownAdminUpdateIds.current))); } catch { /* session storage is optional */ }
        freshAdminRecords.forEach((record, index) => {
          const timer = window.setTimeout(() => {
            playBridgeXFeedback("notice");
            toast.info(record.title || "New Control Panel update", { description: <span className="whitespace-pre-line">{updateDetailText(record)}</span>, duration: 5000 });
          }, index * 5400);
          popupTimers.current.push(timer);
        });
      }
      setUpdates(next);
      setUpdateDetails(details);
    };
    void loadUnreadUpdates();
    // Polling avoids Android WebView channel reuse that can throw after subscription.
    const interval = window.setInterval(() => void loadUnreadUpdates(), 30000);
    return () => { active = false; window.clearInterval(interval); popupTimers.current.forEach(timer => window.clearTimeout(timer)); popupTimers.current = []; };
  }, [user?.id]);

  if (loading) return mobile ? <span className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#748083]">Loading account…</span> : <span className="ml-2 text-sm font-semibold text-[#748083]">Loading account…</span>;
  if (!isAuthenticated || !user) return mobile ? <Link href="/access" className="rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-[#ece8dd]">Log in or create account</Link> : <Link href="/access"><Button variant="ghost" size="sm" className="ml-1 font-semibold text-[#354145] hover:bg-[#e9e4d8]">Log in</Button></Link>;

  const initial = displayName(user).charAt(0).toUpperCase();
  const markDestinationRead = async (destination: UpdateDestination) => {
    const { data } = await supabase.from("notifications").select("id,type,link,title,body").eq("user_id", user.id).is("read_at", null).limit(150);
    const ids = ((data ?? []) as NotificationRecord[]).filter(notification => updateDestination(notification) === destination).map(notification => notification.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    setUpdates(current => ({ ...current, [destination]: 0 }));
    setUpdateDetails(current => ({ ...current, [destination]: [] }));
  };
  const go = (path: string, destination?: UpdateDestination) => {
    if (destination && updates[destination] > 0) void markDestinationRead(destination);
    setOpen(false);
    setLocation(path);
  };
  const signOut = async () => { await logout(); setOpen(false); setLocation("/"); };
  const updateBadge = (count: number) => count > 0 ? <span aria-label={`${count} unread update${count === 1 ? "" : "s"}`} className="ml-auto rounded-full bg-[#176447] px-2 py-0.5 text-[11px] text-white">{count}</span> : null;
  const workspaceLink = <button onClick={() => go("/dashboard", "workspace")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-[#f0ede5]"><UserRound className="size-4" />Workspace{updateBadge(updates.workspace)}</button>;
  const editLink = <button onClick={() => go("/dashboard/settings", "profile")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-[#f0ede5]"><Settings className="size-4" />Edit profile{updateBadge(updates.profile)}</button>;
  const messagesLink = <button onClick={() => go("/dashboard/deals", "messages")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-[#f0ede5]"><MessageSquareText className="size-4" />Messages{updateBadge(updates.messages)}</button>;
  const paymentLink = <button onClick={() => go("/dashboard/payments", "payments")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-[#f0ede5]"><CircleDollarSign className="size-4" />Payments{updateBadge(updates.payments)}</button>;
  const adminLink = user.role === "admin" || user.role === "super_admin" ? <button onClick={() => go("/admin", "admin")} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-[#f0ede5] ${user.role === "super_admin" ? "bg-[#fff1ce] text-[#805700] hover:bg-[#ffe7a3]" : ""}`}>{user.role === "super_admin" ? <Crown className="size-4 shrink-0" /> : <ShieldCheck className="size-4" />}<span className="truncate">{user.role === "super_admin" ? "Super Admin control panel" : "Admin control panel"}</span>{updateBadge(updates.admin)}</button> : null;
  const signOutLink = <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[#9b4b3e] hover:bg-[#fdf0ed]"><LogOut className="size-4" />Sign out</button>;
  const memberHead = <button onClick={() => go("/dashboard")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#f0ede5]"><Avatar className="size-8"><AvatarImage src={user.avatarUrl} alt="Profile photo" /><AvatarFallback className="bg-[#dff5ea] text-xs font-bold text-[#176447]">{initial}</AvatarFallback></Avatar><span className="min-w-0"><span className="flex items-center gap-1 truncate text-sm font-bold">{displayName(user)}</span><span className="mt-1 block truncate text-xs text-[#687579]">{user.verificationStatus === "approved" ? <VerifiedBadge /> : user.email}</span></span></button>;

  if (mobile) return <div className="mt-2 rounded-xl bg-white p-2">{memberHead}{editLink}{workspaceLink}{messagesLink}{paymentLink}{adminLink}{signOutLink}</div>;
  return <div className="relative"><button aria-expanded={open} onClick={() => setOpen(value => !value)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#e9e4d8]"><Avatar className="size-8 border border-[#dce6df]"><AvatarImage src={user.avatarUrl} alt="Profile photo" /><AvatarFallback className="bg-[#dff5ea] text-xs font-bold text-[#176447]">{initial}</AvatarFallback></Avatar><span className="max-w-28 truncate text-sm font-bold text-[#354145]">{displayName(user)}</span></button>{open && <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-2xl border border-[#172126]/10 bg-white p-2 shadow-xl">{memberHead}<div className="my-1 border-t border-[#172126]/8" />{editLink}{workspaceLink}{messagesLink}{paymentLink}{adminLink}{signOutLink}</div>}</div>;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const navigation = [{ label: t("marketplace"), href: "/marketplace" }, { label: t("howItWorks"), href: "/how-it-works" }, { label: t("safety"), href: "/safety" }, { label: t("contact"), href: "/contact" }];
  const languageControl = <select aria-label={t("language")} value={language} onChange={event => setLanguage(event.target.value as SystemLanguage)} className="h-9 max-w-32 rounded-lg border border-[#172126]/12 bg-white px-2 text-xs font-bold text-[#354145]"><option value={language}>{LANGUAGE_OPTIONS.find(option => option.code === language)?.nativeLabel}</option>{LANGUAGE_OPTIONS.filter(option => option.code !== language).map(option => <option key={option.code} value={option.code}>{option.nativeLabel}</option>)}</select>;
  return <div className="bridgex-app-shell min-h-screen overflow-x-clip bg-[#f7f5ef]/95 text-[#172126]"><NativePushBridge /><header className="sticky top-0 z-50 border-b border-[#172126]/7 bg-[#f7f5ef]/90 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-[1344px] items-center justify-between px-5 lg:px-8"><Link href="/"><Brand /></Link><nav className="hidden items-center gap-7 lg:flex">{navigation.map(item => <Link key={item.href} href={item.href} className="text-sm font-semibold text-[#546063] transition-colors hover:text-[#172126]">{item.label}</Link>)}</nav><div className="hidden items-center gap-2 lg:flex">{languageControl}<Link href="/create-listing"><Button variant="ghost" className="font-semibold text-[#354145] hover:bg-[#e9e4d8]"><Plane className="mr-1.5 size-4" />{t("listSpace")}</Button></Link><Link href="/create-request"><Button className="rounded-xl bg-[#172126] px-5 font-bold text-[#f7f5ef] shadow-none hover:bg-[#2a383e]"><Plus className="mr-1 size-4" />{t("postItem")}</Button></Link><AccountMenu /></div><button aria-label="Open navigation" onClick={() => setMenuOpen(value => !value)} className="grid size-10 place-items-center rounded-xl bg-[#ece8dd] lg:hidden"><Menu className="size-5" /></button></div>{menuOpen && <div className="bridgex-glass-panel border-t border-[#172126]/7 px-5 py-4 lg:hidden"><div className="mx-auto grid max-w-[1344px] gap-1"><div className="mb-2">{languageControl}</div><Link href="/create-request" onClick={() => setMenuOpen(false)}><Button className="mb-2 w-full rounded-xl bg-[#172126] font-bold"><Plus className="mr-2 size-4" />{t("postItem")}</Button></Link><Link href="/create-listing" onClick={() => setMenuOpen(false)}><Button variant="outline" className="mb-2 w-full rounded-xl bg-white font-bold"><Plane className="mr-2 size-4" />{t("listSpace")}</Button></Link>{navigation.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-[#ece8dd]">{item.label}</Link>)}<AccountMenu mobile /></div></div>}</header>{children}<footer className="border-t border-[#172126]/8 bg-[#172126] text-[#f7f5ef]"><div className="mx-auto grid max-w-[1344px] gap-10 px-5 py-12 lg:grid-cols-[1.15fr_2fr] lg:px-8"><div><Brand className="text-[#f7f5ef] [&>span:last-child]:text-[#f7f5ef]" /><p className="mt-4 max-w-sm text-sm leading-6 text-[#d6ddd7]">A global marketplace for people carrying goods, matching senders with verified travelers and protected order workflows.</p><div className="bridgex-glass-dark mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[#e2eee7]"><ShieldCheck className="size-4 text-[#79d8a8]" />Protected service status</div></div><div className="grid grid-cols-2 gap-8 sm:grid-cols-3"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8fa39a]">Explore</p><div className="grid gap-2.5 text-sm text-[#d6ddd7]"><Link href="/marketplace">{t("marketplace")}</Link><Link href="/how-it-works">{t("howItWorks")}</Link><Link href="/safety">{t("safety")}</Link><Link href="/contact">{t("contact")}</Link></div></div><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8fa39a]">{t("downloads")}</p><div className="grid gap-2.5 text-sm text-[#d6ddd7]"><a data-bridgex-android-download href={ANDROID_DOWNLOAD_URL} target="_blank" rel="noreferrer">{t("downloadAndroid")}</a><a href="https://github.com/abdullahbinfahad/BridgeX/releases/download/windows-v1.0.0/BridgeX-Windows-x64.zip" target="_blank" rel="noreferrer">{t("downloadWindows")}</a><a className="text-[#aebcb5] hover:text-white" href="https://github.com/abdullahbinfahad/BridgeX/releases/download/v1.0.0-platforms/BridgeX-HarmonyOS-1.0.0-source.zip" target="_blank" rel="noreferrer">{t("harmonyOS")}</a><a className="text-[#aebcb5] hover:text-white" href="https://github.com/abdullahbinfahad/BridgeX/releases/tag/v1.0.0-platforms" target="_blank" rel="noreferrer">{t("macOS")}</a></div></div><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8fa39a]">{t("legal")}</p><div className="grid gap-2.5 text-sm text-[#d6ddd7]"><Link href="/terms">{t("terms")}</Link><Link href="/privacy">{t("privacy")}</Link><Link href="/dashboard">{t("myAccount")}</Link></div></div></div></div></footer></div>;
}
