ALTER TABLE public.users ADD COLUMN IF NOT EXISTS home_address text;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS estimated_delivery_at timestamptz;

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type text NOT NULL CHECK (match_type IN ('offer','interest')),
  request_id uuid REFERENCES public.send_requests(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.carry_listings(id) ON DELETE SET NULL,
  offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  interest_id uuid REFERENCES public.listing_interests(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL REFERENCES public.users(id),
  traveler_id uuid NOT NULL REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','disputed')),
  sender_phone text NOT NULL,
  sender_delivery_address text NOT NULL,
  traveler_phone text NOT NULL,
  traveler_pickup_address text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id),
  UNIQUE (interest_id)
);

CREATE TABLE IF NOT EXISTS public.match_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS matches_sender_id_idx ON public.matches(sender_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS matches_traveler_id_idx ON public.matches(traveler_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS match_messages_match_id_idx ON public.match_messages(match_id, created_at ASC);
CREATE INDEX IF NOT EXISTS notifications_user_city_idx ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS send_requests_read_open_or_owner ON public.send_requests;
CREATE POLICY send_requests_read_open_or_owner ON public.send_requests FOR SELECT TO anon, authenticated USING (status = 'open' OR user_id = auth.uid() OR public.is_bridgex_admin());
DROP POLICY IF EXISTS carry_listings_read_open_or_owner ON public.carry_listings;
CREATE POLICY carry_listings_read_open_or_owner ON public.carry_listings FOR SELECT TO anon, authenticated USING (status = 'open' OR user_id = auth.uid() OR public.is_bridgex_admin());

CREATE POLICY matches_read_participant_or_admin ON public.matches FOR SELECT TO authenticated USING (sender_id = auth.uid() OR traveler_id = auth.uid() OR public.is_bridgex_admin());
CREATE POLICY matches_admin_update ON public.matches FOR UPDATE TO authenticated USING (public.is_bridgex_admin()) WITH CHECK (public.is_bridgex_admin());
CREATE POLICY messages_read_participant_or_admin ON public.match_messages FOR SELECT TO authenticated USING (public.is_bridgex_admin() OR EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_messages.match_id AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid())));
CREATE POLICY messages_insert_participant ON public.match_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_messages.match_id AND m.status = 'active' AND (m.sender_id = auth.uid() OR m.traveler_id = auth.uid())));

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
    INSERT INTO public.matches (match_type,request_id,offer_id,sender_id,traveler_id,sender_phone,sender_delivery_address,traveler_phone,traveler_pickup_address) VALUES ('offer',v_request.id,v_offer.id,v_sender.id,v_traveler.id,v_sender.phone,concat_ws(', ',v_request.destination_address,v_request.destination_city,v_request.destination_country),v_traveler.phone,concat_ws(', ',v_traveler.current_address,v_traveler.current_city,v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (request_id,sender_id,traveler_id,amount_bdt) VALUES (v_request.id,v_sender.id,v_traveler.id,v_offer.amount_bdt);
  ELSIF p_kind = 'interest' THEN
    SELECT * INTO v_interest FROM public.listing_interests WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_listing FROM public.carry_listings WHERE id = v_interest.listing_id FOR UPDATE;
    IF v_interest.id IS NULL OR v_listing.id IS NULL OR v_listing.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the carry-space owner can accept this interest.'; END IF;
    IF v_interest.status <> 'pending' THEN RAISE EXCEPTION 'This interest is no longer available.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_interest.sender_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_listing.user_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_sender.home_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact address details before a match can be accepted.'; END IF;
    UPDATE public.listing_interests SET status = 'accepted', updated_at = now() WHERE id = v_interest.id;
    UPDATE public.listing_interests SET status = 'rejected', updated_at = now() WHERE listing_id = v_listing.id AND id <> v_interest.id AND status = 'pending';
    UPDATE public.carry_listings SET status = 'closed' WHERE id = v_listing.id;
    INSERT INTO public.matches (match_type,listing_id,interest_id,sender_id,traveler_id,sender_phone,sender_delivery_address,traveler_phone,traveler_pickup_address) VALUES ('interest',v_listing.id,v_interest.id,v_sender.id,v_traveler.id,v_sender.phone,concat_ws(', ',v_sender.home_address,v_sender.home_city,v_sender.home_country),v_traveler.phone,concat_ws(', ',v_traveler.current_address,v_traveler.current_city,v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (sender_id,traveler_id,amount_bdt) VALUES (v_sender.id,v_traveler.id,v_listing.price_bdt);
  ELSE
    RAISE EXCEPTION 'Unsupported response type.';
  END IF;
  INSERT INTO public.notifications (user_id,actor_id,type,title,body,link,related_id) VALUES ((CASE WHEN p_kind = 'offer' THEN v_traveler.id ELSE v_sender.id END),auth.uid(),'match_accepted','Your BridgeX match is ready','Your contact details and private chat are now available only to your matched counterpart.','/dashboard/deals',v_match_id);
  RETURN v_match_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_city_news(p_city text, p_title text, p_body text, p_link text DEFAULT '/notifications')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF NOT public.is_bridgex_admin() THEN RAISE EXCEPTION 'Only an administrator can publish city news.'; END IF;
  INSERT INTO public.notifications (user_id,actor_id,type,title,body,link)
  SELECT id, auth.uid(), 'city_news', p_title, p_body, p_link FROM public.users WHERE lower(trim(current_city)) = lower(trim(p_city)) AND suspended = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_bridgex_response(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_city_news(text, text, text, text) TO authenticated;
