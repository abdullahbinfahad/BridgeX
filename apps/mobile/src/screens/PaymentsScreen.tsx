import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { confirmNativePayoutReceived, loadNativePaymentInstructions, loadNativePayments, submitNativePaymentProof, type NativePayment, type NativePaymentInstructions, type NativeTravelerPayout } from "../lib/api";
import { uploadNativePaymentProof } from "../lib/media";

export type PaymentFilter = "pending" | "verifying" | "verified" | "received";
type Props = { userId: string; filter?: PaymentFilter; initialPaymentId?: string; onOpenFilter?: (filter: PaymentFilter) => void; onBack?: () => void; unreadCount?: number };
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());

export function PaymentsScreen({ userId, filter, initialPaymentId, onOpenFilter, onBack, unreadCount = 0 }: Props) {
  const [payments, setPayments] = useState<NativePayment[]>([]);
  const [payouts, setPayouts] = useState<NativeTravelerPayout[]>([]);
  const [instructions, setInstructions] = useState<NativePaymentInstructions>({ alipay: "", wechat_pay: "" });
  const [selected, setSelected] = useState<NativePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<"alipay" | "wechat_pay">("alipay");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, qr] = await Promise.all([loadNativePayments(userId), loadNativePaymentInstructions()]);
      setPayments(data.payments); setPayouts(data.payouts); setInstructions(qr);
    } catch (error: any) { Alert.alert("BridgeX", error?.message || "Could not load payment records."); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!initialPaymentId || !payments.length) return; const payment = payments.find(item => item.id === initialPaymentId); if (payment) setSelected(payment); }, [initialPaymentId, payments]);

  const counts = useMemo(() => ({ pending: payments.filter(item => ["pending_payment", "rejected"].includes(item.status)).length, verifying: payments.filter(item => item.status === "payment_verifying").length, verified: payments.filter(item => item.status === "verified").length, received: payouts.filter(item => item.payout_status === "received").length }), [payments, payouts]);
  const chooseProof = async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] as any, quality: 0.68 }); if (!result.canceled) setProof(result.assets[0]); };
  const submit = async () => {
    if (!selected || !proof) return Alert.alert("Payment screenshot required", "Choose a clear screenshot before submitting payment evidence.");
    if (!["pending_payment", "rejected"].includes(selected.status)) return;
    setBusy(true);
    try {
      const path = await uploadNativePaymentProof(userId, selected.id, { uri: proof.uri, name: proof.fileName, mimeType: proof.mimeType });
      await submitNativePaymentProof({ paymentId: selected.id, method, proofPath: path, payerReference: reference, payerNote: note });
      Alert.alert("Payment evidence submitted", "Your screenshot is now in the protected review workflow.");
      setSelected(null); setProof(null); setReference(""); setNote(""); await load();
    } catch (error: any) { Alert.alert("Could not submit evidence", error?.message || "Please try again."); }
    finally { setBusy(false); }
  };
  const confirmPayout = async (payout: NativeTravelerPayout) => {
    Alert.alert("Confirm payout received", "Confirm only after checking your payment account.", [{ text: "Not yet", style: "cancel" }, { text: "Confirm received", onPress: () => void (async () => { try { await confirmNativePayoutReceived(payout.id); await load(); } catch (error: any) { Alert.alert("Could not confirm", error?.message || "Please try again."); } })() }]);
  };
  const filteredPayments = filter === "pending" ? payments.filter(item => ["pending_payment", "rejected"].includes(item.status)) : filter === "verifying" ? payments.filter(item => item.status === "payment_verifying") : filter === "verified" ? payments.filter(item => item.status === "verified") : [];
  const returnToList = () => setSelected(null);
  const qrUrl = method === "alipay" ? instructions.alipay : instructions.wechat_pay;

  if (selected) return <ScrollView style={styles.page} contentContainerStyle={styles.content}><Pressable onPress={returnToList} style={styles.backButton}><Ionicons name="chevron-back" size={17} color="#5e48d7" /><Text style={styles.back}>Back to {filter ? "filtered records" : "payment records"}</Text></Pressable><Text style={styles.eyebrow}>PROTECTED PAYMENT RECORD</Text><Text style={styles.title}>{selected.reference}</Text><View style={styles.record}><View style={styles.recordHero}><View><Text style={styles.amount}>{selected.currency} {Number(selected.amount).toLocaleString()}</Text><Text style={styles.status}>{label(selected.status)}</Text></View><View style={styles.lock}><Ionicons name="shield-checkmark-outline" size={23} color="#5e48d7" /></View></View>{selected.settlement_currency && selected.settlement_amount !== null ? <View style={styles.settlement}><Text style={styles.settlementLabel}>CONVERSION SNAPSHOT</Text><Text style={styles.settlementAmount}>{selected.settlement_currency} {Number(selected.settlement_amount).toLocaleString()}</Text><Text style={styles.settlementCopy}>{selected.currency} {Number(selected.amount).toLocaleString()} at {selected.exchange_rate ? `1 ${selected.currency} = ${Number(selected.exchange_rate).toFixed(4)} ${selected.settlement_currency}` : "the saved platform conversion rate"}.</Text></View> : <View style={styles.infoBox}><Ionicons name="information-circle-outline" size={18} color="#725e1f" /><Text style={styles.infoText}>A settlement conversion is shown only after an authorized payment record has a published rate.</Text></View>}{["pending_payment", "rejected"].includes(selected.status) ? <><Text style={styles.sectionTitle}>Choose payment method</Text><View style={styles.methodRow}>{(["alipay", "wechat_pay"] as const).map(item => <Pressable key={item} onPress={() => setMethod(item)} style={[styles.method, method === item && styles.methodActive]}><Ionicons name={item === "alipay" ? "wallet-outline" : "chatbubble-ellipses-outline"} size={17} color={method === item ? "#fff" : "#5b5276"} /><Text style={[styles.methodText, method === item && styles.methodTextActive]}>{item === "alipay" ? "Alipay" : "WeChat Pay"}</Text></Pressable>)}</View><View style={styles.qrPanel}><View style={styles.qrHead}><View><Text style={styles.qrTitle}>{method === "alipay" ? "Alipay QR instructions" : "WeChat Pay QR instructions"}</Text><Text style={styles.qrCopy}>Scan only the official instruction image shown inside this protected payment record.</Text></View><Ionicons name="qr-code-outline" size={28} color="#5e48d7" /></View>{qrUrl ? <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" accessibilityLabel={`${method} payment QR code`} /> : <View style={styles.qrUnavailable}><Ionicons name="image-outline" size={24} color="#7c719c" /><Text style={styles.qrUnavailableText}>Payment QR is not available yet. Ask an authorized BridgeX administrator to publish the current instruction image.</Text></View>}</View><Field label="Transfer reference (optional)"><TextInput value={reference} onChangeText={setReference} style={styles.input} placeholder="Transaction number or transfer reference" placeholderTextColor="#74748a" /></Field><Pressable onPress={() => void chooseProof()} style={styles.proof}><Ionicons name="image-outline" size={20} color="#5e48d7" /><View style={styles.proofTextWrap}><Text style={styles.proofTitle}>Choose payment screenshot</Text><Text style={styles.proofCopy}>{proof ? proof.fileName || "Image selected" : "A clear image is required before protected review."}</Text></View></Pressable><Field label="Note for reviewer (optional)"><TextInput value={note} onChangeText={setNote} style={[styles.input, styles.longInput]} multiline placeholder="Explain only information relevant to this payment" placeholderTextColor="#74748a" /></Field><Pressable disabled={busy || !proof} onPress={() => void submit()} style={[styles.primary, (busy || !proof) && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Submit payment screenshot</Text>}</Pressable></> : <View style={styles.notice}><Text style={styles.noticeTitle}>{selected.status === "verified" ? "Payment verified" : "Payment review in progress"}</Text><Text style={styles.noticeCopy}>{selected.reviewer_note || "This protected payment record is being reviewed or has completed its current step."}</Text></View>}</View></ScrollView>;

  const visiblePayments = filter ? filteredPayments : payments.slice(0, 30);
  const listTitle = filter === "pending" ? "Pending payment" : filter === "verifying" ? "Payment verifying" : filter === "verified" ? "Payment verified" : filter === "received" ? "Traveler payouts received" : "Recent payment records";
  return <View style={styles.page}><View style={styles.head}>{filter ? <Pressable onPress={onBack} style={styles.backButton}><Ionicons name="chevron-back" size={17} color="#5e48d7" /><Text style={styles.back}>Payments</Text></Pressable> : null}<View style={styles.titleLine}><View><Text style={styles.eyebrow}>PAYMENT WORKSPACE</Text><Text style={styles.title}>{filter ? listTitle : "Payment records"}</Text></View>{unreadCount > 0 ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View> : null}</View><Text style={styles.copy}>{filter ? "Open a record to complete the next protected action or review its status." : "Thirty recent payment records are visible here. Open a status card to focus on what needs your attention."}</Text></View>{loading ? <View style={styles.center}><ActivityIndicator color="#5e48d7" /></View> : <FlatList data={visiblePayments} keyExtractor={item => item.id} contentContainerStyle={styles.list} ListHeaderComponent={<>{!filter ? <View style={styles.stats}><Stat label="Pending" value={counts.pending} onPress={() => onOpenFilter?.("pending")} /><Stat label="Reviewing" value={counts.verifying} onPress={() => onOpenFilter?.("verifying")} /><Stat label="Verified" value={counts.verified} onPress={() => onOpenFilter?.("verified")} /><Stat label="Payouts" value={counts.received} onPress={() => onOpenFilter?.("received")} /></View> : null}<Text style={styles.listTitle}>{listTitle}</Text></>} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No matching records</Text><Text style={styles.emptyCopy}>Payment records appear here as protected matches progress.</Text></View>} renderItem={({ item }) => <Pressable onPress={() => setSelected(item)} style={styles.item}><View style={styles.itemLeft}><View style={styles.itemIcon}><Ionicons name="receipt-outline" size={18} color="#5e48d7" /></View><View><Text style={styles.itemTitle}>{item.reference}</Text><Text style={styles.itemCopy}>{item.currency} {Number(item.amount).toLocaleString()} · {item.response_kind === "offer" ? "Traveler offer" : "Carry-space interest"}</Text>{item.settlement_currency && item.settlement_amount !== null ? <Text style={styles.cny}>≈ {item.settlement_currency} {Number(item.settlement_amount).toLocaleString()}</Text> : null}</View></View><Text style={styles.statusSmall}>{label(item.status)}</Text></Pressable>} ListFooterComponent={filter === "received" ? <PayoutHistory payouts={payouts.filter(payout => payout.payout_status === "received")} onConfirm={confirmPayout} /> : !filter ? <PayoutHistory payouts={payouts.slice(0, 30)} onConfirm={confirmPayout} /> : null} />}</View>;
}

function PayoutHistory({ payouts, onConfirm }: { payouts: NativeTravelerPayout[]; onConfirm: (payout: NativeTravelerPayout) => void }) {
  return <><Text style={styles.listTitle}>Traveler payout history</Text>{payouts.length ? payouts.map(payout => <View key={payout.id} style={styles.item}><View style={styles.itemLeft}><View style={[styles.itemIcon, styles.payoutIcon]}><Ionicons name="airplane-outline" size={17} color="#147853" /></View><View><Text style={styles.itemTitle}>{payout.currency} {Number(payout.amount).toLocaleString()}</Text><Text style={styles.itemCopy}>Order {payout.order_id.slice(0, 8)} · {label(payout.payout_status)}</Text></View></View>{payout.payout_status === "payment_sent" ? <Pressable onPress={() => void onConfirm(payout)} style={styles.confirm}><Text style={styles.confirmText}>Confirm received</Text></Pressable> : <Text style={styles.statusSmall}>{label(payout.payout_status)}</Text>}</View>) : <View style={styles.empty}><Text style={styles.emptyCopy}>Traveler payouts appear after eligible completed orders are released.</Text></View>}</>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>; }
function Stat({ label, value, onPress }: { label: string; value: number; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.stat, pressed && styles.statPressed]}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.open}>Open ›</Text></Pressable>; }

const styles = StyleSheet.create({
  page: { backgroundColor: "#f7f6ff", flex: 1 },
  head: { paddingHorizontal: 20, paddingTop: 5 },
  content: { gap: 14, padding: 20, paddingBottom: 52 },
  titleLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: "#6f5cff", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#211d35", fontFamily: "serif", fontSize: 30, fontWeight: "800", letterSpacing: -0.9, marginTop: 3 },
  copy: { color: "#687287", fontSize: 13, lineHeight: 19, marginTop: 4 },
  unreadBadge: { alignItems: "center", backgroundColor: "#f25d68", borderRadius: 16, justifyContent: "center", minWidth: 28, paddingHorizontal: 7, paddingVertical: 6 },
  unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  list: { gap: 9, padding: 20, paddingTop: 18 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  stat: { backgroundColor: "#fff", borderColor: "#ded8f5", borderRadius: 15, borderWidth: 1, minWidth: "47%", padding: 12 },
  statPressed: { backgroundColor: "#f0edff", borderColor: "#aa9ff1", transform: [{ scale: 0.985 }] },
  statLabel: { color: "#706a87", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  statValue: { color: "#211d35", fontFamily: "serif", fontSize: 26, fontWeight: "800", marginTop: 3 },
  open: { color: "#5e48d7", fontSize: 10, fontWeight: "900", marginTop: 3 },
  listTitle: { color: "#2d2940", fontSize: 16, fontWeight: "900", marginTop: 8 },
  item: { alignItems: "center", backgroundColor: "#fff", borderColor: "#ded8f5", borderRadius: 15, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 13 },
  itemLeft: { alignItems: "center", flex: 1, flexDirection: "row", gap: 10, paddingRight: 8 },
  itemIcon: { alignItems: "center", backgroundColor: "#eeebff", borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  payoutIcon: { backgroundColor: "#e6f9ef" },
  itemTitle: { color: "#2c2940", fontSize: 14, fontWeight: "900" },
  itemCopy: { color: "#6d7081", fontSize: 11, lineHeight: 17, marginTop: 3 },
  cny: { color: "#5e48d7", fontSize: 11, fontWeight: "900", marginTop: 3 },
  statusSmall: { backgroundColor: "#eeeaf9", borderRadius: 20, color: "#5b507f", fontSize: 9, fontWeight: "900", maxWidth: 106, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5, textAlign: "center", textTransform: "uppercase" },
  empty: { alignItems: "center", backgroundColor: "#fff", borderColor: "#ddd8ef", borderRadius: 16, borderStyle: "dashed", borderWidth: 1, padding: 20 },
  emptyTitle: { color: "#2d2940", fontSize: 15, fontWeight: "900" },
  emptyCopy: { color: "#6c7180", fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: "center" },
  backButton: { alignItems: "center", flexDirection: "row", gap: 2, marginBottom: 9, marginTop: 2 },
  back: { color: "#5e48d7", fontSize: 14, fontWeight: "900" },
  record: { backgroundColor: "#fff", borderColor: "#ded8f5", borderRadius: 19, borderWidth: 1, gap: 14, padding: 16 },
  recordHero: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  amount: { color: "#211d35", fontFamily: "serif", fontSize: 30, fontWeight: "800" },
  status: { color: "#5e48d7", fontSize: 12, fontWeight: "900", marginTop: 4 },
  lock: { alignItems: "center", backgroundColor: "#eeebff", borderRadius: 17, height: 39, justifyContent: "center", width: 39 },
  settlement: { backgroundColor: "#ecf8ee", borderColor: "#b3dfc0", borderRadius: 15, borderWidth: 1, padding: 14 },
  settlementLabel: { color: "#317347", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  settlementAmount: { color: "#147844", fontFamily: "serif", fontSize: 29, fontWeight: "800", marginTop: 4 },
  settlementCopy: { color: "#4b7358", fontSize: 12, lineHeight: 18, marginTop: 4 },
  infoBox: { alignItems: "flex-start", backgroundColor: "#fff8e4", borderColor: "#eddaa0", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 8, padding: 12 },
  infoText: { color: "#705f32", flex: 1, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: "#2d2940", fontSize: 15, fontWeight: "900" },
  methodRow: { flexDirection: "row", gap: 8 },
  method: { alignItems: "center", borderColor: "#d9d3ef", borderRadius: 12, borderWidth: 1, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", paddingVertical: 12 },
  methodActive: { backgroundColor: "#5e48d7", borderColor: "#5e48d7" },
  methodText: { color: "#5b5276", fontSize: 13, fontWeight: "900" },
  methodTextActive: { color: "#fff" },
  qrPanel: { backgroundColor: "#f5f3ff", borderColor: "#dcd6f4", borderRadius: 16, borderWidth: 1, padding: 14 },
  qrHead: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  qrTitle: { color: "#332d54", fontSize: 14, fontWeight: "900" },
  qrCopy: { color: "#696382", fontSize: 11, lineHeight: 17, marginTop: 3, maxWidth: 250 },
  qrImage: { alignSelf: "center", backgroundColor: "#fff", borderRadius: 14, height: 210, marginTop: 13, width: 210 },
  qrUnavailable: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d8d2ee", borderRadius: 13, borderStyle: "dashed", borderWidth: 1, gap: 6, marginTop: 13, padding: 16 },
  qrUnavailableText: { color: "#706987", fontSize: 11, lineHeight: 17, textAlign: "center" },
  field: { gap: 7 },
  label: { color: "#2d2940", fontSize: 13, fontWeight: "900" },
  input: { backgroundColor: "#fdfdff", borderColor: "#d9d4ec", borderRadius: 12, borderWidth: 1, color: "#211d35", fontSize: 14, paddingHorizontal: 13, paddingVertical: 12 },
  longInput: { minHeight: 88, textAlignVertical: "top" },
  proof: { alignItems: "center", backgroundColor: "#fff", borderColor: "#bfb6e8", borderRadius: 14, borderStyle: "dashed", borderWidth: 1, flexDirection: "row", gap: 10, padding: 15 },
  proofTextWrap: { flex: 1 },
  proofTitle: { color: "#2d2940", fontSize: 14, fontWeight: "900" },
  proofCopy: { color: "#6d7081", fontSize: 12, marginTop: 4 },
  primary: { alignItems: "center", backgroundColor: "#5e48d7", borderRadius: 14, justifyContent: "center", minHeight: 52 },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  notice: { backgroundColor: "#f0edff", borderColor: "#cec5f2", borderRadius: 14, borderWidth: 1, padding: 14 },
  noticeTitle: { color: "#5e48d7", fontSize: 14, fontWeight: "900" },
  noticeCopy: { color: "#5a5575", fontSize: 12, lineHeight: 18, marginTop: 4 },
  confirm: { backgroundColor: "#168552", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  confirmText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  disabled: { opacity: 0.5 },
});
