BEGIN;

CREATE TABLE IF NOT EXISTS public.bridgex_legal_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('send_request', 'carry_listing', 'offer', 'listing_interest', 'protected_acceptance')),
  terms_version text NOT NULL CHECK (char_length(trim(terms_version)) BETWEEN 1 AND 32),
  acknowledgement_text text NOT NULL CHECK (char_length(trim(acknowledgement_text)) >= 20),
  related_type text NOT NULL CHECK (related_type IN ('send_request', 'carry_listing', 'offer', 'listing_interest', 'protected_acceptance')),
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bridgex_legal_acknowledgements_user_created_idx ON public.bridgex_legal_acknowledgements (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bridgex_legal_acknowledgements_related_idx ON public.bridgex_legal_acknowledgements (related_type, related_id);

ALTER TABLE public.bridgex_legal_acknowledgements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bridgex_legal_acknowledgements_insert_own ON public.bridgex_legal_acknowledgements;
CREATE POLICY bridgex_legal_acknowledgements_insert_own ON public.bridgex_legal_acknowledgements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS bridgex_legal_acknowledgements_read_own_or_admin ON public.bridgex_legal_acknowledgements;
CREATE POLICY bridgex_legal_acknowledgements_read_own_or_admin ON public.bridgex_legal_acknowledgements FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_bridgex_admin());

ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.send_requests ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.carry_listings ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.listing_interests ADD COLUMN IF NOT EXISTS terms_version text;

CREATE OR REPLACE FUNCTION public.enforce_bridgex_terms_acknowledgement()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.terms_accepted_at IS NULL OR coalesce(trim(NEW.terms_version), '') <> '2026-08-21' THEN
    RAISE EXCEPTION 'Read and accept the current BridgeX Terms & Conditions before completing this action.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_send_request_terms_acknowledgement ON public.send_requests;
CREATE TRIGGER enforce_send_request_terms_acknowledgement BEFORE INSERT ON public.send_requests FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_terms_acknowledgement();
DROP TRIGGER IF EXISTS enforce_carry_listing_terms_acknowledgement ON public.carry_listings;
CREATE TRIGGER enforce_carry_listing_terms_acknowledgement BEFORE INSERT ON public.carry_listings FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_terms_acknowledgement();
DROP TRIGGER IF EXISTS enforce_offer_terms_acknowledgement ON public.offers;
CREATE TRIGGER enforce_offer_terms_acknowledgement BEFORE INSERT ON public.offers FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_terms_acknowledgement();
DROP TRIGGER IF EXISTS enforce_listing_interest_terms_acknowledgement ON public.listing_interests;
CREATE TRIGGER enforce_listing_interest_terms_acknowledgement BEFORE INSERT ON public.listing_interests FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_terms_acknowledgement();

DROP FUNCTION IF EXISTS public.start_bridgex_payment(text, uuid);
CREATE FUNCTION public.start_bridgex_payment(p_kind text, p_response_id uuid, p_terms_version text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id uuid;
  v_offer public.offers%ROWTYPE;
  v_interest public.listing_interests%ROWTYPE;
  v_request public.send_requests%ROWTYPE;
  v_listing public.carry_listings%ROWTYPE;
  v_sender public.users%ROWTYPE;
  v_traveler public.users%ROWTYPE;
  v_remaining_weight numeric;
  v_reserved_weight numeric;
  v_amount numeric;
  v_currency text;
BEGIN
  IF coalesce(trim(p_terms_version), '') <> '2026-08-21' THEN RAISE EXCEPTION 'Read and accept the current BridgeX Terms & Conditions before starting protected acceptance.'; END IF;
  IF public.is_bridgex_suspended() THEN RAISE EXCEPTION 'Restricted accounts cannot start a payment review.'; END IF;
  IF p_kind = 'offer' THEN
    SELECT * INTO v_offer FROM public.offers WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_request FROM public.send_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_request.id IS NULL OR v_request.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the request owner can select this traveler offer for payment.'; END IF;
    IF v_offer.status <> 'pending' THEN RAISE EXCEPTION 'This offer is no longer available for payment.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_request.user_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_offer.traveler_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_request.destination_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact delivery or pickup addresses before payment can begin.'; END IF;
    v_amount := v_offer.amount_bdt; v_currency := coalesce(v_offer.currency, v_request.currency, 'BDT');
    UPDATE public.offers SET status = 'pending_payment', updated_at = now() WHERE id = v_offer.id;
    UPDATE public.send_requests SET status = 'payment_pending' WHERE id = v_request.id;
    INSERT INTO public.bridgex_payment_proofs (response_kind, response_id, request_id, payer_id, owner_id, amount, currency) VALUES ('offer', v_offer.id, v_request.id, v_sender.id, v_sender.id, v_amount, v_currency) RETURNING id INTO v_payment_id;
  ELSIF p_kind = 'interest' THEN
    SELECT * INTO v_interest FROM public.listing_interests WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_listing FROM public.carry_listings WHERE id = v_interest.listing_id FOR UPDATE;
    IF v_interest.id IS NULL OR v_listing.id IS NULL OR v_listing.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the carry-space owner can select this interest for payment.'; END IF;
    IF v_interest.status <> 'pending' THEN RAISE EXCEPTION 'This interest is no longer available for payment.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_interest.sender_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_listing.user_id;
    IF coalesce(v_interest.delivery_phone,'') = '' OR coalesce(v_interest.delivery_address,'') = '' OR coalesce(v_interest.delivery_city,'') = '' OR coalesce(v_interest.delivery_country,'') = '' THEN RAISE EXCEPTION 'The sender must add a phone number and exact destination delivery location before payment can begin.'; END IF;
    IF coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'The traveler must complete phone and exact pickup details before payment can begin.'; END IF;
    v_remaining_weight := v_listing.available_weight_kg - coalesce(v_listing.filled_weight_kg, 0) - coalesce(v_listing.reserved_weight_kg, 0);
    IF coalesce(v_interest.weight_kg, 0) <= 0 OR v_remaining_weight <= 0 THEN RAISE EXCEPTION 'This carry listing has no available capacity for this interest.'; END IF;
    v_reserved_weight := least(v_interest.weight_kg, v_remaining_weight);
    v_amount := CASE WHEN v_interest.total_offer_bdt IS NOT NULL THEN v_interest.total_offer_bdt * v_reserved_weight / v_interest.weight_kg ELSE v_listing.price_bdt * v_reserved_weight END;
    v_currency := coalesce(v_interest.currency, v_listing.currency, 'BDT');
    UPDATE public.listing_interests SET status = 'pending_payment', accepted_weight_kg = v_reserved_weight, updated_at = now() WHERE id = v_interest.id;
    UPDATE public.carry_listings SET reserved_weight_kg = coalesce(reserved_weight_kg, 0) + v_reserved_weight, status = CASE WHEN coalesce(filled_weight_kg, 0) + coalesce(reserved_weight_kg, 0) + v_reserved_weight >= available_weight_kg THEN 'payment_pending' ELSE 'open' END WHERE id = v_listing.id;
    INSERT INTO public.bridgex_payment_proofs (response_kind, response_id, listing_id, payer_id, owner_id, amount, currency) VALUES ('interest', v_interest.id, v_listing.id, v_sender.id, v_traveler.id, v_amount, v_currency) RETURNING id INTO v_payment_id;
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id) VALUES (v_sender.id, auth.uid(), 'payment_required', 'Payment required for your carry-space interest', 'The traveler selected your interest. Complete the required action in Payments to continue the protected deal.', '/dashboard/payments', v_payment_id);
  ELSE
    RAISE EXCEPTION 'Unsupported response type.';
  END IF;
  INSERT INTO public.bridgex_legal_acknowledgements (user_id, action, terms_version, acknowledgement_text, related_type, related_id)
  VALUES (auth.uid(), 'protected_acceptance', p_terms_version, 'Member confirmed the current Terms & Conditions before starting protected acceptance.', 'protected_acceptance', p_response_id);
  RETURN v_payment_id;
END;
$$;
REVOKE ALL ON FUNCTION public.start_bridgex_payment(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_bridgex_payment(text, uuid, text) TO authenticated;

COMMIT;
