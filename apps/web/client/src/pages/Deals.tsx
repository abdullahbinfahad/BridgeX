import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Bell, ImagePlus, MapPin, MessageCircle, Mic, Phone, Send, ShieldCheck, Truck, UserRoundPen } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { compressImageForUpload } from "@/lib/fileUpload";

type Deal = { id: string; match_type: string; sender_id: string; traveler_id: string; status: string; sender_name: string | null; traveler_name: string | null; sender_phone: string; sender_delivery_address: string; traveler_phone: string; traveler_pickup_address: string; sender_last_read_at: string | null; traveler_last_read_at: string | null; last_message_body: string | null; last_message_at: string | null; last_message_sender_id: string | null; accepted_at: string };
type DealMessage = { id: string; match_id: string; sender_id: string; body: string; created_at: string };
type DealOrder = { id: string; match_id: string | null; reference: string; sender_id: string; traveler_id: string; fulfillment_status: string; escrow_status: string; updated_at: string };
type SystemNotification = { id: string; type: string; title: string; body: string; link: string | null; related_id: string | null; created_at: string; read_at: string | null };
type SupportMessage = { id: string; enquiry_id: string; sender_id: string; body: string; created_at: string };

const statusLabel = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
const displayTime = (value: string | null) => { if (!value) return ""; const date = new Date(value); return date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : date.toLocaleDateString([], { month: "short", day: "numeric" }); };
const isSupportUpdate = (update: SystemNotification) => update.type === "contact_reply" || update.title === "BridgeX Admin";

export default function Deals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orders, setOrders] = useState<DealOrder[]>([]);
  const [systemUpdates, setSystemUpdates] = useState<SystemNotification[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [supportDraft, setSupportDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [routeKey, setRouteKey] = useState(() => window.location.search);
  const [listening, setListening] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const params = useMemo(() => new URLSearchParams(routeKey), [routeKey]);
  const selectedId = params.get("match") || "";
  const selectedSupportId = params.get("support") || "";
  const selected = useMemo(() => deals.find(deal => deal.id === selectedId), [deals, selectedId]);
  const selectedSupport = useMemo(() => systemUpdates.find(update => isSupportUpdate(update) && (update.id === selectedSupportId || update.related_id === selectedSupportId)), [systemUpdates, selectedSupportId]);
  const selectedSupportEnquiryId = selectedSupport?.related_id || selectedSupport?.id || "";
  const isDetail = Boolean(selected);
  const isTraveler = selected?.traveler_id === user?.id;
  const order = selected ? orders.find(item => item.match_id === selected.id) : undefined;
  const counterpart = (deal: Deal) => deal.sender_id === user?.id ? deal.traveler_name || "Traveler" : deal.sender_name || "Sender";
  const counterpartId = (deal: Deal) => deal.sender_id === user?.id ? deal.traveler_id : deal.sender_id;
  const unread = (deal: Deal) => { const lastRead = deal.sender_id === user?.id ? deal.sender_last_read_at : deal.traveler_last_read_at; return Boolean(deal.last_message_at && deal.last_message_sender_id && deal.last_message_sender_id !== user?.id && (!lastRead || new Date(deal.last_message_at).getTime() > new Date(lastRead).getTime())); };
  const openDeal = (matchId: string) => { const next = `/dashboard/deals?match=${encodeURIComponent(matchId)}`; window.history.pushState({}, "", next); setRouteKey(window.location.search); };
  const openInbox = () => { window.history.pushState({}, "", "/dashboard/deals"); setRouteKey(""); };
  const openSupport = (update: SystemNotification) => { window.history.pushState({}, "", `/dashboard/deals?support=${encodeURIComponent(update.related_id || update.id)}`); setRouteKey(window.location.search); };
  useEffect(() => { const onPopState = () => setRouteKey(window.location.search); window.addEventListener("popstate", onPopState); return () => window.removeEventListener("popstate", onPopState); }, []);

  const load = async () => {
    if (!user) return;
    setNotice("");
    const [matchResult, orderResult, notificationResult] = await Promise.all([
      supabase.from("matches").select("id,match_type,sender_id,traveler_id,status,sender_name,traveler_name,sender_phone,sender_delivery_address,traveler_phone,traveler_pickup_address,sender_last_read_at,traveler_last_read_at,last_message_body,last_message_at,last_message_sender_id,accepted_at").or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`).order("last_message_at", { ascending: false, nullsFirst: false }).order("accepted_at", { ascending: false }).limit(250),
      supabase.from("orders").select("id,match_id,reference,sender_id,traveler_id,fulfillment_status,escrow_status,updated_at").or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`).order("updated_at", { ascending: false }).limit(500),
      supabase.from("notifications").select("id,type,title,body,link,related_id,created_at,read_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(150),
    ]);
    const error = matchResult.error?.message || orderResult.error?.message || notificationResult.error?.message;
    if (error) setNotice(error);
    setDeals((matchResult.data ?? []) as Deal[]);
    setOrders((orderResult.data ?? []) as DealOrder[]);
    setSystemUpdates((notificationResult.data ?? []) as SystemNotification[]);
    setLoading(false);
  };

  const loadMessages = async (matchId: string) => {
    const { data, error } = await supabase.from("match_messages").select("id,match_id,sender_id,body,created_at").eq("match_id", matchId).order("created_at", { ascending: true }).limit(300);
    if (error) return setNotice(error.message);
    setMessages((data ?? []) as DealMessage[]);
    void supabase.rpc("mark_bridgex_match_read", { p_match_id: matchId });
    setDeals(current => current.map(deal => deal.id !== matchId ? deal : deal.sender_id === user?.id ? { ...deal, sender_last_read_at: new Date().toISOString() } : { ...deal, traveler_last_read_at: new Date().toISOString() }));
  };
  const loadSupportMessages = async (enquiryId: string) => { const { data, error } = await supabase.from("contact_enquiry_messages").select("id,enquiry_id,sender_id,body,created_at").eq("enquiry_id", enquiryId).order("created_at", { ascending: true }).limit(200); if (error) setNotice(error.message); else setSupportMessages((data ?? []) as SupportMessage[]); };

  useEffect(() => { void load(); }, [user?.id]);
  useEffect(() => { if (!selected?.id) { setMessages([]); return; } void loadMessages(selected.id); const channel = supabase.channel(`protected-deal-${selected.id}`).on("postgres_changes", { event: "*", schema: "public", table: "match_messages", filter: `match_id=eq.${selected.id}` }, () => void loadMessages(selected.id)).subscribe(); const poll = window.setInterval(() => void loadMessages(selected.id), 20000); return () => { window.clearInterval(poll); void supabase.removeChannel(channel); }; }, [selected?.id]);
  useEffect(() => { if (!selectedSupport || selectedSupport.read_at) return; const readAt = new Date().toISOString(); void supabase.from("notifications").update({ read_at: readAt }).eq("id", selectedSupport.id).then(() => setSystemUpdates(current => current.map(update => update.id === selectedSupport.id ? { ...update, read_at: readAt } : update))); }, [selectedSupport?.id]);
  useEffect(() => { if (!selectedSupportEnquiryId) { setSupportMessages([]); return; } void loadSupportMessages(selectedSupportEnquiryId); const channel = supabase.channel(`member-support-${selectedSupportEnquiryId}`).on("postgres_changes", { event: "*", schema: "public", table: "contact_enquiry_messages", filter: `enquiry_id=eq.${selectedSupportEnquiryId}` }, () => void loadSupportMessages(selectedSupportEnquiryId)).subscribe(); const poll = window.setInterval(() => void loadSupportMessages(selectedSupportEnquiryId), 20000); return () => { window.clearInterval(poll); void supabase.removeChannel(channel); }; }, [selectedSupportEnquiryId]);

  const send = async () => {
    if (!user || !selected || !draft.trim()) return;
    const body = draft.trim();
    const optimistic: DealMessage = { id: `optimistic-${Date.now()}`, match_id: selected.id, sender_id: user.id, body, created_at: new Date().toISOString() };
    setMessages(current => [...current, optimistic]);
    setDraft("");
    setBusy(true);
    const { error } = await supabase.rpc("send_bridgex_match_message", { p_match_id: selected.id, p_body: body });
    setBusy(false);
    if (error) { setMessages(current => current.filter(message => message.id !== optimistic.id)); return setNotice(error.message); }
    // The realtime subscription replaces the optimistic row; no page or inbox reload occurs.
  };
  const sendPhoto = async (file: File) => {
    if (!user || !selected) return;
    setBusy(true);
    try {
      const compressed = await compressImageForUpload(file);
      const path = `chat/${selected.id}/${user.id}/${crypto.randomUUID()}.jpg`;
      const upload = await supabase.storage.from("request-media").upload(path, compressed, { contentType: compressed.type, upsert: false });
      if (upload.error) throw upload.error;
      const signed = await supabase.storage.from("request-media").createSignedUrl(path, 60 * 60);
      if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error("The photo could not be prepared.");
      const body = `📷 Photo attachment\n${signed.data.signedUrl}`;
      const { error } = await supabase.rpc("send_bridgex_match_message", { p_match_id: selected.id, p_body: body });
      if (error) throw error;
    } catch (error) { setNotice(error instanceof Error ? error.message : "The photo could not be sent."); }
    finally { setBusy(false); }
  };
  const startVoiceText = () => {
    const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: ((event: any) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) return setNotice("Voice typing is not supported by this browser. You can still type and press Enter to send.");
    const recognition = new SpeechRecognition();
    recognition.lang = document.documentElement.lang || navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => setDraft(current => `${current}${current ? " " : ""}${event.results[0][0].transcript}`);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };
  const updateMyContact = async () => { if (!selected) return; const phone = window.prompt("Your phone number for this protected deal", isTraveler ? selected.traveler_phone : selected.sender_phone); if (phone === null) return; const address = window.prompt("Your exact delivery or pickup address for this protected deal", isTraveler ? selected.traveler_pickup_address : selected.sender_delivery_address); if (address === null) return; setBusy(true); const { error } = await supabase.rpc("update_bridgex_match_contact", { p_match_id: selected.id, p_phone: phone, p_address: address }); setBusy(false); if (error) return setNotice(error.message); setNotice("Protected contact details updated and your counterpart was notified."); await load(); };
  const updateTravelerOrder = async (status: string) => { if (!order) return; setBusy(true); const { error } = await supabase.rpc("update_bridgex_traveler_order", { p_order_id: order.id, p_fulfillment_status: status }); setBusy(false); if (error) return setNotice(error.message); setNotice(`Order updated to ${statusLabel(status)}. The sender was notified.`); await load(); };
  const openSystemUpdate = async (update: SystemNotification) => { if (!update.read_at) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", update.id); window.location.assign(update.link || "/notifications"); };
  const sendSupport = async () => { if (!selectedSupportEnquiryId || !supportDraft.trim()) return; setBusy(true); const body = supportDraft.trim(); setSupportDraft(""); const optimistic: SupportMessage = { id: `optimistic-${Date.now()}`, enquiry_id: selectedSupportEnquiryId, sender_id: user?.id || "member", body, created_at: new Date().toISOString() }; setSupportMessages(current => [...current, optimistic]); const { error } = await supabase.rpc("send_bridgex_support_message", { p_enquiry_id: selectedSupportEnquiryId, p_body: body }); setBusy(false); if (error) { setSupportMessages(current => current.filter(message => message.id !== optimistic.id)); return setNotice(error.message); } };

  if (loading) return <p className="rounded-2xl bg-white p-6 text-sm font-semibold text-[#647174]">Loading messages…</p>;

  if (selectedSupport) { const visibleSupportMessages = supportMessages.length ? supportMessages : [{ id: selectedSupport.id, enquiry_id: selectedSupportEnquiryId, sender_id: "admin", body: selectedSupport.body, created_at: selectedSupport.created_at }]; const memberName = user?.name || user?.email?.split("@")[0] || "Member"; return <div><Button onClick={openInbox} variant="outline" className="rounded-xl bg-white"><ArrowLeft className="mr-2 size-4" />Back to Inbox</Button>{notice && <p className="mt-5 rounded-xl bg-[#f8e8e5] px-3 py-2 text-sm font-semibold text-[#9b4b3e]">{notice}</p>}<section className="bridgex-glass-panel mt-6 overflow-hidden rounded-3xl border border-[#172126]/10"><div className="border-b border-[#172126]/8 p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#2d8d62]">BridgeX support</p><h1 className="mt-1 text-2xl font-bold">BridgeX Admin</h1><p className="mt-1 text-sm text-[#637073]">Private support conversation</p></div><div className="min-h-[260px] space-y-3 bg-[#f6f4ee]/80 p-5">{visibleSupportMessages.map(message => <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${message.sender_id === user?.id ? "ml-auto bg-[#172126] text-white" : "bridgex-glass-panel text-[#172126]"}`}><p className={`font-bold ${message.sender_id === user?.id ? "text-[#c3d0c9]" : "text-[#176447]"}`}>{message.sender_id === user?.id ? memberName : "BridgeX Admin"}</p><>{message.body.startsWith("📷 Photo attachment\n") ? <img src={message.body.split("\n")[1]} alt="Chat attachment" className="max-h-72 max-w-full rounded-xl object-contain" /> : <p className="whitespace-pre-wrap leading-6">{message.body}</p>}</><p className={`mt-2 text-[10px] ${message.sender_id === user?.id ? "text-[#c3d0c9]" : "text-[#738083]"}`}>{new Date(message.created_at).toLocaleString()}</p></div>)}</div><div className="flex gap-2 border-t border-[#172126]/8 p-4"><Textarea value={supportDraft} onChange={event => setSupportDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendSupport(); } }} placeholder="Reply to BridgeX Admin…" className="min-h-11 flex-1 rounded-xl" /><Button onClick={() => void sendSupport()} disabled={busy || !supportDraft.trim()} className="h-11 rounded-xl bg-[#172126]"><Send className="size-4" /></Button></div></section></div>; }

  const supportUpdates = systemUpdates.filter(isSupportUpdate);
  const latestSupportUpdate = supportUpdates[0];
  const unreadSupportCount = supportUpdates.filter(update => !update.read_at).length;
  const otherSystemUpdates = systemUpdates.filter(update => !isSupportUpdate(update)).slice(0, 30);
  if (!isDetail) return <div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Protected communication</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.055em]">Inbox</h1><p className="mt-2 text-sm text-[#637073]">Accepted protected deals</p></div>{notice && <p className="mt-5 rounded-xl bg-[#f8e8e5] px-3 py-2 text-sm font-semibold text-[#9b4b3e]">{notice}</p>}<div className="mt-7 overflow-hidden rounded-3xl border border-[#172126]/10 bg-white">{deals.length ? deals.map(deal => <button key={deal.id} onClick={() => openDeal(deal.id)} className="flex w-full items-start gap-3 border-b border-[#172126]/6 px-5 py-4 text-left transition hover:bg-[#f0f7f2]"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dff5ea] text-sm font-bold text-[#176447]">{counterpart(deal).slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold">{counterpart(deal)}</span><span className="shrink-0 text-[11px] text-[#687579]">{displayTime(deal.last_message_at || deal.accepted_at)}</span></span><span className="mt-1 flex items-center gap-2"><span className={`truncate text-xs ${unread(deal) ? "font-bold text-[#172126]" : "text-[#687579]"}`}>{deal.last_message_body || `${deal.match_type === "offer" ? "Traveler offer" : "Carry-space interest"} accepted`}</span>{unread(deal) && <span aria-label="Unread message" className="size-2 shrink-0 rounded-full bg-[#2d8d62]" />}</span></span></button>) : <div className="p-10 text-center"><ShieldCheck className="mx-auto size-8 text-[#2d8d62]" /><h2 className="mt-4 font-bold">No accepted match yet.</h2><p className="mt-2 text-sm text-[#647174]">Accepted offers and interests will appear here as protected conversations.</p></div>}</div>{latestSupportUpdate && <section className="mt-8"><div className="flex items-center gap-2"><MessageCircle className="size-4 text-[#2d8d62]" /><h2 className="font-bold">BridgeX Admin</h2></div><div className="mt-3 overflow-hidden rounded-3xl border border-[#172126]/10 bg-white"><button onClick={() => openSupport(latestSupportUpdate)} className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-[#f8faf7]"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dff5ea] text-sm font-bold text-[#176447]">B</span><span className="min-w-0"><span className="flex items-center gap-3"><span className="text-sm font-bold">BridgeX Admin</span><span className="text-[11px] text-[#687579]">{displayTime(latestSupportUpdate.created_at)}</span>{unreadSupportCount > 0 && <span aria-label={`${unreadSupportCount} unread support update${unreadSupportCount === 1 ? "" : "s"}`} className="rounded-full bg-[#e2a33f] px-2 py-0.5 text-[10px] font-bold text-[#5d4304]">{unreadSupportCount}</span>}</span><span className="mt-1 block truncate text-xs text-[#687579]">{latestSupportUpdate.body}</span></span></button></div></section>}<section className="mt-8"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Bell className="size-4 text-[#2d8d62]" /><h2 className="font-bold">Updates</h2></div><button onClick={() => window.location.assign("/notifications")} className="text-xs font-bold text-[#176447] hover:underline">Show all</button></div><p className="mt-1 text-xs text-[#687579]">Newest 30 notifications</p><div className="mt-3 overflow-hidden rounded-3xl border border-[#172126]/10 bg-white">{otherSystemUpdates.length ? otherSystemUpdates.map(update => <button key={update.id} onClick={() => void openSystemUpdate(update)} className="flex w-full items-start gap-3 border-b border-[#172126]/6 px-5 py-4 text-left transition hover:bg-[#f8faf7]"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${update.read_at ? "bg-[#d2d8d5]" : "bg-[#e2a33f]"}`} /><span className="min-w-0"><span className="flex items-center justify-between gap-3"><span className="truncate text-sm font-bold">{update.title}</span><span className="shrink-0 text-[11px] text-[#687579]">{displayTime(update.created_at)}</span></span><span className="mt-1 block truncate text-xs text-[#687579]">{update.body}</span></span></button>) : <p className="p-5 text-sm text-[#647174]">No updates yet.</p>}</div></section></div>;
  if (!selected) return <p className="rounded-2xl bg-white p-6 text-sm text-[#647174]">This protected conversation is no longer available.</p>;

  const dealOrderCount = orders.filter(item => (item.sender_id === user?.id && item.traveler_id === counterpartId(selected)) || (item.traveler_id === user?.id && item.sender_id === counterpartId(selected))).length;
  return <div><Button onClick={openInbox} variant="outline" className="rounded-xl bg-white"><ArrowLeft className="mr-2 size-4" />Back to Inbox</Button>{notice && <p className="mt-5 rounded-xl bg-[#edf8f0] px-3 py-2 text-sm font-semibold text-[#176447]">{notice}</p>}<section className="mt-6 overflow-hidden rounded-3xl border border-[#172126]/10 bg-white"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#172126]/8 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#2d8d62]">{isTraveler ? "Traveler view" : "Sender view"} · protected deal</p><h1 className="mt-1 text-2xl font-bold">{counterpart(selected)}</h1><p className="mt-1 text-sm text-[#637073]">{dealOrderCount} protected order{dealOrderCount === 1 ? "" : "s"} with this member · {order?.reference ?? "Match active"}</p></div><Badge className="bg-[#e7f4ea] text-[#176447] hover:bg-[#e7f4ea]">{order ? statusLabel(order.fulfillment_status) : selected.status}</Badge></div><div className="grid gap-3 border-b border-[#172126]/8 bg-[#fcfdfb] p-4 md:grid-cols-2"><div className="rounded-2xl bg-[#f4faf5] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#537064]">{isTraveler ? "Delivery destination" : "Your delivery details"}</p><p className="mt-3 flex items-start gap-2 text-sm font-semibold"><Phone className="mt-0.5 size-4 text-[#2d8d62]" />{selected.sender_phone}</p><p className="mt-2 flex items-start gap-2 text-sm leading-5 text-[#526063]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />{selected.sender_delivery_address}</p></div><div className="rounded-2xl bg-[#f4faf5] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#537064]">{isTraveler ? "Your pickup details" : "Traveler pickup location"}</p><p className="mt-3 flex items-start gap-2 text-sm font-semibold"><Phone className="mt-0.5 size-4 text-[#2d8d62]" />{selected.traveler_phone}</p><p className="mt-2 flex items-start gap-2 text-sm leading-5 text-[#526063]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#2d8d62]" />{selected.traveler_pickup_address}</p></div><Button onClick={() => void updateMyContact()} disabled={busy} variant="outline" className="rounded-xl bg-white md:col-span-2"><UserRoundPen className="mr-2 size-4" />Edit my protected details</Button>{isTraveler && order && <div className="rounded-2xl border border-[#dce7df] bg-[#f6fbf7] p-4 md:col-span-2"><div className="flex items-center gap-2"><Truck className="size-4 text-[#176447]" /><p className="font-bold">Update delivery status</p></div><p className="mt-1 text-sm text-[#637073]">One click updates the protected order and notifies the sender.</p><div className="mt-3 flex flex-wrap gap-2">{[["china_pickup", "Pickup"], ["received", "Received"], ["in_transit", "Transit"], ["delivered", "Delivered"]].map(([value, label]) => <Button disabled={busy || order.fulfillment_status === value} key={value} onClick={() => void updateTravelerOrder(value)} size="sm" variant="outline" className="rounded-lg bg-white">{label}</Button>)}</div></div>}</div><div className="min-h-0 bg-[#f6f4ee] p-4"><div className="flex items-center gap-2"><MessageCircle className="size-4 text-[#2d8d62]" /><h2 className="font-bold">Private messages with {counterpart(selected)}</h2></div><div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">{messages.length ? messages.map(message => <div key={message.id} className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${message.sender_id === user?.id ? "ml-auto bg-[#172126] text-white" : "bg-white text-[#172126]"}`}><>{message.body.startsWith("📷 Photo attachment\n") ? <img src={message.body.split("\n")[1]} alt="Chat attachment" className="max-h-72 max-w-full rounded-xl object-contain" /> : <p className="whitespace-pre-wrap">{message.body}</p>}</><p className={`mt-1 text-[10px] ${message.sender_id === user?.id ? "text-[#c3d0c9]" : "text-[#738083]"}`}>{new Date(message.created_at).toLocaleString()}</p></div>) : <p className="py-6 text-center text-sm text-[#677477]">No messages yet. Send the first secure delivery message.</p>}</div></div><div className="border-t border-[#172126]/8 bg-white/80 p-3"><div className="flex items-end gap-2 rounded-2xl border border-[#172126]/10 bg-[#f7faf8] p-2 shadow-sm"><input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void sendPhoto(file); event.currentTarget.value = ""; }} /><Button type="button" variant="ghost" aria-label="Add photo" onClick={() => imageInputRef.current?.click()} className="size-10 shrink-0 rounded-xl text-[#176447]"><ImagePlus className="size-5" /></Button><Textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={`Write a message to ${counterpart(selected)}…`} className="min-h-10 flex-1 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0" /><Button type="button" variant="ghost" aria-label={listening ? "Listening" : "Voice typing"} onClick={startVoiceText} className={`size-10 shrink-0 rounded-xl ${listening ? "bg-[#dff5ea] text-[#176447]" : "text-[#176447]"}`}><Mic className="size-5" /></Button><Button type="button" onClick={() => void send()} disabled={busy || !draft.trim()} aria-label="Send message" className="size-10 shrink-0 rounded-xl bg-[#172126]"><Send className="size-4" /></Button></div><p className="mt-2 px-2 text-[11px] text-[#687579]">Enter to send · Shift+Enter for a new line · Photos are compressed before upload</p></div></section></div>;
}
