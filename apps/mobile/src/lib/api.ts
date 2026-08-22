import { cacheGet, cacheSet } from "./cache";
import { supabase } from "./supabase";
import type { BridgeXProfile, MarketplacePost, NativeNotification } from "../types";

const TERMS_VERSION = "2026-08-21";

const asArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export async function loadMemberProfile(userId: string): Promise<BridgeXProfile | null> {
  const { data, error } = await supabase.from("users").select("id,email,full_name,avatar_path,role,verification_status,onboarding_complete,suspended,restriction_reason,preferred_currency,preferred_language,phone,current_country,current_city,current_address,home_country,home_city,home_address,china_address").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (data) await cacheSet(`profile:${userId}`, data);
  return data ?? await cacheGet<BridgeXProfile>(`profile:${userId}`);
}

export async function loadMarketplace(kind: "requests" | "carry", page = 0, pageSize = 40): Promise<MarketplacePost[]> {
  const cacheKey = `marketplace:${kind}:${page}`;
  const from = page * pageSize;
  const result = kind === "requests"
    ? await supabase.from("send_requests").select("id,user_id,title,category,categories,description,purchase_country,purchase_city,destination_country,destination_city,weight_kg,size_description,delivery_required_days,special_handling,budget_bdt,currency,media_paths,image_path,status,created_at").eq("status", "open").order("created_at", { ascending: false }).range(from, from + pageSize - 1)
    : await supabase.from("carry_listings").select("id,user_id,origin_country,origin_city,destination_country,destination_city,transport_mode,available_weight_kg,filled_weight_kg,reserved_weight_kg,price_bdt,currency,accepted_categories,accepted_item_quantities,accepted_item_budgets,departure_at,estimated_delivery_at,airline_name,flight_number,cargo_provider,cargo_reference,notes,media_paths,status,created_at").eq("status", "open").order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (result.error) {
    const fallback = await cacheGet<MarketplacePost[]>(cacheKey);
    if (fallback) return fallback;
    throw result.error;
  }
  const rows = result.data ?? [];
  const ownerIds = Array.from(new Set(rows.map((row: any) => row.user_id).filter(Boolean)));
  const [badges, ratings] = await Promise.all([
    ownerIds.length ? supabase.from("bridgex_member_badges").select("id,display_name,is_verified").in("id", ownerIds) : Promise.resolve({ data: [] as any[] }),
    ownerIds.length ? supabase.from("bridgex_member_rating_summaries").select("id,average_rating,review_count").in("id", ownerIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const badgeById = new Map((badges.data ?? []).map((item: any) => [item.id, item]));
  const ratingById = new Map((ratings.data ?? []).map((item: any) => [item.id, item]));
  const posts = rows.map((row: any): MarketplacePost => {
    const badge: any = badgeById.get(row.user_id); const rating: any = ratingById.get(row.user_id);
    const identity = { posterName: badge?.display_name || "BridgeX member", posterVerified: Boolean(badge?.is_verified), posterRating: Number(rating?.average_rating ?? 0), posterReviewCount: Number(rating?.review_count ?? 0) };
    return kind === "requests"
      ? { id: row.id, kind, ownerId: row.user_id, title: row.title, route: `${row.purchase_city || "Origin"}, ${row.purchase_country || ""} → ${row.destination_city || "Destination"}, ${row.destination_country || ""}`, price: Number(row.budget_bdt ?? 0), currency: row.currency || "BDT", weight: `${row.weight_kg ?? 0} kg`, category: row.category, categories: asArray(row.categories), description: row.description, deliveryDays: row.delivery_required_days, size: row.size_description, specialHandling: row.special_handling, createdAt: row.created_at, mediaPaths: Array.from(new Set([row.image_path, ...asArray(row.media_paths)].filter(Boolean))), status: row.status, ...identity }
      : { id: row.id, kind, ownerId: row.user_id, title: `${row.transport_mode === "cargo" ? "Cargo" : row.transport_mode === "train" ? "Train" : "Carry"} space available`, route: `${row.origin_city || "Origin"}, ${row.origin_country || ""} → ${row.destination_city || "Destination"}, ${row.destination_country || ""}`, price: Number(row.price_bdt ?? 0), currency: row.currency || "BDT", weight: `${Math.max(0, Number(row.available_weight_kg ?? 0) - Number(row.filled_weight_kg ?? 0) - Number(row.reserved_weight_kg ?? 0))} kg remaining`, categories: asArray(row.accepted_categories), transportMode: row.transport_mode, departureAt: row.departure_at, estimatedDeliveryAt: row.estimated_delivery_at, acceptedItemQuantities: row.accepted_item_quantities || {}, acceptedItemBudgets: row.accepted_item_budgets || {}, transportProvider: row.airline_name || row.cargo_provider, transportReference: row.flight_number || row.cargo_reference, description: row.notes, createdAt: row.created_at, mediaPaths: asArray(row.media_paths), status: row.status, ...identity };
  });
  await cacheSet(cacheKey, posts);
  return posts;
}

export async function loadNotifications(userId: string): Promise<NativeNotification[]> {
  const { data, error } = await supabase.from("notifications").select("id,title,body,created_at,read_at,related_id,type,link").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
  if (error) throw error;
  const notices = data ?? [];
  await cacheSet(`notifications:${userId}`, notices);
  return notices;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("user_id", userId);
  if (error) throw error;
}

async function recordAcknowledgement(userId: string, action: "send_request" | "carry_listing", relatedId: string) {
  const { error } = await supabase.from("bridgex_legal_acknowledgements").insert({ user_id: userId, action, terms_version: TERMS_VERSION, acknowledgement_text: "I have read and accept the BridgeX Terms, Safety, and truthful-item requirements.", related_type: action, related_id: relatedId });
  if (error) throw error;
}

export type NativeSendRequestInput = {
  title: string; serviceType: string; categories: string[]; description: string; weightKg: number; size: string; source?: string;
  originCountry: string; purchaseCity: string; destinationCountry: string; destinationCity: string; destinationAddress: string; deliveryDays: number; specialHandling: string;
  budget: number; currency: string; serviceScope: "domestic" | "international"; declaredValue?: number; declarationCurrency?: string; itemPurpose?: string; commercialUse?: boolean; mediaPaths: string[];
};

export async function createNativeSendRequest(userId: string, input: NativeSendRequestInput) {
  const international = input.serviceScope === "international";
  const { data, error } = await supabase.from("send_requests").insert({ user_id: userId, title: input.title.trim(), category: input.serviceType, categories: input.categories, description: input.description.trim(), weight_kg: input.weightKg, size_description: input.size.trim(), product_link: input.source?.trim() || null, image_path: input.mediaPaths[0] || null, media_paths: input.mediaPaths, purchase_country: input.originCountry.trim(), purchase_city: input.purchaseCity.trim(), destination_country: input.destinationCountry.trim(), destination_district: input.destinationCountry.trim(), destination_city: input.destinationCity.trim(), destination_address: input.destinationAddress.trim(), delivery_required_days: input.deliveryDays, special_handling: input.specialHandling, budget_bdt: input.budget, currency: input.currency, service_scope: input.serviceScope, declared_item_value: international ? input.declaredValue : null, declared_item_currency: international ? input.declarationCurrency : null, item_purpose: international ? input.itemPurpose?.trim() : null, declared_commercial_use: international ? Boolean(input.commercialUse) : null, declaration_confirmed_at: international ? new Date().toISOString() : null, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }).select("id").single();
  if (error) throw error;
  await recordAcknowledgement(userId, "send_request", data.id);
  return data.id as string;
}

export type NativeCarryListingInput = {
  originCountry: string; originCity: string; destinationCountry: string; destinationCity: string; destinationAddress: string; transportMode: "flight" | "train" | "cargo";
  departureAt: string; estimatedDeliveryAt?: string; availableWeightKg: number; pricingMode: "per_kg" | "per_item"; price: number; currency: string;
  categories: string[]; acceptedItemQuantities: Record<string, number>; acceptedItemBudgets: Record<string, number>; airline?: string; flightNumber?: string; provider?: string; reference?: string; notes?: string; mediaPaths: string[];
};

export async function createNativeCarryListing(userId: string, input: NativeCarryListingInput) {
  const flight = input.transportMode === "flight";
  const { data, error } = await supabase.from("carry_listings").insert({ user_id: userId, origin_country: input.originCountry.trim(), origin_city: input.originCity.trim(), destination_country: input.destinationCountry.trim(), destination_district: input.destinationCountry.trim(), destination_city: input.destinationCity.trim(), destination_address: input.destinationAddress.trim(), transport_mode: input.transportMode, departure_at: new Date(input.departureAt).toISOString(), estimated_delivery_at: input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt).toISOString() : null, available_weight_kg: input.availableWeightKg, pricing_mode: input.pricingMode, price_bdt: input.price, currency: input.currency, accepted_categories: input.categories, accepted_item_quantities: input.acceptedItemQuantities, accepted_item_budgets: input.acceptedItemBudgets, airline_name: flight ? input.airline?.trim() || null : null, flight_number: flight ? input.flightNumber?.trim() || null : null, cargo_provider: flight ? null : input.provider?.trim() || null, cargo_reference: flight ? null : input.reference?.trim() || null, notes: input.notes?.trim() || null, media_paths: input.mediaPaths, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }).select("id").single();
  if (error) throw error;
  await recordAcknowledgement(userId, "carry_listing", data.id);
  return data.id as string;
}

export type NativeWorkspace = {
  requests: Array<{ id: string; title: string; status: string; purchase_country: string | null; destination_country: string | null; destination_city: string | null; created_at: string }>;
  listings: Array<{ id: string; origin_country: string | null; origin_city: string | null; destination_country: string | null; destination_city: string | null; status: string; departure_at: string; available_weight_kg: number | null }>;
  orders: Array<{ id: string; match_id: string | null; reference: string; sender_id: string; traveler_id: string; amount_bdt: number | null; currency: string | null; escrow_status: string; fulfillment_status: string; updated_at: string; counterpart_name?: string | null; counterpart_verified?: boolean; counterpart_rating?: number; counterpart_review_count?: number }>;
};

export async function loadNativeWorkspace(userId: string): Promise<NativeWorkspace> {
  const [requests, listings, orders] = await Promise.all([
    supabase.from("send_requests").select("id,title,status,purchase_country,destination_country,destination_city,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("carry_listings").select("id,origin_country,origin_city,destination_country,destination_city,status,departure_at,available_weight_kg").eq("user_id", userId).order("departure_at", { ascending: true }).limit(50),
    supabase.from("orders").select("id,match_id,reference,sender_id,traveler_id,amount_bdt,currency,escrow_status,fulfillment_status,updated_at").or(`sender_id.eq.${userId},traveler_id.eq.${userId}`).order("updated_at", { ascending: false }).limit(50),
  ]);
  const error = requests.error || listings.error || orders.error;
  if (error) throw error;
  const orderRows = orders.data ?? [];
  const memberIds = Array.from(new Set(orderRows.flatMap((order: any) => [order.sender_id, order.traveler_id]).filter(Boolean)));
  const [badges, ratings] = await Promise.all([
    memberIds.length ? supabase.from("bridgex_member_badges").select("id,display_name,is_verified").in("id", memberIds) : Promise.resolve({ data: [] as any[] }),
    memberIds.length ? supabase.from("bridgex_member_rating_summaries").select("id,average_rating,review_count").in("id", memberIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const badgeById = new Map((badges.data ?? []).map((item: any) => [item.id, item]));
  const ratingById = new Map((ratings.data ?? []).map((item: any) => [item.id, item]));
  const enrichedOrders = orderRows.map((order: any) => {
    const counterpartId = order.sender_id === userId ? order.traveler_id : order.sender_id;
    const badge: any = badgeById.get(counterpartId); const rating: any = ratingById.get(counterpartId);
    return { ...order, counterpart_name: badge?.display_name || "BridgeX member", counterpart_verified: Boolean(badge?.is_verified), counterpart_rating: Number(rating?.average_rating ?? 0), counterpart_review_count: Number(rating?.review_count ?? 0) };
  });
  const workspace = { requests: requests.data ?? [], listings: listings.data ?? [], orders: enrichedOrders } as NativeWorkspace;
  await cacheSet(`workspace:${userId}`, workspace);
  return workspace;
}

export async function updateNativeTravelerOrder(orderId: string, fulfillmentStatus: string) {
  const { error } = await supabase.rpc("update_bridgex_traveler_order", { p_order_id: orderId, p_fulfillment_status: fulfillmentStatus });
  if (error) throw error;
}

export async function confirmNativeSenderDelivery(orderId: string) {
  const { error } = await supabase.rpc("confirm_bridgex_sender_delivery", { p_order_id: orderId });
  if (error) throw error;
}

export type NativeDeal = { id: string; match_type: string; sender_id: string; traveler_id: string; status: string; sender_name: string | null; traveler_name: string | null; sender_last_read_at: string | null; traveler_last_read_at: string | null; last_message_body: string | null; last_message_at: string | null; last_message_sender_id: string | null; accepted_at: string };
export type NativeDealMessage = { id: string; match_id: string; sender_id: string; body: string; created_at: string };

export async function loadNativeDeals(userId: string): Promise<NativeDeal[]> {
  const { data, error } = await supabase.from("matches").select("id,match_type,sender_id,traveler_id,status,sender_name,traveler_name,sender_last_read_at,traveler_last_read_at,last_message_body,last_message_at,last_message_sender_id,accepted_at").or(`sender_id.eq.${userId},traveler_id.eq.${userId}`).order("last_message_at", { ascending: false, nullsFirst: false }).order("accepted_at", { ascending: false }).limit(250);
  if (error) throw error;
  const deals = data ?? [];
  await cacheSet(`deals:${userId}`, deals);
  return deals;
}

export async function loadNativeDealMessages(matchId: string): Promise<NativeDealMessage[]> {
  const { data, error } = await supabase.from("match_messages").select("id,match_id,sender_id,body,created_at").eq("match_id", matchId).order("created_at", { ascending: true }).limit(300);
  if (error) throw error;
  return data ?? [];
}

export async function markNativeDealRead(matchId: string) {
  const { error } = await supabase.rpc("mark_bridgex_match_read", { p_match_id: matchId });
  if (error) throw error;
}

export async function sendNativeDealMessage(userId: string, matchId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await supabase.from("match_messages").insert({ match_id: matchId, sender_id: userId, body: trimmed });
  if (error) throw error;
}

export async function createNativeOffer(input: { requestId: string; travelerId: string; requestOwnerId: string; requestTitle: string; amount: number; currency: string; estimatedDeliveryAt?: string; note?: string }) {
  const { data, error } = await supabase.from("offers").insert({ request_id: input.requestId, traveler_id: input.travelerId, amount_bdt: input.amount, currency: input.currency, estimated_delivery_at: input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt).toISOString() : null, note: input.note?.trim() || null, status: "pending", terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }).select("id").single();
  if (error) throw error;
  await supabase.from("bridgex_legal_acknowledgements").insert({ user_id: input.travelerId, action: "offer", terms_version: TERMS_VERSION, acknowledgement_text: "I have read and accept the BridgeX Terms, Safety, and offer requirements.", related_type: "offer", related_id: data.id });
  await supabase.from("notifications").insert({ user_id: input.requestOwnerId, actor_id: input.travelerId, type: "offer_received", title: "New offer received", body: `A traveler submitted an offer of ${input.currency} ${input.amount.toLocaleString()} for ${input.requestTitle}.`, link: "/dashboard/offers", related_id: input.requestId });
  return data.id as string;
}

export type NativeInterestListing = { id: string; user_id: string; origin_country: string | null; destination_country: string | null; currency: string | null; accepted_categories: string[] | null; accepted_item_quantities: Record<string, number> | null; accepted_item_budgets: Record<string, number> | null; status: string };
export async function loadNativeInterestListing(listingId: string): Promise<NativeInterestListing | null> {
  const { data, error } = await supabase.from("carry_listings").select("id,user_id,origin_country,destination_country,currency,accepted_categories,accepted_item_quantities,accepted_item_budgets,status").eq("id", listingId).eq("status", "open").maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertNativeListingInterest(input: { listing: NativeInterestListing; senderId: string; categories: string[]; itemQuantities?: Record<string, number>; quantityDescription?: string; weightKg: number; offer: number; deliveryRequiredBy: string; recipientName?: string; phone: string; address: string; city: string; country: string; note?: string; serviceScope: "domestic" | "international"; declaredValue?: number; declarationCurrency?: string; itemPurpose?: string; commercialUse?: boolean }) {
  const { data: existing, error: existingError } = await supabase.from("listing_interests").select("id,status").eq("listing_id", input.listing.id).eq("sender_id", input.senderId).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.status === "accepted") throw new Error("Your interest in this carry space is already accepted. Open Messages to continue the protected deal.");
  const international = input.serviceScope === "international";
  const payload = { listing_id: input.listing.id, sender_id: input.senderId, note: input.note?.trim() || null, status: "pending", categories: input.categories, quantity_description: input.quantityDescription?.trim() || null, item_quantities: input.itemQuantities || {}, weight_kg: input.weightKg, total_offer_bdt: input.offer, currency: input.listing.currency || "BDT", delivery_required_by: input.deliveryRequiredBy, delivery_recipient_name: input.recipientName?.trim() || null, delivery_phone: input.phone.trim(), delivery_address: input.address.trim(), delivery_city: input.city.trim(), delivery_country: input.country.trim(), service_scope: input.serviceScope, declared_item_value: international ? input.declaredValue : null, declared_item_currency: international ? input.declarationCurrency : null, item_purpose: international ? input.itemPurpose?.trim() : null, declared_commercial_use: international ? Boolean(input.commercialUse) : null, declaration_confirmed_at: international ? new Date().toISOString() : null, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION };
  const result = existing ? await supabase.from("listing_interests").update(payload).eq("id", existing.id).select("id").single() : await supabase.from("listing_interests").insert(payload).select("id").single();
  if (result.error) throw result.error;
  await supabase.from("bridgex_legal_acknowledgements").insert({ user_id: input.senderId, action: "listing_interest", terms_version: TERMS_VERSION, acknowledgement_text: "I have read and accept the BridgeX Terms, Safety, and truthful-item requirements.", related_type: "listing_interest", related_id: result.data.id });
  await supabase.from("notifications").insert({ user_id: input.listing.user_id, actor_id: input.senderId, type: existing ? "interest_updated" : "interest_received", title: existing ? "Interest updated in your carry space" : "New interest in your carry space", body: `A sender proposed ${input.listing.currency || "BDT"} ${input.offer.toLocaleString()} for ${input.weightKg} kg.`, link: "/dashboard/offers", related_id: input.listing.id });
  return result.data.id as string;
}

export async function updateNativeProfile(userId: string, values: { full_name: string; phone: string; current_country: string; current_city: string; current_address: string; home_country: string; home_city: string; home_address: string; china_address: string; preferred_currency: string; preferred_language: string }) {
  const { error } = await supabase.from("users").update({ ...values, onboarding_complete: Boolean(values.full_name.trim() && values.phone.trim() && values.current_country.trim() && values.current_city.trim() && values.current_address.trim()) }).eq("id", userId);
  if (error) throw error;
}

export async function createNativeVerificationSubmission(userId: string, documentType: "national_id" | "passport" | "student_id", storagePath: string, institutionName?: string) {
  const { error } = await supabase.from("verification_submissions").insert({ user_id: userId, document_type: documentType, storage_path: storagePath, institution_name: institutionName?.trim() || null, consent_confirmed: true, status: "pending" });
  if (error) throw error;
}

export async function markNativeVerificationPending(userId: string) {
  const { error } = await supabase.from("users").update({ verification_status: "pending_review" }).eq("id", userId);
  if (error) throw error;
}

export type NativePayment = { id: string; reference: string; response_kind: "offer" | "interest"; amount: number; currency: string; settlement_currency: string | null; settlement_amount: number | null; exchange_rate: number | null; status: string; payment_method: "alipay" | "wechat_pay" | null; payer_reference: string | null; payer_note: string | null; submitted_at: string | null; reviewer_note: string | null; created_at: string };
export type NativeTravelerPayout = { id: string; order_id: string; amount: number; currency: string; payout_status: string; payout_method: string | null; account_holder: string | null; account_reference: string | null; payment_reference: string | null; administrator_note: string | null; paid_at: string | null; received_at: string | null; created_at: string };

export async function loadNativePayments(userId: string) {
  const [paymentResult, payoutResult] = await Promise.all([
    supabase.from("bridgex_payment_proofs").select("id,reference,response_kind,amount,currency,settlement_currency,settlement_amount,exchange_rate,status,payment_method,payer_reference,payer_note,submitted_at,reviewer_note,created_at").eq("payer_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("bridgex_traveler_payouts").select("id,order_id,amount,currency,payout_status,payout_method,account_holder,account_reference,payment_reference,administrator_note,paid_at,received_at,created_at").eq("traveler_id", userId).order("created_at", { ascending: false }).limit(100),
  ]);
  const error = paymentResult.error || payoutResult.error;
  if (error) throw error;
  return { payments: paymentResult.data as NativePayment[] ?? [], payouts: payoutResult.data as NativeTravelerPayout[] ?? [] };
}

export async function submitNativePaymentProof(input: { paymentId: string; method: "alipay" | "wechat_pay"; proofPath: string; payerReference?: string; payerNote?: string }) {
  const { error } = await supabase.rpc("submit_bridgex_payment_proof", { p_payment_id: input.paymentId, p_payment_method: input.method, p_proof_path: input.proofPath, p_payer_reference: input.payerReference?.trim() || null, p_payer_note: input.payerNote?.trim() || null });
  if (error) throw error;
}

export async function confirmNativePayoutReceived(payoutId: string) {
  const { error } = await supabase.rpc("confirm_bridgex_traveler_payout_received", { p_payout_id: payoutId });
  if (error) throw error;
}

export type NativeAdminMember = { id: string; email: string | null; full_name: string | null; role: string | null; verification_status: string | null; suspended: boolean | null; restriction_reason: string | null; current_country: string | null; current_city: string | null; created_at: string | null };
export async function loadNativeAdminMembers() {
  const { data, error } = await supabase.from("users").select("id,email,full_name,role,verification_status,suspended,restriction_reason,current_country,current_city,created_at").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data as NativeAdminMember[];
}

export async function moderateNativeMember(memberId: string, action: "restrict" | "restore", reason?: string) {
  const { error } = await supabase.rpc("moderate_bridgex_member", { p_user_id: memberId, p_action: action, p_reason: reason?.trim() || null });
  if (error) throw error;
}
