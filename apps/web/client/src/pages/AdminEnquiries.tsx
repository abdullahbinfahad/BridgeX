import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Mail, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type Enquiry = { id: string; user_id: string | null; name: string; email: string; subject: string; message: string; reply_body: string | null; status: "open" | "in_review" | "resolved"; created_at: string };
type SupportMessage = { id: string; enquiry_id: string; sender_id: string; body: string; created_at: string };

export default function AdminEnquiries() {
  const [, go] = useLocation();
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contact_enquiries").select("id,user_id,name,email,subject,message,reply_body,status,created_at").order("created_at", { ascending: false }).limit(500);
    setLoading(false);
    if (error) setNotice(error.message); else setRows((data ?? []) as Enquiry[]);
  };

  const loadMessages = async (enquiryId: string) => {
    const { data, error } = await supabase.from("contact_enquiry_messages").select("id,enquiry_id,sender_id,body,created_at").eq("enquiry_id", enquiryId).order("created_at", { ascending: true }).limit(200);
    if (error) setNotice(error.message); else setMessages((data ?? []) as SupportMessage[]);
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (selected) void loadMessages(selected.id); else setMessages([]); }, [selected?.id]);

  const visible = useMemo(() => rows.filter(row => `${row.name} ${row.email} ${row.subject} ${row.message} ${row.status}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);

  const reply = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase.rpc("send_bridgex_contact_reply", { p_enquiry_id: selected.id, p_body: draft.trim() });
    setSending(false);
    if (error) return setNotice(error.message);
    setDraft("");
    setNotice(selected.user_id ? "BridgeX Admin reply sent. The member can read it and reply in Messages." : "Reply saved. This guest enquiry has no signed-in BridgeX inbox recipient.");
    await Promise.all([load(), loadMessages(selected.id)]);
  };

  if (selected) return <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-[#172126]"><div className="mx-auto max-w-4xl"><Button onClick={() => setSelected(null)} variant="outline" className="rounded-xl bg-white"><ArrowLeft className="mr-2 size-4" />All enquiries</Button><section className="mt-6 overflow-hidden rounded-3xl border border-[#172126]/8 bg-white"><div className="border-b border-[#172126]/8 p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">BridgeX support conversation</p><h1 className="mt-2 font-display text-3xl font-bold">{selected.name}</h1><p className="mt-2 text-sm text-[#637073]">{selected.subject} · <a href={`mailto:${selected.email}`} className="font-semibold text-[#176447]">{selected.email}</a></p></div><div className="min-h-[360px] space-y-3 bg-[#f6f4ee] p-5"><div className="max-w-[82%] rounded-2xl bg-white px-4 py-3 text-sm"><p className="font-bold text-[#176447]">{selected.name}</p><p className="mt-2 whitespace-pre-wrap leading-6">{selected.message}</p><p className="mt-2 text-[10px] text-[#738083]">{new Date(selected.created_at).toLocaleString()}</p></div>{messages.map(message => <div key={message.id} className="ml-auto max-w-[82%] rounded-2xl bg-[#172126] px-4 py-3 text-sm text-white"><p className="font-bold text-[#c3d0c9]">BridgeX Admin</p><p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p><p className="mt-2 text-[10px] text-[#c3d0c9]">{new Date(message.created_at).toLocaleString()}</p></div>)}</div><div className="border-t border-[#172126]/8 p-4"><Textarea value={draft} onChange={event => setDraft(event.target.value)} placeholder={`Reply to ${selected.name} as BridgeX Admin…`} className="min-h-24 rounded-xl" /><div className="mt-3 flex justify-end"><Button disabled={sending || !draft.trim()} onClick={() => void reply()} className="rounded-xl bg-[#176447]">{sending ? "Sending…" : "Send BridgeX Admin reply"}</Button></div></div></section>{notice && <p className="mt-4 rounded-xl bg-[#edf8f0] px-3 py-2 text-sm font-semibold text-[#176447]">{notice}</p>}</div></main>;

  return <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-[#172126]"><div className="mx-auto max-w-5xl"><Button onClick={() => go("/admin")} variant="outline" className="rounded-xl bg-white"><ArrowLeft className="mr-2 size-4" />Control panel</Button><div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2d8d62]">Administrator support</p><h1 className="mt-2 font-display text-4xl font-bold">Contact enquiries</h1><p className="mt-2 text-sm text-[#637073]">Select a member name to review the full support conversation and respond.</p></div><Button onClick={() => void load()} variant="outline" className="rounded-xl bg-white"><RefreshCw className="mr-2 size-4" />Refresh</Button></div><div className="mt-6 flex h-11 items-center gap-2 rounded-xl border border-[#172126]/10 bg-white px-3"><Search className="size-4 text-[#647174]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search enquiries" className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></div>{notice && <p className="mt-4 rounded-xl bg-[#edf8f0] px-3 py-2 text-sm font-semibold text-[#176447]">{notice}</p>}<div className="mt-6 grid gap-4">{loading ? <p className="rounded-2xl bg-white p-6">Loading enquiries…</p> : visible.map(row => <article key={row.id} className="rounded-3xl border border-[#172126]/8 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold"><Mail className="mr-2 inline size-4 text-[#2d8d62]" />{row.subject}</p><button onClick={() => setSelected(row)} className="mt-2 text-left text-sm font-bold text-[#176447] hover:underline">{row.name}</button><p className="mt-1 text-sm text-[#637073]">{row.email}</p></div><span className="rounded-full bg-[#e7f4ea] px-2.5 py-1 text-xs font-bold text-[#176447]">{row.status}</span></div><p className="mt-4 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-[#526063]">{row.message}</p><div className="mt-5 flex gap-2"><Button onClick={() => setSelected(row)} size="sm" className="rounded-lg bg-[#176447]">Open chat with {row.name}</Button></div></article>)}</div></div></main>;
}
