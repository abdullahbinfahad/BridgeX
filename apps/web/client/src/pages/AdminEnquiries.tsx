import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail, MessageCircle, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type Enquiry = { id: string; user_id: string | null; name: string; email: string; subject: string; message: string; reply_body: string | null; status: "open" | "in_review" | "resolved"; created_at: string };
type SupportMessage = { id: string; enquiry_id: string; sender_id: string; body: string; created_at: string };
type ConversationMap = Record<string, SupportMessage[]>;

const messageTime = (value: string) => new Date(value).toLocaleString();

export default function AdminEnquiries() {
  const [, go] = useLocation();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [conversationMap, setConversationMap] = useState<ConversationMap>({});
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = async (enquiryId: string) => {
    const { data, error } = await supabase.from("contact_enquiry_messages").select("id,enquiry_id,sender_id,body,created_at").eq("enquiry_id", enquiryId).order("created_at", { ascending: true }).limit(200);
    if (error) { setNotice(error.message); return; }
    setConversationMap(current => ({ ...current, [enquiryId]: (data ?? []) as SupportMessage[] }));
  };

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase.from("contact_enquiries").select("id,user_id,name,email,subject,message,reply_body,status,created_at").order("created_at", { ascending: false }).limit(500);
    if (showLoading) setLoading(false);
    if (error) { setNotice(error.message); return; }
    const enquiries = (data ?? []) as Enquiry[];
    setRows(enquiries);
    const ids = enquiries.map(row => row.id);
    if (!ids.length) { setConversationMap({}); return; }
    const { data: messageData, error: messageError } = await supabase.from("contact_enquiry_messages").select("id,enquiry_id,sender_id,body,created_at").in("enquiry_id", ids).order("created_at", { ascending: true }).limit(2500);
    if (messageError) { setNotice(messageError.message); return; }
    const grouped = ((messageData ?? []) as SupportMessage[]).reduce<ConversationMap>((map, message) => { (map[message.enquiry_id] ??= []).push(message); return map; }, {});
    setConversationMap(grouped);
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const channel = supabase.channel("admin-contact-enquiries-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_enquiry_messages" }, payload => {
        const message = payload.new as SupportMessage;
        if (!message?.id || !message.enquiry_id) { void load(false); return; }
        setConversationMap(current => {
          const existing = current[message.enquiry_id] ?? [];
          const next = existing.some(item => item.id === message.id) ? existing.map(item => item.id === message.id ? message : item) : [...existing, message];
          return { ...current, [message.enquiry_id]: next.sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()) };
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_enquiries" }, () => void load(false))
      .subscribe();
    const poll = window.setInterval(() => void load(false), 30000);
    return () => { window.clearInterval(poll); void supabase.removeChannel(channel); };
  }, []);
  useEffect(() => { if (selected) void loadMessages(selected.id); }, [selected?.id]);

  const cards = useMemo(() => rows.map(row => {
    const messages = conversationMap[row.id] ?? [];
    const last = messages.at(-1);
    return { row, messages, latestBody: last?.body || row.message, latestAt: last?.created_at || row.created_at, totalMessages: messages.length + 1 };
  }).filter(card => `${card.row.name} ${card.row.email} ${card.row.subject} ${card.latestBody} ${card.row.status}`.toLowerCase().includes(query.toLowerCase())).sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime()), [conversationMap, query, rows]);

  const reply = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase.rpc("send_bridgex_contact_reply", { p_enquiry_id: selected.id, p_body: draft.trim() });
    setSending(false);
    if (error) { setNotice(error.message); return; }
    setDraft("");
    setNotice(selected.user_id ? "BridgeX Admin reply sent. The member can read it and reply in Messages." : "Reply saved. This guest enquiry has no signed-in BridgeX inbox recipient.");
    await Promise.all([load(false), loadMessages(selected.id)]);
  };

  if (selected) {
    const messages = conversationMap[selected.id] ?? [];
    return <main className="min-h-screen bg-[#f7f5ef]/90 px-5 py-8 text-[#172126]"><div className="mx-auto max-w-4xl"><Button onClick={() => setSelected(null)} variant="outline" className="rounded-xl bg-white/80 backdrop-blur-md"><ArrowLeft className="mr-2 size-4" />All enquiries</Button><section className="bridgex-glass-panel mt-6 overflow-hidden rounded-3xl border border-white/80"><div className="border-b border-[#172126]/8 p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">BridgeX support conversation</p><h1 className="mt-2 font-display text-3xl font-bold">{selected.name}</h1><p className="mt-2 text-sm text-[#637073]">{selected.subject} · <a href={`mailto:${selected.email}`} className="font-semibold text-[#176447]">{selected.email}</a></p></div><div className="min-h-[360px] space-y-3 bg-[#f6f4ee]/78 p-5"><div className="bridgex-glass-panel max-w-[82%] rounded-2xl px-4 py-3 text-sm"><p className="font-bold text-[#176447]">{selected.name}</p><p className="mt-2 whitespace-pre-wrap leading-6">{selected.message}</p><p className="mt-2 text-[10px] text-[#738083]">{messageTime(selected.created_at)}</p></div>{messages.map(message => { const isMember = message.sender_id === selected.user_id; return <div key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${isMember ? "bridgex-glass-panel" : "ml-auto bg-[#172126] text-white"}`}><p className={`font-bold ${isMember ? "text-[#176447]" : "text-[#c3d0c9]"}`}>{isMember ? selected.name : "BridgeX Admin"}</p><p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p><p className={`mt-2 text-[10px] ${isMember ? "text-[#738083]" : "text-[#c3d0c9]"}`}>{messageTime(message.created_at)}</p></div>; })}</div><div className="border-t border-[#172126]/8 p-4"><Textarea value={draft} onChange={event => setDraft(event.target.value)} placeholder={`Reply to ${selected.name} as BridgeX Admin…`} className="min-h-24 rounded-xl bg-white/80 backdrop-blur-md" /><div className="mt-3 flex justify-end"><Button disabled={sending || !draft.trim()} onClick={() => void reply()} className="rounded-xl bg-[#176447]">{sending ? "Sending…" : "Send BridgeX Admin reply"}</Button></div></div></section>{notice && <p className="mt-4 rounded-xl bg-[#edf8f0] px-3 py-2 text-sm font-semibold text-[#176447]">{notice}</p>}</div></main>;
  }

  return <main className="min-h-screen bg-[#f7f5ef]/90 px-5 py-8 text-[#172126]"><div className="mx-auto max-w-5xl"><Button onClick={() => go("/admin")} variant="outline" className="rounded-xl bg-white/80 backdrop-blur-md"><ArrowLeft className="mr-2 size-4" />Control panel</Button><div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Administrator support</p><h1 className="mt-2 font-display text-4xl font-bold">Contact enquiries</h1><p className="mt-2 text-sm text-[#637073]">Live member support conversations, newest message first.</p></div><Button onClick={() => void load()} variant="outline" className="rounded-xl bg-white/80 backdrop-blur-md"><RefreshCw className="mr-2 size-4" />Refresh</Button></div><div className="bridgex-glass-panel mt-6 flex h-11 items-center gap-2 rounded-xl border border-white/80 px-3"><Search className="size-4 text-[#647174]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search member, subject, or latest message" className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></div>{notice && <p className="mt-4 rounded-xl bg-[#edf8f0] px-3 py-2 text-sm font-semibold text-[#176447]">{notice}</p>}<div className="mt-6 grid gap-4">{loading ? <p className="bridgex-glass-panel rounded-2xl p-6">Loading enquiries…</p> : cards.map(({ row, latestBody, latestAt, totalMessages }) => <article key={row.id} className="bridgex-glass-panel rounded-3xl border border-white/80 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold"><Mail className="mr-2 inline size-4 text-[#2d8d62]" />{row.subject}</p><button onClick={() => setSelected(row)} className="mt-2 text-left text-sm font-bold text-[#176447] hover:underline">{row.name}</button><p className="mt-1 text-sm text-[#637073]">{row.email}</p></div><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-[#dff5ea]/85 px-2.5 py-1 text-xs font-bold text-[#176447]"><MessageCircle className="size-3.5" />{totalMessages}</span><span className="rounded-full bg-[#e7f4ea]/85 px-2.5 py-1 text-xs font-bold text-[#176447]">{row.status}</span></div></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.11em] text-[#637073]">Latest message · {messageTime(latestAt)}</p><p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-[#526063]">{latestBody}</p><div className="mt-5 flex gap-2"><Button onClick={() => setSelected(row)} size="sm" className="rounded-lg bg-[#176447]">Open live chat with {row.name}</Button></div></article>)}</div></div></main>;
}
