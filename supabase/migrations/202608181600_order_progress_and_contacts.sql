ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_traveler_update_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reminder_days integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS orders_match_id_unique ON public.orders(match_id) WHERE match_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_bridgex_traveler_order(p_order_id uuid, p_fulfillment_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL OR v_order.traveler_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the matched traveler can update this order.';
  END IF;
  IF p_fulfillment_status NOT IN ('china_pickup','received','in_transit','delivered') THEN
    RAISE EXCEPTION 'Unsupported traveler update.';
  END IF;
  UPDATE public.orders SET fulfillment_status = p_fulfillment_status, last_traveler_update_at = now(), last_reminder_at = NULL, reminder_days = 0, updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES (v_order.sender_id, auth.uid(), 'traveler_order_update', 'Traveler updated your order', concat('Order ', v_order.reference, ' is now ', replace(p_fulfillment_status, '_', ' '), '.'), '/dashboard/orders', p_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_bridgex_match_contact(p_match_id uuid, p_phone text, p_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_match public.matches%ROWTYPE;
DECLARE v_recipient uuid;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF v_match.id IS NULL OR v_match.status <> 'active' THEN RAISE EXCEPTION 'This protected match is unavailable.'; END IF;
  IF coalesce(trim(p_phone),'') = '' OR coalesce(trim(p_address),'') = '' THEN RAISE EXCEPTION 'Phone and exact address are required.'; END IF;
  IF v_match.sender_id = auth.uid() THEN
    UPDATE public.matches SET sender_phone = trim(p_phone), sender_delivery_address = trim(p_address) WHERE id = p_match_id;
    v_recipient := v_match.traveler_id;
  ELSIF v_match.traveler_id = auth.uid() THEN
    UPDATE public.matches SET traveler_phone = trim(p_phone), traveler_pickup_address = trim(p_address) WHERE id = p_match_id;
    v_recipient := v_match.sender_id;
  ELSE
    RAISE EXCEPTION 'Only a matched participant can update contact details.';
  END IF;
  INSERT INTO public.match_messages (match_id, sender_id, body) VALUES (p_match_id, auth.uid(), 'I updated my protected contact details. Please review the current phone and exact address above.');
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) VALUES (v_recipient, auth.uid(), 'match_contact_updated', 'Protected contact details updated', 'Your matched counterpart updated their private contact details.', '/dashboard/deals', p_match_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_bridgex_overdue_traveler_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_order record;
DECLARE v_count integer := 0;
BEGIN
  FOR v_order IN SELECT * FROM public.orders WHERE fulfillment_status IN ('matched','china_pickup','received','in_transit') AND coalesce(last_traveler_update_at, updated_at, created_at) < now() - interval '1 day' AND (last_reminder_at IS NULL OR last_reminder_at < now() - interval '20 hours') LOOP
    UPDATE public.orders SET last_reminder_at = now(), reminder_days = reminder_days + 1, updated_at = updated_at WHERE id = v_order.id;
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) VALUES (v_order.traveler_id, NULL, 'traveler_update_reminder', 'Update your active BridgeX order', concat('Please update order ', v_order.reference, ' today so the sender can follow progress.'), '/dashboard/orders', v_order.id);
    IF v_order.reminder_days + 1 >= 3 THEN
      INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) SELECT id, NULL, 'traveler_update_escalation', 'Traveler update needs attention', concat('Order ', v_order.reference, ' has not received a traveler update for three reminder days.'), '/admin/orders', v_order.id FROM public.users WHERE role IN ('admin','super_admin') AND suspended = false;
    END IF;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_bridgex_response(p_kind text, p_response_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_match_id uuid; v_sender public.users%ROWTYPE; v_traveler public.users%ROWTYPE; v_request public.send_requests%ROWTYPE; v_listing public.carry_listings%ROWTYPE; v_offer public.offers%ROWTYPE; v_interest public.listing_interests%ROWTYPE;
BEGIN
  IF public.is_bridgex_suspended() THEN RAISE EXCEPTION 'Suspended accounts cannot accept a response.'; END IF;
  IF p_kind = 'offer' THEN
    SELECT * INTO v_offer FROM public.offers WHERE id = p_response_id FOR UPDATE; SELECT * INTO v_request FROM public.send_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_request.id IS NULL OR v_request.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the request owner can accept this offer.'; END IF;
    IF v_offer.status <> 'pending' THEN RAISE EXCEPTION 'This offer is no longer available.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_request.user_id; SELECT * INTO v_traveler FROM public.users WHERE id = v_offer.traveler_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_request.destination_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact delivery or pickup addresses before a match can be accepted.'; END IF;
    UPDATE public.offers SET status = 'accepted', updated_at = now() WHERE id = v_offer.id; UPDATE public.offers SET status = 'rejected', updated_at = now() WHERE request_id = v_request.id AND id <> v_offer.id AND status = 'pending'; UPDATE public.send_requests SET status = 'matched' WHERE id = v_request.id;
    INSERT INTO public.matches (match_type,request_id,offer_id,sender_id,traveler_id,sender_phone,sender_delivery_address,traveler_phone,traveler_pickup_address) VALUES ('offer',v_request.id,v_offer.id,v_sender.id,v_traveler.id,v_sender.phone,concat_ws(', ',v_request.destination_address,v_request.destination_city,v_request.destination_country),v_traveler.phone,concat_ws(', ',v_traveler.current_address,v_traveler.current_city,v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (match_id,request_id,sender_id,traveler_id,amount_bdt,fulfillment_status,last_traveler_update_at) VALUES (v_match_id,v_request.id,v_sender.id,v_traveler.id,v_offer.amount_bdt,'matched',now());
  ELSIF p_kind = 'interest' THEN
    SELECT * INTO v_interest FROM public.listing_interests WHERE id = p_response_id FOR UPDATE; SELECT * INTO v_listing FROM public.carry_listings WHERE id = v_interest.listing_id FOR UPDATE;
    IF v_interest.id IS NULL OR v_listing.id IS NULL OR v_listing.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the carry-space owner can accept this interest.'; END IF;
    IF v_interest.status <> 'pending' THEN RAISE EXCEPTION 'This interest is no longer available.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_interest.sender_id; SELECT * INTO v_traveler FROM public.users WHERE id = v_listing.user_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_sender.home_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact address details before a match can be accepted.'; END IF;
    UPDATE public.listing_interests SET status = 'accepted', updated_at = now() WHERE id = v_interest.id; UPDATE public.listing_interests SET status = 'rejected', updated_at = now() WHERE listing_id = v_listing.id AND id <> v_interest.id AND status = 'pending'; UPDATE public.carry_listings SET status = 'closed' WHERE id = v_listing.id;
    INSERT INTO public.matches (match_type,listing_id,interest_id,sender_id,traveler_id,sender_phone,sender_delivery_address,traveler_phone,traveler_pickup_address) VALUES ('interest',v_listing.id,v_interest.id,v_sender.id,v_traveler.id,v_sender.phone,concat_ws(', ',v_sender.home_address,v_sender.home_city,v_sender.home_country),v_traveler.phone,concat_ws(', ',v_traveler.current_address,v_traveler.current_city,v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (match_id,sender_id,traveler_id,amount_bdt,fulfillment_status,last_traveler_update_at) VALUES (v_match_id,v_sender.id,v_traveler.id,v_listing.price_bdt,'matched',now());
  ELSE RAISE EXCEPTION 'Unsupported response type.'; END IF;
  INSERT INTO public.notifications (user_id,actor_id,type,title,body,link,related_id) VALUES ((CASE WHEN p_kind = 'offer' THEN v_traveler.id ELSE v_sender.id END),auth.uid(),'match_accepted','Your BridgeX match is ready','Your contact details and private chat are now available only to your matched counterpart.','/dashboard/deals',v_match_id);
  RETURN v_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_bridgex_traveler_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_bridgex_match_contact(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_bridgex_overdue_traveler_reminders() TO anon, authenticated;
