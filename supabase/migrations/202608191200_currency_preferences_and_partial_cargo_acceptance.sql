ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_currency text NOT NULL DEFAULT 'BDT'
    CHECK (preferred_currency IN ('BDT', 'USD', 'CNY', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD'));

ALTER TABLE public.send_requests
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT'
    CHECK (currency IN ('BDT', 'USD', 'CNY', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD'));
ALTER TABLE public.carry_listings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT'
    CHECK (currency IN ('BDT', 'USD', 'CNY', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD'));
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT'
    CHECK (currency IN ('BDT', 'USD', 'CNY', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD'));
ALTER TABLE public.listing_interests
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT'
    CHECK (currency IN ('BDT', 'USD', 'CNY', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD')),
  ADD COLUMN IF NOT EXISTS accepted_weight_kg numeric;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT'
    CHECK (currency IN ('BDT', 'USD', 'CNY', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'JPY', 'CAD', 'AUD'));

CREATE OR REPLACE FUNCTION public.accept_bridgex_response(p_kind text, p_response_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id uuid;
  v_sender public.users%ROWTYPE;
  v_traveler public.users%ROWTYPE;
  v_request public.send_requests%ROWTYPE;
  v_listing public.carry_listings%ROWTYPE;
  v_offer public.offers%ROWTYPE;
  v_interest public.listing_interests%ROWTYPE;
  v_interest_weight numeric;
  v_remaining_weight numeric;
  v_accepted_weight numeric;
  v_order_amount numeric;
  v_order_currency text;
BEGIN
  IF public.is_bridgex_suspended() THEN RAISE EXCEPTION 'Suspended accounts cannot accept a response.'; END IF;

  IF p_kind = 'offer' THEN
    SELECT * INTO v_offer FROM public.offers WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_request FROM public.send_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_request.id IS NULL OR v_request.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the request owner can accept this offer.'; END IF;
    IF v_offer.status <> 'pending' THEN RAISE EXCEPTION 'This offer is no longer available.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_request.user_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_offer.traveler_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_request.destination_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact delivery or pickup addresses before a match can be accepted.'; END IF;
    UPDATE public.offers SET status = 'accepted', updated_at = now() WHERE id = v_offer.id;
    UPDATE public.offers SET status = 'rejected', updated_at = now() WHERE request_id = v_request.id AND id <> v_offer.id AND status = 'pending';
    UPDATE public.send_requests SET status = 'matched' WHERE id = v_request.id;
    INSERT INTO public.matches (match_type,request_id,offer_id,sender_id,traveler_id,sender_phone,sender_delivery_address,traveler_phone,traveler_pickup_address)
    VALUES ('offer',v_request.id,v_offer.id,v_sender.id,v_traveler.id,v_sender.phone,concat_ws(', ',v_request.destination_address,v_request.destination_city,v_request.destination_country),v_traveler.phone,concat_ws(', ',v_traveler.current_address,v_traveler.current_city,v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (match_id,request_id,sender_id,traveler_id,amount_bdt,currency,fulfillment_status,last_traveler_update_at)
    VALUES (v_match_id,v_request.id,v_sender.id,v_traveler.id,v_offer.amount_bdt,coalesce(v_offer.currency, v_request.currency, 'BDT'),'matched',now());

  ELSIF p_kind = 'interest' THEN
    SELECT * INTO v_interest FROM public.listing_interests WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_listing FROM public.carry_listings WHERE id = v_interest.listing_id FOR UPDATE;
    IF v_interest.id IS NULL OR v_listing.id IS NULL OR v_listing.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the carry-space owner can accept this interest.'; END IF;
    IF v_interest.status <> 'pending' THEN RAISE EXCEPTION 'This interest is no longer available.'; END IF;
    IF v_listing.status <> 'open' THEN RAISE EXCEPTION 'This carry listing is no longer open for new matches.'; END IF;
    v_interest_weight := COALESCE(v_interest.weight_kg, 0);
    v_remaining_weight := v_listing.available_weight_kg - COALESCE(v_listing.filled_weight_kg, 0);
    IF v_interest_weight <= 0 THEN RAISE EXCEPTION 'This interest must include a positive requested weight before it can be accepted.'; END IF;
    IF v_remaining_weight <= 0 THEN RAISE EXCEPTION 'This carry listing has no remaining capacity.'; END IF;
    v_accepted_weight := LEAST(v_interest_weight, v_remaining_weight);
    SELECT * INTO v_sender FROM public.users WHERE id = v_interest.sender_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_listing.user_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_sender.home_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact address details before a match can be accepted.'; END IF;
    UPDATE public.listing_interests SET status = 'accepted', accepted_weight_kg = v_accepted_weight, updated_at = now() WHERE id = v_interest.id;
    UPDATE public.carry_listings SET filled_weight_kg = COALESCE(filled_weight_kg, 0) + v_accepted_weight, status = CASE WHEN COALESCE(filled_weight_kg, 0) + v_accepted_weight >= available_weight_kg THEN 'closed' ELSE 'open' END WHERE id = v_listing.id;
    IF v_accepted_weight >= v_remaining_weight THEN UPDATE public.listing_interests SET status = 'rejected', updated_at = now() WHERE listing_id = v_listing.id AND id <> v_interest.id AND status = 'pending'; END IF;
    v_order_amount := CASE WHEN v_interest.total_offer_bdt IS NOT NULL THEN v_interest.total_offer_bdt * v_accepted_weight / v_interest_weight ELSE v_listing.price_bdt END;
    v_order_currency := coalesce(v_interest.currency, v_listing.currency, 'BDT');
    INSERT INTO public.matches (match_type,listing_id,interest_id,sender_id,traveler_id,sender_phone,sender_delivery_address,traveler_phone,traveler_pickup_address)
    VALUES ('interest',v_listing.id,v_interest.id,v_sender.id,v_traveler.id,v_sender.phone,concat_ws(', ',v_sender.home_address,v_sender.home_city,v_sender.home_country),v_traveler.phone,concat_ws(', ',v_traveler.current_address,v_traveler.current_city,v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (match_id,sender_id,traveler_id,amount_bdt,currency,fulfillment_status,last_traveler_update_at)
    VALUES (v_match_id,v_sender.id,v_traveler.id,v_order_amount,v_order_currency,'matched',now());
  ELSE
    RAISE EXCEPTION 'Unsupported response type.';
  END IF;

  INSERT INTO public.notifications (user_id,actor_id,type,title,body,link,related_id)
  VALUES ((CASE WHEN p_kind = 'offer' THEN v_traveler.id ELSE v_sender.id END),auth.uid(),'match_accepted','Your BridgeX match is ready',CASE WHEN p_kind = 'interest' AND v_accepted_weight < v_interest_weight THEN format('Your match is ready. %s kg of the %s kg interest was accepted because this was the remaining carry capacity.', v_accepted_weight, v_interest_weight) ELSE 'Your contact details and private chat are now available only to your matched counterpart.' END,'/dashboard/deals',v_match_id);
  RETURN v_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_bridgex_response(text, uuid) TO authenticated;
