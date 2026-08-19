ALTER TABLE public.carry_listings DROP CONSTRAINT IF EXISTS carry_listings_status_check;
ALTER TABLE public.carry_listings ADD CONSTRAINT carry_listings_status_check
  CHECK (status IN ('open', 'payment_pending', 'paused', 'closed', 'released'));

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
  IF v_payment.response_kind = 'offer' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    VALUES (v_payment.payer_id, auth.uid(), 'payment_verified', 'Payment verified — protected deal is open', 'Your payment was verified. Open Messages to review the traveler and protected order details.', '/dashboard/deals', v_match_id);
  ELSE
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    VALUES (v_payment.owner_id, auth.uid(), 'payment_verified', 'Payment verified — review sender product details', 'The sender payment was verified. Open Messages to review the product, delivery details, and protected order.', '/dashboard/deals', v_match_id);
  END IF;
  RETURN v_match_id;
END;
$$;
