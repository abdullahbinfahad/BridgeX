CREATE TABLE IF NOT EXISTS public.bridgex_payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('BP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  response_kind text NOT NULL CHECK (response_kind IN ('offer', 'interest')),
  response_id uuid NOT NULL,
  request_id uuid REFERENCES public.send_requests(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.carry_listings(id) ON DELETE SET NULL,
  payer_id uuid NOT NULL REFERENCES public.users(id),
  owner_id uuid NOT NULL REFERENCES public.users(id),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'BDT',
  payment_method text CHECK (payment_method IN ('alipay', 'wechat_pay')),
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'payment_verifying', 'verified', 'rejected', 'cancelled')),
  proof_path text,
  payer_reference text,
  payer_note text,
  submitted_at timestamptz,
  verified_by uuid REFERENCES public.users(id),
  verified_at timestamptz,
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bridgex_payment_proofs_one_source CHECK ((response_kind = 'offer' AND request_id IS NOT NULL AND listing_id IS NULL) OR (response_kind = 'interest' AND listing_id IS NOT NULL AND request_id IS NULL)),
  UNIQUE (response_kind, response_id)
);

ALTER TABLE public.carry_listings
  ADD COLUMN IF NOT EXISTS reserved_weight_kg numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS bridgex_payment_proofs_payer_status_idx ON public.bridgex_payment_proofs (payer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS bridgex_payment_proofs_status_idx ON public.bridgex_payment_proofs (status, submitted_at DESC);

ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_status_check;
ALTER TABLE public.offers ADD CONSTRAINT offers_status_check
  CHECK (status IN ('pending', 'pending_payment', 'payment_verifying', 'accepted', 'rejected', 'withdrawn'));

ALTER TABLE public.listing_interests DROP CONSTRAINT IF EXISTS listing_interests_status_check;
ALTER TABLE public.listing_interests ADD CONSTRAINT listing_interests_status_check
  CHECK (status IN ('pending', 'pending_payment', 'payment_verifying', 'accepted', 'rejected', 'withdrawn'));

CREATE OR REPLACE FUNCTION public.enforce_bridgex_manual_qr_cny()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF new.currency <> 'CNY' THEN
    RAISE EXCEPTION 'Manual Alipay and WeChat Pay QR payments are available only for CNY transactions. Select CNY before starting payment.';
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS bridgex_manual_qr_cny_only ON public.bridgex_payment_proofs;
CREATE TRIGGER bridgex_manual_qr_cny_only
  BEFORE INSERT OR UPDATE OF currency ON public.bridgex_payment_proofs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_bridgex_manual_qr_cny();

ALTER TABLE public.bridgex_payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY bridgex_payment_proofs_read_participant_or_admin
  ON public.bridgex_payment_proofs FOR SELECT TO authenticated
  USING (payer_id = auth.uid() OR owner_id = auth.uid() OR public.is_bridgex_admin());

CREATE POLICY bridgex_payment_proofs_admin_update
  ON public.bridgex_payment_proofs FOR UPDATE TO authenticated
  USING (public.is_bridgex_admin()) WITH CHECK (public.is_bridgex_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS payment_proofs_upload_own ON storage.objects;
CREATE POLICY payment_proofs_upload_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS payment_proofs_read_owner_or_admin ON storage.objects;
CREATE POLICY payment_proofs_read_owner_or_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND (name LIKE auth.uid()::text || '/%' OR public.is_bridgex_admin()));

DROP POLICY IF EXISTS payment_proofs_update_own ON storage.objects;
CREATE POLICY payment_proofs_update_own
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-proofs' AND name LIKE auth.uid()::text || '/%')
  WITH CHECK (bucket_id = 'payment-proofs' AND name LIKE auth.uid()::text || '/%');

CREATE OR REPLACE FUNCTION public.start_bridgex_payment(p_kind text, p_response_id uuid)
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
  IF public.is_bridgex_suspended() THEN RAISE EXCEPTION 'Restricted accounts cannot start a payment review.'; END IF;

  IF p_kind = 'offer' THEN
    SELECT * INTO v_offer FROM public.offers WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_request FROM public.send_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_request.id IS NULL OR v_request.user_id <> auth.uid() THEN RAISE EXCEPTION 'Only the request owner can select this traveler offer for payment.'; END IF;
    IF v_offer.status <> 'pending' THEN RAISE EXCEPTION 'This offer is no longer available for payment.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_request.user_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_offer.traveler_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_request.destination_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact delivery or pickup addresses before payment can begin.'; END IF;
    v_amount := v_offer.amount_bdt;
    v_currency := coalesce(v_offer.currency, v_request.currency, 'BDT');
    UPDATE public.offers SET status = 'pending_payment', updated_at = now() WHERE id = v_offer.id;
    UPDATE public.send_requests SET status = 'payment_pending' WHERE id = v_request.id;
    INSERT INTO public.bridgex_payment_proofs (response_kind, response_id, request_id, payer_id, owner_id, amount, currency)
    VALUES ('offer', v_offer.id, v_request.id, v_sender.id, v_sender.id, v_amount, v_currency)
    RETURNING id INTO v_payment_id;

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
    INSERT INTO public.bridgex_payment_proofs (response_kind, response_id, listing_id, payer_id, owner_id, amount, currency)
    VALUES ('interest', v_interest.id, v_listing.id, v_sender.id, v_traveler.id, v_amount, v_currency)
    RETURNING id INTO v_payment_id;
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    VALUES (v_sender.id, auth.uid(), 'payment_required', 'Payment required for your carry-space interest', 'The traveler selected your interest. Pay the exact amount, upload your payment screenshot, and wait for administrator verification before the protected deal opens.', '/dashboard/payments', v_payment_id);
  ELSE
    RAISE EXCEPTION 'Unsupported response type.';
  END IF;

  RETURN v_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_bridgex_payment_proof(p_payment_id uuid, p_payment_method text, p_proof_path text, p_payer_reference text DEFAULT NULL, p_payer_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.bridgex_payment_proofs%ROWTYPE;
BEGIN
  IF public.is_bridgex_suspended() THEN RAISE EXCEPTION 'Restricted accounts cannot submit payment proof.'; END IF;
  SELECT * INTO v_payment FROM public.bridgex_payment_proofs WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.id IS NULL OR v_payment.payer_id <> auth.uid() THEN RAISE EXCEPTION 'Only the payment sender can submit this proof.'; END IF;
  IF v_payment.status NOT IN ('pending_payment', 'rejected') THEN RAISE EXCEPTION 'This payment is not ready for a new proof submission.'; END IF;
  IF p_payment_method NOT IN ('alipay', 'wechat_pay') THEN RAISE EXCEPTION 'Choose Alipay or WeChat Pay.'; END IF;
  IF coalesce(trim(p_proof_path), '') = '' OR p_proof_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Upload the payment screenshot to your own protected payment-proof folder first.'; END IF;
  UPDATE public.bridgex_payment_proofs
  SET status = 'payment_verifying', payment_method = p_payment_method, proof_path = p_proof_path, payer_reference = nullif(trim(p_payer_reference), ''), payer_note = nullif(trim(p_payer_note), ''), submitted_at = now(), verified_by = NULL, verified_at = NULL, reviewer_note = NULL, updated_at = now()
  WHERE id = v_payment.id;
  IF v_payment.response_kind = 'offer' THEN
    UPDATE public.offers SET status = 'payment_verifying', updated_at = now() WHERE id = v_payment.response_id;
  ELSE
    UPDATE public.listing_interests SET status = 'payment_verifying', updated_at = now() WHERE id = v_payment.response_id;
  END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT id, auth.uid(), 'payment_verifying', 'Payment proof requires verification', format('A member submitted payment proof for %s. Open Payment verification to review the screenshot and exact amount.', v_payment.reference), '/admin/payments', v_payment.id
  FROM public.users WHERE role IN ('admin', 'super_admin') AND coalesce(suspended, false) = false;
  IF v_payment.owner_id <> v_payment.payer_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    VALUES (v_payment.owner_id, auth.uid(), 'payment_verifying', 'Payment proof is being verified', 'The sender uploaded payment proof. Your acceptance remains pending until an administrator verifies it.', '/dashboard/offers', v_payment.id);
  END IF;
END;
$$;

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
  v_payment public.bridgex_payment_proofs%ROWTYPE;
  v_accepted_weight numeric;
  v_order_amount numeric;
  v_order_currency text;
BEGIN
  IF NOT public.is_bridgex_admin() THEN RAISE EXCEPTION 'Only an administrator can complete a payment-verified acceptance.'; END IF;
  SELECT * INTO v_payment FROM public.bridgex_payment_proofs WHERE response_kind = p_kind AND response_id = p_response_id AND status = 'verified' FOR UPDATE;
  IF v_payment.id IS NULL THEN RAISE EXCEPTION 'A verified payment proof is required before this acceptance can complete.'; END IF;

  IF p_kind = 'offer' THEN
    SELECT * INTO v_offer FROM public.offers WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_request FROM public.send_requests WHERE id = v_offer.request_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_request.id IS NULL OR v_offer.status <> 'payment_verifying' THEN RAISE EXCEPTION 'This offer is no longer awaiting a verified payment.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_request.user_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_offer.traveler_id;
    IF coalesce(v_sender.phone,'') = '' OR coalesce(v_request.destination_address,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact delivery or pickup addresses before acceptance can complete.'; END IF;
    UPDATE public.offers SET status = 'accepted', updated_at = now() WHERE id = v_offer.id;
    UPDATE public.offers SET status = 'rejected', updated_at = now() WHERE request_id = v_request.id AND id <> v_offer.id AND status = 'pending';
    UPDATE public.send_requests SET status = 'matched' WHERE id = v_request.id;
    INSERT INTO public.matches (match_type, request_id, offer_id, sender_id, traveler_id, sender_phone, sender_delivery_address, traveler_phone, traveler_pickup_address)
    VALUES ('offer', v_request.id, v_offer.id, v_sender.id, v_traveler.id, v_sender.phone, concat_ws(', ', v_request.destination_address, v_request.destination_city, v_request.destination_country), v_traveler.phone, concat_ws(', ', v_traveler.current_address, v_traveler.current_city, v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (match_id, request_id, sender_id, traveler_id, amount_bdt, currency, fulfillment_status, last_traveler_update_at)
    VALUES (v_match_id, v_request.id, v_sender.id, v_traveler.id, v_offer.amount_bdt, coalesce(v_offer.currency, v_request.currency, 'BDT'), 'matched', now());

  ELSIF p_kind = 'interest' THEN
    SELECT * INTO v_interest FROM public.listing_interests WHERE id = p_response_id FOR UPDATE;
    SELECT * INTO v_listing FROM public.carry_listings WHERE id = v_interest.listing_id FOR UPDATE;
    IF v_interest.id IS NULL OR v_listing.id IS NULL OR v_interest.status <> 'payment_verifying' THEN RAISE EXCEPTION 'This interest is no longer awaiting a verified payment.'; END IF;
    v_accepted_weight := coalesce(v_interest.accepted_weight_kg, 0);
    IF v_accepted_weight <= 0 OR coalesce(v_listing.reserved_weight_kg, 0) < v_accepted_weight THEN RAISE EXCEPTION 'The reserved carry capacity is no longer available for this payment.'; END IF;
    SELECT * INTO v_sender FROM public.users WHERE id = v_interest.sender_id;
    SELECT * INTO v_traveler FROM public.users WHERE id = v_listing.user_id;
    IF coalesce(v_interest.delivery_phone,'') = '' OR coalesce(v_interest.delivery_address,'') = '' OR coalesce(v_interest.delivery_city,'') = '' OR coalesce(v_interest.delivery_country,'') = '' OR coalesce(v_traveler.phone,'') = '' OR coalesce(v_traveler.current_address,'') = '' THEN RAISE EXCEPTION 'Both members must complete phone and exact delivery or pickup details before acceptance can complete.'; END IF;
    UPDATE public.listing_interests SET status = 'accepted', updated_at = now() WHERE id = v_interest.id;
    UPDATE public.carry_listings SET reserved_weight_kg = greatest(0, coalesce(reserved_weight_kg, 0) - v_accepted_weight), filled_weight_kg = coalesce(filled_weight_kg, 0) + v_accepted_weight, status = CASE WHEN coalesce(filled_weight_kg, 0) + v_accepted_weight >= available_weight_kg THEN 'closed' ELSE 'open' END WHERE id = v_listing.id;
    IF coalesce(v_listing.filled_weight_kg, 0) + v_accepted_weight >= v_listing.available_weight_kg THEN UPDATE public.listing_interests SET status = 'rejected', updated_at = now() WHERE listing_id = v_listing.id AND id <> v_interest.id AND status = 'pending'; END IF;
    v_order_amount := v_payment.amount;
    v_order_currency := v_payment.currency;
    INSERT INTO public.matches (match_type, listing_id, interest_id, sender_id, traveler_id, sender_phone, sender_delivery_address, traveler_phone, traveler_pickup_address)
    VALUES ('interest', v_listing.id, v_interest.id, v_sender.id, v_traveler.id, v_interest.delivery_phone, concat_ws(', ', v_interest.delivery_recipient_name, v_interest.delivery_address, v_interest.delivery_city, v_interest.delivery_country), v_traveler.phone, concat_ws(', ', v_traveler.current_address, v_traveler.current_city, v_traveler.current_country)) RETURNING id INTO v_match_id;
    INSERT INTO public.orders (match_id, sender_id, traveler_id, amount_bdt, currency, fulfillment_status, last_traveler_update_at)
    VALUES (v_match_id, v_sender.id, v_traveler.id, v_order_amount, v_order_currency, 'matched', now());
  ELSE
    RAISE EXCEPTION 'Unsupported response type.';
  END IF;
  RETURN v_match_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_bridgex_payment(p_payment_id uuid, p_decision text, p_reviewer_note text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.bridgex_payment_proofs%ROWTYPE;
  v_match_id uuid;
  v_reserved_weight numeric;
BEGIN
  IF NOT public.is_bridgex_admin() THEN RAISE EXCEPTION 'Only an administrator can verify a payment.'; END IF;
  IF p_decision NOT IN ('verified', 'rejected') THEN RAISE EXCEPTION 'Choose verified or rejected.'; END IF;
  SELECT * INTO v_payment FROM public.bridgex_payment_proofs WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.id IS NULL OR v_payment.status <> 'payment_verifying' THEN RAISE EXCEPTION 'This payment is not awaiting verification.'; END IF;

  IF p_decision = 'rejected' THEN
    UPDATE public.bridgex_payment_proofs SET status = 'rejected', verified_by = auth.uid(), verified_at = now(), reviewer_note = nullif(trim(p_reviewer_note), ''), updated_at = now() WHERE id = v_payment.id;
    IF v_payment.response_kind = 'offer' THEN
      UPDATE public.offers SET status = 'pending_payment', updated_at = now() WHERE id = v_payment.response_id;
    ELSE
      SELECT accepted_weight_kg INTO v_reserved_weight FROM public.listing_interests WHERE id = v_payment.response_id FOR UPDATE;
      UPDATE public.listing_interests SET status = 'pending_payment', updated_at = now() WHERE id = v_payment.response_id;
      UPDATE public.carry_listings SET reserved_weight_kg = greatest(0, coalesce(reserved_weight_kg, 0) - coalesce(v_reserved_weight, 0)), status = 'open' WHERE id = v_payment.listing_id;
      UPDATE public.listing_interests SET accepted_weight_kg = NULL WHERE id = v_payment.response_id;
    END IF;
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    VALUES (v_payment.payer_id, auth.uid(), 'payment_rejected', 'Payment proof needs correction', coalesce(nullif(trim(p_reviewer_note), ''), 'The payment proof could not be verified. Review the exact amount and upload a clear replacement screenshot.'), '/dashboard/payments', v_payment.id);
    RETURN NULL;
  END IF;

  UPDATE public.bridgex_payment_proofs SET status = 'verified', verified_by = auth.uid(), verified_at = now(), reviewer_note = nullif(trim(p_reviewer_note), ''), updated_at = now() WHERE id = v_payment.id;
  v_match_id := public.accept_bridgex_response(v_payment.response_kind, v_payment.response_id);
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT participant_id, auth.uid(), 'payment_verified', 'Payment verified — protected deal is open', 'Your payment was verified. Your matched member details, workspace order, and private chat are now available.', '/dashboard/deals', v_match_id
  FROM (SELECT v_payment.payer_id AS participant_id UNION SELECT CASE WHEN v_payment.response_kind = 'offer' THEN (SELECT traveler_id FROM public.offers WHERE id = v_payment.response_id) ELSE (SELECT user_id FROM public.carry_listings WHERE id = v_payment.listing_id) END) participants;
  RETURN v_match_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_bridgex_payment(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_bridgex_payment_proof(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_bridgex_payment(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_bridgex_response(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_bridgex_payment(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_bridgex_payment_proof(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_bridgex_payment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_bridgex_response(text, uuid) TO authenticated;
