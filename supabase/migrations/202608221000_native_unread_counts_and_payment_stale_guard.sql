CREATE OR REPLACE FUNCTION public.bridgex_native_unread_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updates integer := 0;
  v_messages integer := 0;
  v_workspace integer := 0;
  v_more integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to read account activity.';
  END IF;

  SELECT count(*)::integer INTO v_updates
  FROM public.notifications
  WHERE user_id = v_user_id AND read_at IS NULL;

  SELECT count(*)::integer INTO v_messages
  FROM public.matches
  WHERE (sender_id = v_user_id OR traveler_id = v_user_id)
    AND last_message_at IS NOT NULL
    AND last_message_sender_id IS DISTINCT FROM v_user_id
    AND (
      (sender_id = v_user_id AND (sender_last_read_at IS NULL OR last_message_at > sender_last_read_at))
      OR (traveler_id = v_user_id AND (traveler_last_read_at IS NULL OR last_message_at > traveler_last_read_at))
    );

  SELECT count(*)::integer INTO v_workspace
  FROM public.notifications
  WHERE user_id = v_user_id
    AND read_at IS NULL
    AND (
      coalesce(link, '') LIKE '/dashboard/offers%'
      OR coalesce(link, '') LIKE '/dashboard/orders%'
      OR coalesce(link, '') LIKE '/dashboard/payments%'
      OR coalesce(type, '') ~ '(offer|interest|payment|order|traveler)'
    );

  SELECT count(*)::integer INTO v_more
  FROM public.notifications
  WHERE user_id = v_user_id
    AND read_at IS NULL
    AND (
      coalesce(link, '') LIKE '/dashboard/profile%'
      OR coalesce(link, '') LIKE '/dashboard/verification%'
      OR coalesce(link, '') LIKE '/admin%'
      OR coalesce(type, '') ~ '(verification|account|contact|report|admin|privacy)'
    );

  RETURN jsonb_build_object('updates', v_updates, 'messages', v_messages, 'workspace', v_workspace, 'more', v_more);
END;
$$;

REVOKE ALL ON FUNCTION public.bridgex_native_unread_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bridgex_native_unread_counts() TO authenticated;

UPDATE public.bridgex_payment_proofs AS payment
SET status = 'cancelled',
    reviewer_note = COALESCE(payment.reviewer_note, 'This payment request was closed because another traveler was selected for the request.'),
    updated_at = now()
FROM public.offers AS offer
WHERE payment.response_kind = 'offer'
  AND payment.response_id = offer.id
  AND payment.status IN ('pending_payment', 'rejected')
  AND offer.status IN ('rejected', 'withdrawn');

CREATE OR REPLACE FUNCTION public.submit_bridgex_payment_proof(
  p_payment_id uuid,
  p_payment_method text,
  p_proof_path text,
  p_payer_reference text DEFAULT NULL,
  p_payer_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_payment public.bridgex_payment_proofs%ROWTYPE;
  v_offer public.offers%ROWTYPE;
  v_interest public.listing_interests%ROWTYPE;
BEGIN
  IF public.is_bridgex_suspended() THEN
    RAISE EXCEPTION 'Restricted accounts cannot submit payment proof.';
  END IF;

  SELECT * INTO v_payment
  FROM public.bridgex_payment_proofs
  WHERE id = p_payment_id
  FOR UPDATE;

  IF v_payment.id IS NULL OR v_payment.payer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the payment sender can submit this proof.';
  END IF;
  IF v_payment.status NOT IN ('pending_payment', 'rejected') THEN
    RAISE EXCEPTION 'This payment is not ready for a new proof submission.';
  END IF;
  IF p_payment_method NOT IN ('alipay', 'wechat_pay') THEN
    RAISE EXCEPTION 'Choose Alipay or WeChat Pay.';
  END IF;
  IF coalesce(trim(p_proof_path), '') = '' OR p_proof_path NOT LIKE auth.uid()::text || '/%' THEN
    RAISE EXCEPTION 'Upload the screenshot before submitting.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'payment-proofs' AND name = p_proof_path) THEN
    RAISE EXCEPTION 'The screenshot was not stored. Upload it again before submitting.';
  END IF;

  IF v_payment.response_kind = 'offer' THEN
    SELECT * INTO v_offer FROM public.offers WHERE id = v_payment.response_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_offer.status <> 'pending_payment' THEN
      RAISE EXCEPTION 'This payment request is closed because the offer is no longer the selected active traveler. Do not send payment for this closed request.';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM public.offers AS other_offer
      WHERE other_offer.request_id = v_offer.request_id
        AND other_offer.id <> v_offer.id
        AND other_offer.status IN ('pending_payment', 'payment_verifying', 'accepted')
    ) THEN
      RAISE EXCEPTION 'Another traveler is already the active protected selection for this request. This payment request is closed.';
    END IF;
  ELSE
    SELECT * INTO v_interest FROM public.listing_interests WHERE id = v_payment.response_id FOR UPDATE;
    IF v_interest.id IS NULL OR v_interest.status <> 'pending_payment' THEN
      RAISE EXCEPTION 'This payment request is closed because the carry-space interest is no longer awaiting payment.';
    END IF;
  END IF;

  UPDATE public.bridgex_payment_proofs
  SET status = 'payment_verifying',
      payment_method = p_payment_method,
      proof_path = p_proof_path,
      payer_reference = nullif(trim(p_payer_reference), ''),
      payer_note = nullif(trim(p_payer_note), ''),
      submitted_at = now(),
      verified_by = NULL,
      verified_at = NULL,
      reviewer_note = NULL,
      updated_at = now()
  WHERE id = v_payment.id;

  IF v_payment.response_kind = 'offer' THEN
    UPDATE public.offers SET status = 'payment_verifying', updated_at = now() WHERE id = v_offer.id;
  ELSE
    UPDATE public.listing_interests SET status = 'payment_verifying', updated_at = now() WHERE id = v_interest.id;
  END IF;
END;
$$;
