DROP POLICY IF EXISTS payment_proofs_admin_read ON storage.objects;
CREATE POLICY payment_proofs_admin_read ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND public.is_bridgex_admin());

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
BEGIN
  IF public.is_bridgex_suspended() THEN RAISE EXCEPTION 'Restricted accounts cannot submit payment proof.'; END IF;
  SELECT * INTO v_payment FROM public.bridgex_payment_proofs WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.id IS NULL OR v_payment.payer_id <> auth.uid() THEN RAISE EXCEPTION 'Only the payment sender can submit this proof.'; END IF;
  IF v_payment.status NOT IN ('pending_payment', 'rejected') THEN RAISE EXCEPTION 'This payment is not ready for a new proof submission.'; END IF;
  IF p_payment_method NOT IN ('alipay', 'wechat_pay') THEN RAISE EXCEPTION 'Choose Alipay or WeChat Pay.'; END IF;
  IF coalesce(trim(p_proof_path), '') = '' OR p_proof_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Upload the screenshot before submitting.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'payment-proofs' AND name = p_proof_path) THEN RAISE EXCEPTION 'The screenshot was not stored. Upload it again before submitting.'; END IF;

  UPDATE public.bridgex_payment_proofs
  SET status = 'payment_verifying', payment_method = p_payment_method, proof_path = p_proof_path,
      payer_reference = nullif(trim(p_payer_reference), ''), payer_note = nullif(trim(p_payer_note), ''),
      submitted_at = now(), verified_by = NULL, verified_at = NULL, reviewer_note = NULL, updated_at = now()
  WHERE id = v_payment.id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Payment proof could not be recorded. Please try again.'; END IF;
  IF v_payment.response_kind = 'offer' THEN
    UPDATE public.offers SET status = 'payment_verifying', updated_at = now() WHERE id = v_payment.response_id;
  ELSE
    UPDATE public.listing_interests SET status = 'payment_verifying', updated_at = now() WHERE id = v_payment.response_id;
  END IF;
END;
$$;
