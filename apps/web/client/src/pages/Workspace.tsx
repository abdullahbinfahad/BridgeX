import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImageForUpload } from "@/lib/fileUpload";
import { supabase } from "@/lib/supabase";
import GlobalVerification from "@/pages/GlobalVerification";
import { Banknote, CheckCircle2, ChevronRight, FileUp, MapPin, PackageCheck, Plane, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type MemberRequest = { id: string; title: string; status: string; purchase_country: string; destination_country: string | null; destination_city: string; created_at: string };
type MemberListing = { id: string; origin_country: string; origin_city: string; destination_country: string | null; destination_city: string; status: string; departure_at: string; available_weight_kg: number };
type MemberOrder = { id: string; reference: string; sender_id: string; traveler_id: string; amount_bdt: number; escrow_status: string; fulfillment_status: string; updated_at: string };
type MemberData = { requests: MemberRequest[]; listings: MemberListing[]; orders: MemberOrder[]; loading: boolean; error: string };

const emptyMemberData: MemberData = { requests: [], listings: [], orders: [], loading: true, error: "" };
const userName = (user: ReturnType<typeof useAuth>["user"]) => user?.name || user?.email?.split("@")[0] || "Member";
const formatMoney = (amount: number) => `৳ ${Number(amount ?? 0).toLocaleString()}`;
const statusLabel = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function useMemberData(userId?: string): MemberData {
  const [data, setData] = useState<MemberData>(emptyMemberData);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setData(previous => ({ ...previous, loading: true, error: "" }));
    void (async () => {
      const [requests, listings, orders] = await Promise.all([
        supabase.from("send_requests").select("id,title,status,purchase_country,destination_country,destination_city,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
        supabase.from("carry_listings").select("id,origin_country,origin_city,destination_country,destination_city,status,departure_at,available_weight_kg").eq("user_id", userId).order("departure_at", { ascending: true }).limit(50),
        supabase.from("orders").select("id,reference,sender_id,traveler_id,amount_bdt,escrow_status,fulfillment_status,updated_at").or(`sender_id.eq.${userId},traveler_id.eq.${userId}`).order("updated_at", { ascending: false }).limit(50),
      ]);
      if (!alive) return;
      const error = requests.error?.message || listings.error?.message || orders.error?.message || "";
      setData({ requests: (requests.data ?? []) as MemberRequest[], listings: (listings.data ?? []) as MemberListing[], orders: (orders.data ?? []) as MemberOrder[], loading: false, error });
    })();
    return () => { alive = false; };
  }, [userId]);

  return data;
}

function Stat({ label, value, caption, icon: Icon }: { label: string; value: string; caption: string; icon: React.ElementType }) {
  return <div className="rounded-3xl border border-[#172126]/8 bg-white p-5"><div className="flex items-start justify-between"><p className="text-sm font-bold text-[#637073]">{label}</p><span className="grid size-9 place-items-center rounded-xl bg-[#e7f4ea] text-[#176447]"><Icon className="size-4" /></span></div><p className="mt-5 font-display text-3xl font-bold tracking-[-0.05em]">{value}</p><p className="mt-1 text-xs text-[#738083]">{caption}</p></div>;
}

function Overview({ data }: { data: MemberData }) {
  const { user } = useAuth();
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const activeOrders = data.orders.filter(order => !["released", "cancelled", "refunded"].includes(order.fulfillment_status) && !["released", "refunded"].includes(order.escrow_status));
  const nextListing = data.listings.find(item => new Date(item.departure_at).getTime() >= Date.now());
  const latestOrder = data.orders[0];

  return <><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Member workspace</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">{greeting}, {userName(user)}.</h1><p className="mt-2 text-sm leading-6 text-[#637073]">This workspace shows activity linked to your BridgeX account only.</p></div><div className="flex gap-2"><Link href="/create-request"><Button className="rounded-xl bg-[#172126] font-bold"><PackageCheck className="mr-2 size-4" />Post a request</Button></Link><Link href="/create-listing"><Button variant="outline" className="rounded-xl bg-white font-bold"><Plane className="mr-2 size-4" />List space</Button></Link></div></div>{data.error && <p className="mt-5 rounded-xl bg-[#f8e8e5] px-3 py-2 text-sm font-semibold text-[#9b4b3e]">{data.error}</p>}<div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Active orders" value={data.loading ? "—" : String(activeOrders.length)} caption={activeOrders.length ? "Protected order in progress" : "No active protected orders"} icon={PackageCheck} /><Stat label="My requests" value={data.loading ? "—" : String(data.requests.length)} caption={data.requests.length ? `${data.requests.filter(item => item.status === "open").length} currently open` : "No requests posted yet"} icon={PackageCheck} /><Stat label="Carry listings" value={data.loading ? "—" : String(data.listings.length)} caption={nextListing ? `Next: ${new Date(nextListing.departure_at).toLocaleDateString()}` : "No upcoming carry listing"} icon={Plane} /><Stat label="Escrow activity" value={data.loading ? "—" : String(data.orders.length)} caption={data.orders.length ? "From your protected orders" : "No order activity yet"} icon={WalletCards} /></div><div className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">{latestOrder ? <LiveOrderSummary order={latestOrder} /> : <EmptyOrderSummary />}<div className="rounded-3xl bg-[#172126] p-6 text-[#f7f5ef]"><ShieldCheck className="size-5 text-[#91e7bc]" /><h2 className="mt-6 font-display text-2xl font-bold tracking-[-0.04em]">Verification improves trust without pausing your account.</h2><p className="mt-3 text-sm leading-6 text-[#c3d0c9]">Complete the required identity documents when ready. Your account stays active while an administrator reviews the submission.</p><Link href="/dashboard/verification"><Button className="mt-6 rounded-xl bg-[#91e7bc] font-bold text-[#172126] hover:bg-[#b7efcc]">Open verification <ChevronRight className="ml-1 size-4" /></Button></Link></div></div></>;
}

function OrderMilestones({ order }: { order: MemberOrder }) {
  const { user } = useAuth();
  const isTraveler = order.traveler_id === user?.id;
  const stages = isTraveler ? ["Offer", "Matched", "China pickup", "Received", "Transit", "Delivered", "Released"] : ["Offer", "Matched", "China send", "Traveler received", "Transit", "Delivered", "Released"];
  const fulfillment = order.fulfillment_status.toLowerCase();
  const escrow = order.escrow_status.toLowerCase();
  const progress = escrow === "released" ? 6 : fulfillment === "delivered" || fulfillment === "completed" ? 5 : fulfillment === "in_transit" ? 4 : ["received", "handoff"].includes(fulfillment) ? 3 : ["china_pickup", "purchased"].includes(fulfillment) ? 2 : ["funded", "held"].includes(escrow) ? 1 : 0;
  return <div className="mt-6"><p className="text-xs font-bold text-[#536263]">{isTraveler ? "Traveler view" : "Sender view"}</p><div className="mt-3 grid grid-cols-7 gap-1">{stages.map((stage, index) => <div key={stage} className="min-w-0"><span className={`grid size-6 place-items-center rounded-full text-[10px] font-bold ${index <= progress ? "bg-[#2d8d62] text-white" : "bg-[#eceae3] text-[#788481]"}`}>{index <= progress ? <CheckCircle2 className="size-3.5" /> : index + 1}</span><p className="mt-1.5 text-[10px] font-bold leading-3 text-[#667477]">{stage}</p></div>)}</div></div>;
}

function LiveOrderSummary({ order }: { order: MemberOrder }) {
  return <div className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d8d62]">Active order · {order.reference}</p><h2 className="mt-2 text-lg font-bold">Protected order</h2><p className="mt-1 text-sm text-[#637073]">Last updated {new Date(order.updated_at).toLocaleString()}</p></div><Badge className="rounded-full bg-[#dff5ea] text-[#176447] hover:bg-[#dff5ea]">{statusLabel(order.escrow_status)}</Badge></div><OrderMilestones order={order} /><div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f4f2eb] p-4"><div><p className="text-xs font-bold text-[#536263]">Protected amount</p><p className="mt-1 text-lg font-bold">{formatMoney(order.amount_bdt)}</p><p className="mt-1 text-xs text-[#637073]">Fulfillment: {statusLabel(order.fulfillment_status)}</p></div><Link href="/dashboard/orders"><Button className="rounded-lg bg-[#172126] font-bold">View order <ChevronRight className="ml-1.5 size-4" /></Button></Link></div></div>;
}

function EmptyOrderSummary() {
  return <div className="rounded-3xl border border-dashed border-[#172126]/18 bg-white p-8"><Banknote className="size-7 text-[#2d8d62]" /><h2 className="mt-5 text-lg font-bold">No protected orders yet.</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#637073]">When a sender and traveler confirm a match, the protected order and its escrow status will appear here.</p><Link href="/marketplace"><Button variant="outline" className="mt-6 rounded-xl bg-white font-bold">Browse marketplace</Button></Link></div>;
}

function MyRequests({ data }: { data: MemberData }) {
  return <ListPage title="My item requests" copy="These are requests posted from your BridgeX account." action="Post a request" href="/create-request">{data.requests.length ? data.requests.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#172126]/8 bg-white p-4"><div><p className="font-bold">{item.title}</p><p className="mt-1 text-sm text-[#667477]">{item.purchase_country} → {item.destination_country ?? "Destination pending"} · {item.destination_city}</p></div><Badge className="bg-[#e7f4ea] text-[#176447] hover:bg-[#e7f4ea]">{statusLabel(item.status)}</Badge></article>) : <EmptyContent copy="You have not posted an item request yet." href="/create-request" label="Post your first request" />}</ListPage>;
}

function MyListings({ data }: { data: MemberData }) {
  return <ListPage title="My carry space" copy="These listings show routes and capacity published from your BridgeX account." action="List space" href="/create-listing">{data.listings.length ? data.listings.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#172126]/8 bg-white p-4"><div><p className="font-bold">{item.origin_city}, {item.origin_country} → {item.destination_city}, {item.destination_country ?? "Destination pending"}</p><p className="mt-1 text-sm text-[#667477]">{item.available_weight_kg} kg · Departure {new Date(item.departure_at).toLocaleDateString()}</p></div><Badge className="bg-[#e7f4ea] text-[#176447] hover:bg-[#e7f4ea]">{statusLabel(item.status)}</Badge></article>) : <EmptyContent copy="You have not listed carry space yet." href="/create-listing" label="List carry space" />}</ListPage>;
}

function Orders({ data }: { data: MemberData }) {
  return <ListPage title="Protected orders" copy="Only orders where you are the sender or traveler appear here." action="Explore marketplace" href="/marketplace">{data.orders.length ? data.orders.map(order => <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#172126]/8 bg-white p-4"><div><p className="font-bold">{order.reference}</p><p className="mt-1 text-sm text-[#667477]">{formatMoney(order.amount_bdt)} · {statusLabel(order.fulfillment_status)} · Updated {new Date(order.updated_at).toLocaleDateString()}</p></div><Badge className="bg-[#e7f4ea] text-[#176447] hover:bg-[#e7f4ea]">{statusLabel(order.escrow_status)}</Badge></article>) : <EmptyContent copy="No protected order is connected to your account yet." href="/marketplace" label="Explore marketplace" />}</ListPage>;
}

function Wallet({ data }: { data: MemberData }) {
  const totalHeld = data.orders.filter(order => !["released", "refunded"].includes(order.escrow_status)).reduce((total, order) => total + Number(order.amount_bdt || 0), 0);
  return <><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Escrow activity</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">Order-linked funds only.</h1><p className="mt-2 text-sm text-[#637073]">BridgeX displays protected order status; it does not invent wallet balances.</p></div><div className="mt-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-3xl bg-[#172126] p-7 text-[#f7f5ef]"><WalletCards className="size-7 text-[#91e7bc]" /><p className="mt-10 text-sm font-bold text-[#c3d0c9]">In active escrow</p><p className="mt-1 font-display text-5xl font-bold tracking-[-0.06em]">{formatMoney(totalHeld)}</p><p className="mt-5 text-xs leading-5 text-[#b9cac1]">This total is calculated from your existing protected orders and is not a withdrawable account balance.</p></div><div className="rounded-3xl border border-[#172126]/8 bg-white p-6"><h2 className="font-bold">Your order activity</h2><div className="mt-5 grid gap-3">{data.orders.length ? data.orders.map(order => <div key={order.id} className="flex items-center justify-between rounded-xl bg-[#f6f4ee] p-4"><div><p className="text-sm font-bold">{order.reference}</p><p className="mt-1 text-xs text-[#6d797c]">{statusLabel(order.escrow_status)} · {statusLabel(order.fulfillment_status)}</p></div><strong>{formatMoney(order.amount_bdt)}</strong></div>) : <p className="rounded-xl bg-[#f6f4ee] p-4 text-sm text-[#667477]">No order activity yet.</p>}</div></div></div></>;
}

function Offers({ data }: { data: MemberData }) {
  return <ListPage title="Offers and matches" copy="Traveler offers are connected to your requests. There are no sample offers in this workspace." action="View my requests" href="/dashboard/requests"><EmptyContent copy={data.requests.length ? "Open a request from your dashboard after a traveler makes an offer." : "Post a request to begin receiving traveler offers."} href={data.requests.length ? "/dashboard/requests" : "/create-request"} label={data.requests.length ? "View my requests" : "Post a request"} /></ListPage>;
}

function Reviews() { return <ListPage title="Reviews" copy="Reviews are available after a completed protected order." action="View orders" href="/dashboard/orders"><EmptyContent copy="No post-order reviews are available for this account yet." href="/dashboard/orders" label="View orders" /></ListPage>; }

function ListPage({ title, copy, action, href, children }: { title: string; copy: string; action: string; href: string; children: React.ReactNode }) {
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Workspace</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">{title}</h1><p className="mt-2 text-sm text-[#637073]">{copy}</p></div><Link href={href}><Button className="rounded-xl bg-[#172126] font-bold">{action}</Button></Link></div><div className="mt-7 grid gap-3">{children}</div></>;
}

function EmptyContent({ copy, href, label }: { copy: string; href: string; label: string }) {
  return <div className="rounded-3xl border border-dashed border-[#172126]/18 bg-white p-10 text-center"><PackageCheck className="mx-auto size-8 text-[#2d8d62]" /><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#637073]">{copy}</p><Link href={href}><Button variant="outline" className="mt-5 rounded-xl bg-white font-bold">{label}</Button></Link></div>;
}

function SettingsView() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "", currentCountry: "", currentCity: "", currentAddress: "", homeCountry: "", homeCity: "", chinaAddress: "" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ fullName: user.name ?? "", phone: user.profile?.phone ?? "", bio: user.profile?.bio ?? "", currentCountry: user.profile?.current_country ?? "", currentCity: user.profile?.current_city ?? "", currentAddress: user.profile?.current_address ?? "", homeCountry: user.profile?.home_country ?? "", homeCity: user.profile?.home_city ?? "", chinaAddress: user.profile?.china_address ?? "" });
  }, [user]);

  const avatarUrl = avatar ? URL.createObjectURL(avatar) : user?.avatarUrl;
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const save = async () => {
    if (!user) return;
    if (!form.fullName.trim() || !form.currentCountry.trim() || !form.currentCity.trim() || !form.currentAddress.trim() || !form.homeCountry.trim() || !form.homeCity.trim()) return setMessage("Complete your name, exact current location, and home location before saving.");
    if (form.currentCountry.trim().toLowerCase() === "china" && !form.chinaAddress.trim()) return setMessage("Add your exact China address when your current country is China.");
    setSaving(true); setMessage("");
    let avatarPath: string | null | undefined;
    if (avatar) {
      const compressed = await compressImageForUpload(avatar);
      if (compressed.size > 2 * 1024 * 1024) { setSaving(false); return setMessage("Profile image is still larger than 2 MB after compression."); }
      const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, compressed, { contentType: compressed.type, upsert: false });
      if (uploadError) { setSaving(false); return setMessage(uploadError.message); }
      avatarPath = path;
    }
    const { error } = await supabase.from("users").update({ full_name: form.fullName.trim(), phone: form.phone.trim() || null, bio: form.bio.trim() || null, current_country: form.currentCountry.trim(), current_city: form.currentCity.trim(), current_address: form.currentAddress.trim(), home_country: form.homeCountry.trim(), home_city: form.homeCity.trim(), china_address: form.chinaAddress.trim() || null, ...(avatarPath ? { avatar_path: avatarPath } : {}) }).eq("id", user.id);
    setSaving(false);
    if (error) return setMessage(error.message);
    await refresh();
    setAvatar(null);
    setMessage("Profile details saved.");
  };

  return <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Account settings</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">Edit your profile.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#637073]">Keep your exact current and home details accurate. They support safer matching, verification, and incident handling.</p><div className="mt-7 max-w-3xl rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex flex-wrap items-center gap-4 border-b border-[#172126]/8 pb-6"><Avatar className="size-16 border border-[#dce6df]"><AvatarImage src={avatarUrl} alt="Profile avatar" /><AvatarFallback className="bg-[#dff5ea] text-lg font-bold text-[#176447]">{userName(user).charAt(0).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-bold">Profile photo</p><p className="mt-1 text-xs text-[#687579]">JPG, PNG, or WEBP; images are compressed before upload.</p><label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-[#172126]/12 bg-white px-3 py-2 text-xs font-bold"><FileUp className="mr-1.5 size-3.5" />Choose photo<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setAvatar(event.target.files?.[0] ?? null)} /></label></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><Label>Display name</Label><Input value={form.fullName} onChange={event => update("fullName", event.target.value)} className="mt-2 h-11 rounded-xl" /></div><div><Label>Phone number (optional)</Label><Input value={form.phone} onChange={event => update("phone", event.target.value)} className="mt-2 h-11 rounded-xl" /></div><div className="sm:col-span-2"><Label>Short profile bio (optional)</Label><Textarea value={form.bio} onChange={event => update("bio", event.target.value)} className="mt-2 min-h-24 rounded-xl" /></div></div><h2 className="mt-8 border-t border-[#172126]/8 pt-6 font-bold">Current exact location</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label>Current country</Label><Input value={form.currentCountry} onChange={event => update("currentCountry", event.target.value)} className="mt-2 h-11 rounded-xl" /></div><div><Label>Current city</Label><Input value={form.currentCity} onChange={event => update("currentCity", event.target.value)} className="mt-2 h-11 rounded-xl" /></div><div className="sm:col-span-2"><Label>Current address</Label><Input value={form.currentAddress} onChange={event => update("currentAddress", event.target.value)} className="mt-2 h-11 rounded-xl" /></div><div className="sm:col-span-2"><Label>Exact China address (required when current country is China)</Label><Input value={form.chinaAddress} onChange={event => update("chinaAddress", event.target.value)} className="mt-2 h-11 rounded-xl" /></div></div><h2 className="mt-8 border-t border-[#172126]/8 pt-6 font-bold">Home location</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label>Home country</Label><Input value={form.homeCountry} onChange={event => update("homeCountry", event.target.value)} className="mt-2 h-11 rounded-xl" /></div><div><Label>Home city</Label><Input value={form.homeCity} onChange={event => update("homeCity", event.target.value)} className="mt-2 h-11 rounded-xl" /></div></div><Button onClick={save} disabled={saving} className="mt-7 rounded-xl bg-[#172126] font-bold">{saving ? "Saving profile…" : "Save profile"}</Button>{message && <p className={`mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${message === "Profile details saved." ? "bg-[#dff5ea] text-[#176447]" : "bg-[#f8e8e5] text-[#9b4b3e]"}`}>{message}</p>}</div></div>;
}

export default function Workspace() {
  const { user } = useAuth();
  const [location] = useLocation();
  const section = location.split("/")[2] ?? "overview";
  const data = useMemberData(user?.id);
  const content = section === "verification" ? <GlobalVerification /> : section === "wallet" ? <Wallet data={data} /> : section === "orders" ? <Orders data={data} /> : section === "offers" ? <Offers data={data} /> : section === "settings" ? <SettingsView /> : section === "requests" ? <MyRequests data={data} /> : section === "listings" ? <MyListings data={data} /> : section === "reviews" ? <Reviews /> : <Overview data={data} />;
  return <DashboardLayout>{content}</DashboardLayout>;
}
